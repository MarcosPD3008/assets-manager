import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { Contact, PaginatedResponse, ODataFilter } from '@libs/shared';

@Injectable({
  providedIn: 'root',
})
export class ContactService extends BaseService<Contact> {
  constructor(http: HttpClient) {
    super(http, '/api/contacts', { cacheScope: 'contacts' });
  }

  /**
   * Get all contacts with optional filters and pagination
   */
  getAllPaginated(
    filters?: ODataFilter[],
    pagination?: { page: number; pageSize: number }
  ): Observable<PaginatedResponse<Contact>> {
    return super.getAllPaginated(filters, pagination);
  }
}
