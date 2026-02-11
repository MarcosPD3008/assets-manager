import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { Asset, PaginatedResponse, ODataFilter } from '@libs/shared';

@Injectable({
  providedIn: 'root',
})
export class AssetService extends BaseService<Asset> {
  constructor(http: HttpClient) {
    super(http, '/api/assets', { cacheScope: 'assets' });
  }

  /**
   * Get all assets with optional filters and pagination
   */
  getAllPaginated(
    filters?: ODataFilter[],
    pagination?: { page: number; pageSize: number }
  ): Observable<PaginatedResponse<Asset>> {
    return super.getAllPaginated(filters, pagination);
  }

  /**
   * Update asset status
   */
  updateStatus(id: string, status: string): Observable<Asset> {
    return this.http.patch<Asset>(`${this.baseUrl}/${id}/status`, { status });
  }
}
