import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '@shared/material';
import { DashboardService } from '@core/services';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  activosTotales: number | null = null;
  remindersPendientes: number | null = null;
  mantenimientosProximos: number | null = null;
  asignacionesActivas: number | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  private cargarResumen(): void {
    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.activosTotales = summary.activosTotales;
        this.remindersPendientes = summary.remindersPendientes;
        this.mantenimientosProximos = summary.mantenimientosProximos;
        this.asignacionesActivas = summary.asignacionesActivas;
      },
    });
  }
}
