export type ImportFieldType = 'string' | 'email' | 'number' | 'date' | 'enum' | 'json';

export interface ImportFieldOption {
  value: string;
  label: string;
}

export interface ImportFieldConfig {
  key: string;
  label: string;
  required: boolean;
  type: ImportFieldType;
  enumOptions?: ImportFieldOption[];
}

export interface BulkImportRowPayload {
  rowNumber: number;
  data: Record<string, unknown>;
}

export interface BulkImportRowValidationResult {
  rowNumber: number;
  data: Record<string, unknown>;
  errors: string[];
  isValid: boolean;
}

export interface BulkImportValidationResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: BulkImportRowValidationResult[];
}

export interface BulkImportCommitFailure {
  rowNumber: number;
  data: Record<string, unknown>;
  errors: string[];
}

export interface BulkImportCommitResponse {
  receivedRows: number;
  insertedRows: number;
  failedRows: number;
  failed: BulkImportCommitFailure[];
}
