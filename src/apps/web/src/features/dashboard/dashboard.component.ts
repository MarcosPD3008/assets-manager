import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '@shared/material';
import { MaintenanceService, ReminderService } from '@core/services';
import { FilterOperator } from '@libs/shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  remindersPendientes = 0;
  mantenimientosProximos = 0;

  constructor(
    private reminderService: ReminderService,
    private maintenanceService: MaintenanceService
  ) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  private cargarResumen(): void {
    this.reminderService
      .getAllPaginated(
        [{ prop: 'status', operator: FilterOperator.EQ, value: 'PENDING' }],
        { page: 1, pageSize: 1 }
      )
      .subscribe({
        next: (response) => (this.remindersPendientes = response.total),
      });

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 30);
    this.maintenanceService
      .getAllPaginated(
        [
          {
            prop: 'nextServiceDate',
            operator: FilterOperator.LE,
            value: fechaLimite.toISOString(),
          },
        ],
        { page: 1, pageSize: 1 }
      )
      .subscribe({
        next: (response) => (this.mantenimientosProximos = response.total),
      });
  }
}
