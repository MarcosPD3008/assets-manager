import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { Maintenance, PaginatedResponse, ODataFilter } from '@libs/shared';

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
  getAllPaginated(
    filters?: ODataFilter[],
    pagination?: { page: number; pageSize: number }
  ): Observable<PaginatedResponse<Maintenance>> {
    return super.getAllPaginated(filters, pagination);
  }
}
