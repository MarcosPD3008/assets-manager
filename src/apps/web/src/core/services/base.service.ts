import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseHttpService, BaseHttpServiceOptions } from '@libs/frontend/api-client';
import { PaginatedResponse, ODataFilter } from '@libs/shared';
import { buildFilterQueryParams } from '../../shared/utils';
import {
  BaseEntity,
  BulkImportCommitResponse,
  BulkImportRowPayload,
  BulkImportValidationResponse,
} from '../models';

export type ExportFormat = 'excel' | 'pdf';
export type ExportScope = 'page' | 'all';

/**
 * Base service with OData filter and pagination support
 * Extends BaseHttpService to add methods for filtered and paginated queries
 */
@Injectable()
export abstract class BaseService<T extends BaseEntity> extends BaseHttpService<T> {
  constructor(
    protected override http: HttpClient,
    protected override baseUrl: string,
    protected override options?: BaseHttpServiceOptions
  ) {
    super(http, baseUrl, options);
  }

  /**
   * Get all resources with optional filters and pagination
   * Always returns paginated response { items, total }
   * @param filters Optional OData filters
   * @param pagination Optional pagination options (default: page=1, pageSize=10)
   * @returns Observable with paginated response
   */
  getAllPaginated(
    filters?: ODataFilter[],
    pagination?: { page: number; pageSize: number }
  ): Observable<PaginatedResponse<T>> {
    let params = new HttpParams();

    // Add OData filters
    if (filters && filters.length > 0) {
      const filterParams = buildFilterQueryParams(filters);
      Object.entries(filterParams).forEach(([key, value]) => {
        params = params.set(key, value);
      });
    }

    // Add pagination (default values if not provided)
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 10;
    params = params.set('page', page.toString());
    params = params.set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResponse<T>>(this.baseUrl, { params });
  }

  /**
   * Export resources to file (excel/pdf), supporting current page or all data.
   */
  exportData(
    format: ExportFormat,
    scope: ExportScope,
    filters?: ODataFilter[],
    pagination?: { page: number; pageSize: number }
  ): Observable<HttpResponse<Blob>> {
    let params = new HttpParams()
      .set('format', format)
      .set('scope', scope);

    if (filters && filters.length > 0) {
      const filterParams = buildFilterQueryParams(filters);
      Object.entries(filterParams).forEach(([key, value]) => {
        params = params.set(key, value);
      });
    }

    if (scope === 'page') {
      const page = pagination?.page ?? 1;
      const pageSize = pagination?.pageSize ?? 10;
      params = params.set('page', page.toString());
      params = params.set('pageSize', pageSize.toString());
    }

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      observe: 'response',
      responseType: 'blob',
    });
  }

  validateBulkImport(rows: BulkImportRowPayload[]): Observable<BulkImportValidationResponse> {
    return this.http.post<BulkImportValidationResponse>(`${this.baseUrl}/import/validate`, {
      rows,
    });
  }

  commitBulkImport(rows: BulkImportRowPayload[]): Observable<BulkImportCommitResponse> {
    return this.http.post<BulkImportCommitResponse>(`${this.baseUrl}/import/commit`, {
      rows,
    });
  }

  /**
   * Get a single resource by ID
   * Backend returns the entity directly, not wrapped in ApiResponse
   * @param id Resource ID
   * @returns Observable with the entity
   */
  getByIdDirect(id: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new resource
   * Backend returns the entity directly
   * @param data Resource data
   * @returns Observable with the created entity
   */
  createDirect(data: Partial<T>): Observable<T> {
    const obs = this.http.post<T>(this.baseUrl, data);
    this.invalidateCache();
    return obs;
  }

  /**
   * Update an existing resource
   * Backend returns the entity directly
   * @param id Resource ID
   * @param data Resource data
   * @returns Observable with the updated entity
   */
  updateDirect(id: string, data: Partial<T>): Observable<T> {
    const obs = this.http.put<T>(`${this.baseUrl}/${id}`, data);
    this.invalidateCache();
    return obs;
  }

  /**
   * Partially update a resource
   * Backend returns the entity directly
   * @param id Resource ID
   * @param data Resource data
   * @returns Observable with the updated entity
   */
  patchDirect(id: string, data: Partial<T>): Observable<T> {
    const obs = this.http.patch<T>(`${this.baseUrl}/${id}`, data);
    this.invalidateCache();
    return obs;
  }

  /**
   * Delete a resource
   * Backend returns void
   * @param id Resource ID
   * @returns Observable
   */
  deleteDirect(id: string): Observable<void> {
    const obs = this.http.delete<void>(`${this.baseUrl}/${id}`);
    this.invalidateCache();
    return obs;
  }
}
