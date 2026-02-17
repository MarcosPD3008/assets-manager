import { FindManyOptions } from 'typeorm';

export type ExportFormat = 'excel' | 'pdf';
export type ExportScope = 'page' | 'all';
export type EntityClass<T extends object = object> = new () => T;

export interface ExportQuery {
  format: ExportFormat;
  scope: ExportScope;
  page: number;
  pageSize: number;
  requestedFileName?: string;
}

export interface ExportDataProvider<T extends object> {
  findAll(options?: FindManyOptions<T>): Promise<T[]>;
  findAllPaginated(
    options: FindManyOptions<T> & { page: number; pageSize: number },
  ): Promise<{ items: T[]; total: number }>;
}

export interface ExportRequest<T extends object> {
  entity: EntityClass<T>;
  source: ExportDataProvider<T>;
  query: Record<string, unknown>;
  fileNameFallback: string;
}

export interface ExportFile {
  fileName: string;
  extension: 'xlsx' | 'pdf';
  mimeType: string;
  buffer: Buffer;
}
