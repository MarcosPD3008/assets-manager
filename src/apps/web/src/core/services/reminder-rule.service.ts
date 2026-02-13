import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Channel,
  PaginatedResponse,
  Priority,
  ReminderOffsetUnit,
  ReminderRule,
  TargetEntityType,
  TargetType,
} from '@libs/shared';

export interface ReminderRulePayload {
  targetEntityType: TargetEntityType;
  targetEntityId: string;
  offsetValue: number;
  offsetUnit: ReminderOffsetUnit;
  targetType?: TargetType;
  priority?: Priority;
  channel?: Channel;
  messageTemplate?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ReminderRuleService {
  private readonly baseUrl = '/api/reminder-rules';

  constructor(private http: HttpClient) {}

  getAll(
    page: number = 1,
    pageSize: number = 50
  ): Observable<PaginatedResponse<ReminderRule>> {
    return this.http.get<PaginatedResponse<ReminderRule>>(
      `${this.baseUrl}?page=${page}&pageSize=${pageSize}`
    );
  }

  create(data: ReminderRulePayload): Observable<ReminderRule> {
    return this.http.post<ReminderRule>(this.baseUrl, data);
  }

  update(id: string, data: Partial<ReminderRulePayload>): Observable<ReminderRule> {
    return this.http.put<ReminderRule>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  generatePreview(id: string): Observable<{ dueDate: string; scheduledDate: string }> {
    return this.http.post<{ dueDate: string; scheduledDate: string }>(
      `${this.baseUrl}/${id}/generate-preview`,
      {}
    );
  }
}
