import { ValidationError } from 'class-validator';

export type ImportFieldType = 'string' | 'email' | 'number' | 'date' | 'enum' | 'json';

export interface ImportFieldDefinition {
  key: string;
  required?: boolean;
  type: ImportFieldType;
  enumValues?: string[];
  enumAliases?: Record<string, string>;
}

export interface BulkImportRowPayload {
  rowNumber: number;
  data: Record<string, unknown>;
}

export interface BulkImportConfig<TCreateDto extends object, TCreatedEntity> {
  entityName: string;
  fields: ImportFieldDefinition[];
  dtoClass: new () => TCreateDto;
  create: (payload: TCreateDto) => Promise<TCreatedEntity>;
}

export interface BulkImportRowValidationResult {
  rowNumber: number;
  data: Record<string, unknown>;
  normalizedData: Record<string, unknown>;
  errors: string[];
  validationErrors?: ValidationError[];
  isValid: boolean;
}

export interface BulkImportValidateResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: Array<{
    rowNumber: number;
    data: Record<string, unknown>;
    errors: string[];
    isValid: boolean;
  }>;
}

export interface BulkImportCommitResult {
  receivedRows: number;
  insertedRows: number;
  failedRows: number;
  failed: Array<{
    rowNumber: number;
    data: Record<string, unknown>;
    errors: string[];
  }>;
}
