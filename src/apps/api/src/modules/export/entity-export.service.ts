import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ExportColumnMetadata,
  getExportColumns,
  getExportEntityOptions,
  parseFiltersFromQuery,
} from '@libs/backend-config';
import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');
import {
  EntityClass,
  ExportFile,
  ExportQuery,
  ExportRequest,
} from './entity-export.types';

@Injectable()
export class EntityExportService {
  async exportFromQuery<T extends object>(request: ExportRequest<T>): Promise<ExportFile> {
    const parsed = this.parseExportQuery(request.query);
    const where = parseFiltersFromQuery<T>(request.query);
    const whereOption = Object.keys(where).length > 0 ? where : undefined;

    const rows = parsed.scope === 'all'
      ? await request.source.findAll({ where: whereOption })
      : (
          await request.source.findAllPaginated({
            where: whereOption,
            page: parsed.page,
            pageSize: parsed.pageSize,
          })
        ).items;

    const columns = this.resolveColumns(request.entity, rows);
    const printableRows = rows.map((row) => this.mapRow(row, columns));
    const exportEntityOptions = getExportEntityOptions(request.entity);
    const fileBaseName = this.resolveFileName({
      fallback: exportEntityOptions?.fileName ?? request.fileNameFallback,
      requested: parsed.requestedFileName,
    });
    const documentTitle = exportEntityOptions?.title ?? this.humanizeKey(request.fileNameFallback);

    if (parsed.format === 'pdf') {
      return {
        fileName: `${fileBaseName}.pdf`,
        extension: 'pdf',
        mimeType: 'application/pdf',
        buffer: await this.generatePdf(columns, printableRows, documentTitle),
      };
    }

    return {
      fileName: `${fileBaseName}.xlsx`,
      extension: 'xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: await this.generateExcel(columns, printableRows, documentTitle),
    };
  }

  private parseExportQuery(query: Record<string, unknown>): ExportQuery {
    const format = String(query.format ?? 'excel').toLowerCase();
    if (format !== 'excel' && format !== 'pdf') {
      throw new BadRequestException('format must be excel or pdf');
    }

    const scope = String(query.scope ?? 'page').toLowerCase();
    if (scope !== 'page' && scope !== 'all') {
      throw new BadRequestException('scope must be page or all');
    }

    const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(1000, Math.max(1, Number.parseInt(String(query.pageSize ?? '10'), 10) || 10));
    const requestedFileName = this.sanitizeFileName(String(query.fileName ?? '').trim());

    return {
      format,
      scope,
      page,
      pageSize,
      requestedFileName: requestedFileName.length > 0 ? requestedFileName : undefined,
    };
  }

  private resolveColumns<T extends object>(
    entity: EntityClass<T>,
    rows: T[],
  ): ExportColumnMetadata[] {
    const decoratedColumns = getExportColumns(entity);
    if (decoratedColumns.length > 0) {
      return decoratedColumns;
    }

    if (rows.length === 0) {
      return [];
    }

    return Object.keys(rows[0] as Record<string, unknown>).map((propertyKey, index) => ({
      propertyKey,
      label: this.humanizeKey(propertyKey),
      order: index,
    }));
  }

  private mapRow<T extends object>(
    row: T,
    columns: ExportColumnMetadata[],
  ): Record<string, string> {
    return columns.reduce<Record<string, string>>((acc, column) => {
      const rawValue = this.getNestedValue(row as Record<string, unknown>, column.propertyKey);
      acc[column.propertyKey] = this.formatValue(rawValue, column);
      return acc;
    }, {});
  }

  private formatValue(value: unknown, column: ExportColumnMetadata): string {
    if (value === undefined || value === null) {
      return '';
    }

    if (column.enumLabels) {
      const label = column.enumLabels[String(value)];
      if (label) {
        return label;
      }
    }

    if (column.formatter === 'boolean') {
      return value ? 'Si' : 'No';
    }

    if (column.formatter === 'date') {
      const date = value instanceof Date ? value : new Date(String(value));
      return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
    }

    if (column.formatter === 'datetime') {
      const date = value instanceof Date ? value : new Date(String(value));
      return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
    }

    if (column.formatter === 'json') {
      return this.formatJsonValue(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'object') {
      return this.safeStringify(value);
    }

    return String(value);
  }

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private formatJsonValue(value: unknown): string {
    if (value === undefined || value === null) {
      return '--';
    }

    let normalizedValue: unknown = value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return '--';
      }

      try {
        normalizedValue = JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }

    if (Array.isArray(normalizedValue)) {
      if (normalizedValue.length === 0) {
        return '--';
      }
      return normalizedValue
        .map((item, index) => `${index + 1}: ${this.formatScalar(item)}`)
        .join('\n');
    }

    if (typeof normalizedValue === 'object' && normalizedValue !== null) {
      const entries = Object.entries(normalizedValue as Record<string, unknown>);
      if (entries.length === 0) {
        return '--';
      }

      return entries
        .map(([key, val]) => `${key}: ${this.formatScalar(val)}`)
        .join('\n');
    }

    return this.formatScalar(normalizedValue);
  }

  private formatScalar(value: unknown): string {
    if (value === undefined || value === null) {
      return '--';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'object') {
      return this.safeStringify(value);
    }

    const text = String(value).trim();
    return text.length > 0 ? text : '--';
  }

  private getNestedValue(source: Record<string, unknown>, path: string): unknown {
    const chunks = path.split('.');
    let current: unknown = source;

    for (const chunk of chunks) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[chunk];
    }

    return current;
  }

  private async generateExcel(
    columns: ExportColumnMetadata[],
    rows: Record<string, string>[],
    sheetName: string,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName.slice(0, 31) || 'Export');

    worksheet.columns = columns.map((column) => ({
      header: column.label,
      key: column.propertyKey,
      width: Math.min(45, Math.max(14, column.label.length + 6)),
    }));

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: Math.max(columns.length, 1) },
    };

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    for (const row of rows) {
      const addedRow = worksheet.addRow(row);
      addedRow.alignment = { vertical: 'top', wrapText: true };

      const lineCount = columns.reduce((max, column) => {
        const cellValue = row[column.propertyKey] ?? '';
        const lines = String(cellValue).split('\n').length;
        return Math.max(max, lines);
      }, 1);

      addedRow.height = Math.min(120, Math.max(18, lineCount * 15));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  }

  private async generatePdf(
    columns: ExportColumnMetadata[],
    rows: Record<string, string>[],
    title: string,
  ): Promise<Buffer> {
    return await new Promise<Buffer>((resolve, reject) => {
      const useLandscape = columns.length > 6;
      const document = new PDFDocument({
        size: 'A4',
        margin: 36,
        layout: useLandscape ? 'landscape' : 'portrait',
      });

      const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('error', reject);
      document.on('end', () => resolve(Buffer.concat(chunks)));

      const pageWidth = document.page.width;
      const pageHeight = document.page.height;
      const margin = 36;
      const minRowHeight = 22;
      const cellPadding = 4;
      let cursorY = margin;

      document.fontSize(16).text(title, margin, cursorY);
      cursorY += 28;

      const printableColumns = columns.length > 0
        ? columns
        : [{
            propertyKey: 'empty',
            label: 'Sin columnas configuradas',
          }];
      const columnWidth = (pageWidth - margin * 2) / printableColumns.length;

      const getRowHeight = (values: string[], isHeader: boolean): number => {
        const fontSize = isHeader ? 9 : 8;
        document.fontSize(fontSize);
        const contentHeight = values.reduce((max, value) => {
          const height = document.heightOfString(value || '', {
            width: columnWidth - cellPadding * 2,
            align: 'left',
          });
          return Math.max(max, height);
        }, 0);

        return Math.max(minRowHeight, Math.min(120, contentHeight + cellPadding * 2));
      };

      const drawRow = (values: string[], isHeader = false): void => {
        const rowHeight = getRowHeight(values, isHeader);

        if (cursorY + rowHeight > pageHeight - margin) {
          document.addPage();
          cursorY = margin;
          if (!isHeader) {
            drawRow(printableColumns.map((column) => column.label), true);
          }
        }

        values.forEach((value, index) => {
          const x = margin + index * columnWidth;
          if (isHeader) {
            document.save();
            document.rect(x, cursorY, columnWidth, rowHeight).fill('#EFEFEF');
            document.restore();
            document.rect(x, cursorY, columnWidth, rowHeight).stroke('#D0D0D0');
          } else {
            document.rect(x, cursorY, columnWidth, rowHeight).stroke('#D0D0D0');
          }

          document
            .fontSize(isHeader ? 9 : 8)
            .fillColor('#111111')
            .text(value, x + cellPadding, cursorY + cellPadding, {
              width: columnWidth - cellPadding * 2,
              height: rowHeight - cellPadding * 2,
            });
        });

        cursorY += rowHeight;
      };

      drawRow(printableColumns.map((column) => column.label), true);

      if (rows.length === 0) {
        const emptyRow = printableColumns.map((_, index) => (index === 0 ? 'Sin datos' : ''));
        drawRow(emptyRow);
      } else {
        for (const row of rows) {
          drawRow(printableColumns.map((column) => row[column.propertyKey] ?? ''));
        }
      }

      document.end();
    });
  }

  private resolveFileName(options: {
    fallback: string;
    requested?: string;
  }): string {
    if (options.requested && options.requested.length > 0) {
      return options.requested;
    }

    const cleanBaseName = this.sanitizeFileName(options.fallback) || 'export';
    const dateStamp = new Date().toISOString().slice(0, 10);
    return `${cleanBaseName}-${dateStamp}`;
  }

  private sanitizeFileName(value: string): string {
    const withoutReservedCharacters = value.replace(/[<>:"/\\|?*]/g, '_');
    const withoutControlCharacters = withoutReservedCharacters
      .split('')
      .map((char) => (char.charCodeAt(0) < 32 ? '_' : char))
      .join('');

    return withoutControlCharacters.replace(/\s+/g, '_');
  }

  private humanizeKey(value: string): string {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (char) => char.toUpperCase());
  }
}
