import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validateSync } from 'class-validator';
import {
  BulkImportCommitResult,
  BulkImportConfig,
  BulkImportRowPayload,
  BulkImportRowValidationResult,
  BulkImportValidateResult,
  ImportFieldDefinition,
} from './bulk-import.types';

interface NormalizedCellResult {
  value?: unknown;
  hasValue: boolean;
  error?: string;
}

@Injectable()
export class BulkImportService {
  validateRows<TCreateDto extends object, TCreatedEntity>(
    config: BulkImportConfig<TCreateDto, TCreatedEntity>,
    rows: BulkImportRowPayload[],
  ): BulkImportValidateResult {
    const rowResults = rows.map((row) => this.validateSingleRow(config, row));

    const validRows = rowResults.filter((row) => row.isValid).length;
    const invalidRows = rowResults.length - validRows;

    return {
      totalRows: rowResults.length,
      validRows,
      invalidRows,
      rows: rowResults.map((row) => ({
        rowNumber: row.rowNumber,
        data: row.data,
        errors: row.errors,
        isValid: row.isValid,
      })),
    };
  }

  async commitRows<TCreateDto extends object, TCreatedEntity>(
    config: BulkImportConfig<TCreateDto, TCreatedEntity>,
    rows: BulkImportRowPayload[],
  ): Promise<BulkImportCommitResult> {
    const rowResults = rows.map((row) => this.validateSingleRow(config, row));
    let insertedRows = 0;
    const failed: BulkImportCommitResult['failed'] = [];

    for (const rowResult of rowResults) {
      if (!rowResult.isValid) {
        failed.push({
          rowNumber: rowResult.rowNumber,
          data: rowResult.data,
          errors: rowResult.errors,
        });
        continue;
      }

      try {
        await config.create(rowResult.normalizedData as TCreateDto);
        insertedRows += 1;
      } catch (error: unknown) {
        failed.push({
          rowNumber: rowResult.rowNumber,
          data: rowResult.data,
          errors: [this.normalizeDatabaseError(error, config.entityName)],
        });
      }
    }

    return {
      receivedRows: rows.length,
      insertedRows,
      failedRows: failed.length,
      failed,
    };
  }

  private validateSingleRow<TCreateDto extends object, TCreatedEntity>(
    config: BulkImportConfig<TCreateDto, TCreatedEntity>,
    row: BulkImportRowPayload,
  ): BulkImportRowValidationResult {
    const normalizedData: Record<string, unknown> = {};
    const errors: string[] = [];

    for (const field of config.fields) {
      const rawValue = row.data[field.key];
      const normalizedCell = this.normalizeCellValue(field, rawValue);

      if (normalizedCell.error) {
        errors.push(`Campo "${field.key}": ${normalizedCell.error}`);
        continue;
      }

      if (field.required && !normalizedCell.hasValue) {
        errors.push(`Campo "${field.key}" es obligatorio`);
        continue;
      }

      if (normalizedCell.hasValue) {
        normalizedData[field.key] = normalizedCell.value;
      }
    }

    const dtoInstance = plainToInstance(config.dtoClass, normalizedData);
    const validationErrors = validateSync(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: false,
      skipMissingProperties: false,
    });

    const dtoErrors = this.flattenValidationErrors(validationErrors);
    const allErrors = [...errors, ...dtoErrors];

    return {
      rowNumber: row.rowNumber,
      data: row.data,
      normalizedData,
      errors: allErrors,
      validationErrors,
      isValid: allErrors.length === 0,
    };
  }

  private normalizeCellValue(field: ImportFieldDefinition, rawValue: unknown): NormalizedCellResult {
    if (rawValue === null || rawValue === undefined) {
      return { hasValue: false };
    }

    if (typeof rawValue === 'string' && rawValue.trim().length === 0) {
      return { hasValue: false };
    }

    switch (field.type) {
      case 'string':
      case 'email':
        return {
          hasValue: true,
          value: String(rawValue).trim(),
        };

      case 'number': {
        if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
          return { hasValue: true, value: rawValue };
        }

        const normalizedNumberText = String(rawValue).trim().replace(',', '.');
        const numericValue = Number(normalizedNumberText);
        if (!Number.isFinite(numericValue)) {
          return {
            hasValue: false,
            error: 'debe ser un número válido',
          };
        }

        return {
          hasValue: true,
          value: numericValue,
        };
      }

      case 'date': {
        const normalizedDate = this.normalizeDateValue(rawValue);
        if (!normalizedDate) {
          return {
            hasValue: false,
            error: 'debe ser una fecha válida',
          };
        }

        return {
          hasValue: true,
          value: normalizedDate,
        };
      }

      case 'enum': {
        const enumValue = String(rawValue).trim();
        if (!field.enumValues || field.enumValues.length === 0) {
          return {
            hasValue: false,
            error: 'no tiene valores permitidos configurados',
          };
        }

        const directMatch = field.enumValues.find(
          (candidate) => candidate.toLowerCase() === enumValue.toLowerCase(),
        );

        if (directMatch) {
          return { hasValue: true, value: directMatch };
        }

        const aliasMatch = field.enumAliases?.[enumValue.toLowerCase()];
        if (aliasMatch) {
          return { hasValue: true, value: aliasMatch };
        }

        return {
          hasValue: false,
          error: `valor inválido "${enumValue}"`,
        };
      }

      case 'json': {
        if (typeof rawValue === 'object' && rawValue !== null) {
          return {
            hasValue: true,
            value: rawValue,
          };
        }

        if (typeof rawValue === 'string') {
          try {
            return {
              hasValue: true,
              value: JSON.parse(rawValue),
            };
          } catch {
            return {
              hasValue: false,
              error: 'debe ser JSON válido',
            };
          }
        }

        return {
          hasValue: false,
          error: 'debe ser un objeto JSON',
        };
      }

      default:
        return {
          hasValue: true,
          value: rawValue,
        };
    }
  }

  private normalizeDateValue(rawValue: unknown): string | null {
    if (rawValue instanceof Date && Number.isFinite(rawValue.getTime())) {
      return rawValue.toISOString().slice(0, 10);
    }

    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      // Excel serial date conversion
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const millisecondsInDay = 24 * 60 * 60 * 1000;
      const date = new Date(excelEpoch.getTime() + rawValue * millisecondsInDay);
      if (Number.isFinite(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
      return null;
    }

    const text = String(rawValue).trim();
    if (text.length === 0) {
      return null;
    }

    const dayMonthYearMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dayMonthYearMatch) {
      const day = Number(dayMonthYearMatch[1]);
      const month = Number(dayMonthYearMatch[2]) - 1;
      const year = Number(dayMonthYearMatch[3]);
      const date = new Date(Date.UTC(year, month, day));
      if (Number.isFinite(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    }

    const date = new Date(text);
    if (!Number.isFinite(date.getTime())) {
      return null;
    }

    return date.toISOString().slice(0, 10);
  }

  private flattenValidationErrors(validationErrors: ValidationError[]): string[] {
    const messages: string[] = [];

    const visit = (error: ValidationError, path: string): void => {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints).map((message) => `${path}: ${message}`));
      }

      if (error.children && error.children.length > 0) {
        for (const child of error.children) {
          const childPath = path.length > 0 ? `${path}.${child.property}` : child.property;
          visit(child, childPath);
        }
      }
    };

    for (const error of validationErrors) {
      visit(error, error.property);
    }

    return messages;
  }

  private normalizeDatabaseError(error: unknown, entityName: string): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
    ) {
      const code = (error as { code: string }).code;
      if (code === '23505') {
        return `ya existe un registro duplicado para ${entityName}`;
      }
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }

    return `no se pudo insertar el registro de ${entityName}`;
  }
}
