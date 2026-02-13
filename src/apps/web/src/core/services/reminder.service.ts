import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { Reminder, PaginatedResponse, ODataFilter } from '@libs/shared';

@Injectable({
  providedIn: 'root',
})
export class ReminderService extends BaseService<Reminder> {
  constructor(http: HttpClient) {
    super(http, '/api/reminders', { cacheScope: 'reminders' });
  }

  /**
   * Get all reminders with optional filters and pagination
   */
  override getAllPaginated(
    filters?: ODataFilter[],
    pagination?: { page: number; pageSize: number }
  ): Observable<PaginatedResponse<Reminder>> {
    return super.getAllPaginated(filters, pagination);
  }

  /**
   * Mark a reminder as sent
   */
  markAsSent(id: string): Observable<Reminder> {
    return this.http.patch<Reminder>(`${this.baseUrl}/${id}/mark-sent`, {});
  }
}
