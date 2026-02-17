import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AssetService, ContactService, ToastService } from '../../core/services';
import {
  BulkImportCommitFailure,
  BulkImportRowPayload,
  BulkImportRowValidationResult,
  ImportFieldConfig,
} from '../../core/models';
import { MaterialModule } from '../../shared/material';
import { AssetStatus } from '@libs/shared';

type ImportEntityType = 'assets' | 'contacts';

interface ParsedSheetData {
  headers: string[];
  rows: Array<Record<string, string>>;
}

const ASSET_IMPORT_FIELDS: ImportFieldConfig[] = [
  { key: 'name', label: 'Nombre', required: true, type: 'string' },
  { key: 'description', label: 'Descripcion', required: false, type: 'string' },
  { key: 'serialNumber', label: 'Numero de serie', required: false, type: 'string' },
  {
    key: 'status',
    label: 'Estado',
    required: false,
    type: 'enum',
    enumOptions: [
      { value: AssetStatus.AVAILABLE, label: 'Disponible' },
      { value: AssetStatus.ASSIGNED, label: 'Asignado' },
      { value: AssetStatus.MAINTENANCE, label: 'Mantenimiento' },
      { value: AssetStatus.RETIRED, label: 'Retirado' },
    ],
  },
  { key: 'category', label: 'Categoria', required: false, type: 'string' },
  { key: 'location', label: 'Ubicacion', required: false, type: 'string' },
  { key: 'purchaseDate', label: 'Fecha de compra', required: false, type: 'date' },
  { key: 'purchasePrice', label: 'Precio de compra', required: false, type: 'number' },
  { key: 'warrantyExpiryDate', label: 'Vencimiento de garantia', required: false, type: 'date' },
  { key: 'metadata', label: 'Metadatos (JSON)', required: false, type: 'json' },
];

const CONTACT_IMPORT_FIELDS: ImportFieldConfig[] = [
  { key: 'name', label: 'Nombre', required: true, type: 'string' },
  { key: 'email', label: 'Correo', required: true, type: 'email' },
  { key: 'phoneNumber', label: 'Telefono', required: false, type: 'string' },
  { key: 'department', label: 'Departamento', required: false, type: 'string' },
  { key: 'position', label: 'Cargo', required: false, type: 'string' },
  { key: 'notes', label: 'Notas', required: false, type: 'string' },
  { key: 'metadata', label: 'Metadatos (JSON)', required: false, type: 'json' },
];

@Component({
  selector: 'app-bulk-import',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './bulk-import.component.html',
  styleUrl: './bulk-import.component.scss',
})
export class BulkImportComponent implements OnInit {
  entityType: ImportEntityType = 'assets';
  entityLabel = 'Activos';
  fields: ImportFieldConfig[] = [];

  selectedFileName = '';
  headers: string[] = [];
  sourceRows: Array<Record<string, string>> = [];
  mapping: Record<string, string> = {};
  rows: BulkImportRowValidationResult[] = [];

  parsingFile = false;
  validatingRows = false;
  committingRows = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly assetService: AssetService,
    private readonly contactService: ContactService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const routeEntity = this.route.snapshot.data['importEntity'];
    this.entityType = routeEntity === 'contacts' ? 'contacts' : 'assets';
    this.entityLabel = this.entityType === 'assets' ? 'Activos' : 'Contactos';
    this.fields = this.entityType === 'assets' ? ASSET_IMPORT_FIELDS : CONTACT_IMPORT_FIELDS;
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.parsingFile = true;
    try {
      const parsed = await this.parseExcelFile(file);
      if (parsed.rows.length === 0) {
        this.toastService.warning('El archivo no contiene filas con datos para importar');
        return;
      }

      this.selectedFileName = file.name;
      this.headers = parsed.headers;
      this.sourceRows = parsed.rows;
      this.mapping = this.buildDefaultMapping(parsed.headers);
      this.rows = [];
    } catch (error) {
      console.error('Error parsing excel file:', error);
      this.toastService.error('No se pudo leer el archivo Excel');
    } finally {
      this.parsingFile = false;
      input.value = '';
    }
  }

  get requiredMappingsReady(): boolean {
    return this.fields
      .filter((field) => field.required)
      .every((field) => Boolean(this.mapping[field.key]));
  }

  get totalRows(): number {
    return this.rows.length;
  }

  get validRows(): number {
    return this.rows.filter((row) => row.isValid).length;
  }

  get invalidRows(): number {
    return this.rows.filter((row) => !row.isValid).length;
  }

  get canCommit(): boolean {
    return this.rows.length > 0 && this.invalidRows === 0 && !this.committingRows && !this.validatingRows;
  }

  startValidation(): void {
    if (!this.requiredMappingsReady) {
      this.toastService.error('Debes mapear todos los campos obligatorios');
      return;
    }

    const mappedRows = this.buildRowsFromSourceData();
    if (mappedRows.length === 0) {
      this.toastService.warning('No hay filas para validar');
      return;
    }

    this.validateRows(mappedRows);
  }

  revalidateRows(): void {
    const payload = this.rows.map((row) => ({
      rowNumber: row.rowNumber,
      data: row.data,
    }));

    if (payload.length === 0) {
      this.toastService.warning('No hay filas para validar');
      return;
    }

    this.validateRows(payload);
  }

  removeRow(rowNumber: number): void {
    this.rows = this.rows.filter((row) => row.rowNumber !== rowNumber);
  }

  removeInvalidRows(): void {
    const invalidCount = this.invalidRows;
    this.rows = this.rows.filter((row) => row.isValid);

    if (invalidCount > 0) {
      this.toastService.info(`${invalidCount} fila(s) inválida(s) eliminada(s)`);
    }
  }

  commitImport(): void {
    if (!this.canCommit) {
      this.toastService.warning('Corrige o elimina las filas inválidas antes de insertar');
      return;
    }

    this.committingRows = true;
    const payload = this.rows.map((row) => ({
      rowNumber: row.rowNumber,
      data: row.data,
    }));

    this.getActiveService().commitBulkImport(payload).subscribe({
      next: (response) => {
        if (response.failedRows === 0) {
          this.toastService.success(`${response.insertedRows} registro(s) importado(s) exitosamente`);
          void this.router.navigate([`/${this.entityType}`]);
          return;
        }

        this.rows = this.mapFailuresToRows(response.failed);
        this.toastService.warning(
          `Se insertaron ${response.insertedRows} registro(s) y fallaron ${response.failedRows}. Revisa las filas restantes.`,
        );
      },
      error: (error) => {
        console.error('Error committing bulk import:', error);
        this.toastService.error('No se pudo completar la importación masiva');
      },
      complete: () => {
        this.committingRows = false;
      },
    });
  }

  goBack(): void {
    void this.router.navigate([`/${this.entityType}`]);
  }

  getCellValue(row: BulkImportRowValidationResult, key: string): string {
    const value = row.data[key];
    return value === null || value === undefined ? '' : String(value);
  }

  setCellValue(row: BulkImportRowValidationResult, key: string, value: string): void {
    row.data[key] = value;
  }

  trackByField(_: number, field: ImportFieldConfig): string {
    return field.key;
  }

  trackByRow(_: number, row: BulkImportRowValidationResult): number {
    return row.rowNumber;
  }

  private validateRows(rows: BulkImportRowPayload[]): void {
    this.validatingRows = true;
    this.getActiveService().validateBulkImport(rows).subscribe({
      next: (response) => {
        this.rows = response.rows;
        if (response.invalidRows > 0) {
          this.toastService.warning(
            `Validación completada: ${response.validRows} válidas y ${response.invalidRows} inválidas`,
          );
        } else {
          this.toastService.success(`Validación completada: ${response.validRows} filas válidas`);
        }
      },
      error: (error) => {
        console.error('Error validating rows:', error);
        this.toastService.error('No se pudo validar la información del archivo');
      },
      complete: () => {
        this.validatingRows = false;
      },
    });
  }

  private mapFailuresToRows(failures: BulkImportCommitFailure[]): BulkImportRowValidationResult[] {
    return failures.map((failure) => ({
      rowNumber: failure.rowNumber,
      data: failure.data,
      errors: failure.errors,
      isValid: false,
    }));
  }

  private buildRowsFromSourceData(): BulkImportRowPayload[] {
    return this.sourceRows
      .map((sourceRow, index) => {
        const mappedData: Record<string, unknown> = {};

        for (const field of this.fields) {
          const mappedHeader = this.mapping[field.key];
          if (!mappedHeader) {
            continue;
          }

          mappedData[field.key] = sourceRow[mappedHeader] ?? '';
        }

        return {
          rowNumber: index + 2,
          data: mappedData,
        };
      })
      .filter((row) => Object.values(row.data).some((value) => String(value ?? '').trim().length > 0));
  }

  private buildDefaultMapping(headers: string[]): Record<string, string> {
    const headerMap = new Map(headers.map((header) => [this.normalizeToken(header), header]));

    return this.fields.reduce<Record<string, string>>((mapping, field) => {
      const keyByFieldKey = headerMap.get(this.normalizeToken(field.key));
      const keyByFieldLabel = headerMap.get(this.normalizeToken(field.label));
      mapping[field.key] = keyByFieldKey || keyByFieldLabel || '';
      return mapping;
    }, {});
  }

  private normalizeToken(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private getActiveService(): AssetService | ContactService {
    return this.entityType === 'assets' ? this.assetService : this.contactService;
  }

  private async parseExcelFile(file: File): Promise<ParsedSheetData> {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error('Workbook does not contain sheets');
    }

    const firstSheet = workbook.Sheets[firstSheetName];
    const matrix = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
      raw: false,
      defval: '',
    }) as unknown[][];

    if (matrix.length === 0) {
      throw new Error('Workbook is empty');
    }

    const headers = matrix[0].map((value, index) => {
      const text = String(value ?? '').trim();
      return text.length > 0 ? text : `Column_${index + 1}`;
    });

    const rows = matrix
      .slice(1)
      .filter((row) => row.some((value) => String(value ?? '').trim().length > 0))
      .map((row) => {
        return headers.reduce<Record<string, string>>((acc, header, index) => {
          acc[header] = String(row[index] ?? '').trim();
          return acc;
        }, {});
      });

    return { headers, rows };
  }
}
