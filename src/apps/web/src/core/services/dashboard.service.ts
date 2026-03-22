import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardSummary {
  activosTotales: number;
  remindersPendientes: number;
  mantenimientosProximos: number;
  asignacionesActivas: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly url = '/api/dashboard/summary';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(this.url);
  }
}
