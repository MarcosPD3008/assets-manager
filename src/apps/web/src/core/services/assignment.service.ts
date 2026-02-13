import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { Assignment, PaginatedResponse, ODataFilter } from '@libs/shared';

@Injectable({
  providedIn: 'root',
})
export class AssignmentService extends BaseService<Assignment> {
  constructor(http: HttpClient) {
    super(http, '/api/assignments', { cacheScope: 'assignments' });
  }

  /**
   * Get all assignments with optional filters and pagination
   */
  override getAllPaginated(
    filters?: ODataFilter[],
    pagination?: { page: number; pageSize: number }
  ): Observable<PaginatedResponse<Assignment>> {
    return super.getAllPaginated(filters, pagination);
  }

  /**
   * Close an assignment (mark as completed)
   */
  closeAssignment(id: string): Observable<Assignment> {
    return this.http.patch<Assignment>(`${this.baseUrl}/${id}/close`, {});
  }
}
