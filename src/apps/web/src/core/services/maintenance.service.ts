import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import {
  Maintenance,
  MaintenanceExecution,
  PaginatedResponse,
  ODataFilter,
} from '@libs/shared';

export interface ExecuteMaintenancePayload {
  executedAt?: string;
  cost?: number;
  serviceProvider?: string;
  notes?: string;
  performedBy?: string;
}

export interface MaintenanceCostSummary {
  total: number;
  byAsset: Array<{
    assetId: string;
    assetName: string;
    total: number;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService extends BaseService<Maintenance> {
  constructor(http: HttpClient) {
    super(http, '/api/maintenances', { cacheScope: 'maintenances' });
  }

  /**
   * Get all maintenances with optional filters and pagination
   */
  override getAllPaginated(
    filters?: ODataFilter[],
    pagination?: { page: number; pageSize: number }
  ): Observable<PaginatedResponse<Maintenance>> {
    return super.getAllPaginated(filters, pagination);
  }

  executeMaintenance(
    id: string,
    payload: ExecuteMaintenancePayload
  ): Observable<{ maintenance: Maintenance; execution: MaintenanceExecution }> {
    return this.http.patch<{ maintenance: Maintenance; execution: MaintenanceExecution }>(
      `${this.baseUrl}/${id}/execute`,
      payload
    );
  }

  getExecutionHistory(id: string): Observable<MaintenanceExecution[]> {
    return this.http.get<MaintenanceExecution[]>(`${this.baseUrl}/${id}/history`);
  }

  getCostSummary(month?: number, year?: number): Observable<MaintenanceCostSummary> {
    const query = new URLSearchParams();
    if (month) {
      query.set('month', month.toString());
    }
    if (year) {
      query.set('year', year.toString());
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.http.get<MaintenanceCostSummary>(
      `${this.baseUrl}/cost-summary/monthly${suffix}`
    );
  }
}
