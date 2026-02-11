import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalendarResponse } from '@libs/shared';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private readonly baseUrl = '/api/calendar';

  constructor(private http: HttpClient) {}

  /**
   * Get calendar events for a specific month
   * @param date Date string in format YYYY-MM-DD or YYYY-MM
   * @returns Observable with assignments and maintenances for the month
   */
  getCalendar(date: string): Observable<CalendarResponse> {
    const params = new HttpParams().set('date', date);
    return this.http.get<CalendarResponse>(this.baseUrl, { params });
  }
}
