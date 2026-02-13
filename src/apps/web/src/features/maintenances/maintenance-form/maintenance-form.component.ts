import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from '@shared/material';
import { FormErrorComponent } from '@shared/components';
import {
  AssetService,
  MaintenanceService,
  ToastService,
} from '@core/services';
import { Asset, FrequencyUnit, MaintenanceExecution } from '@libs/shared';
import { MaintenanceExecutionDialogComponent } from '../maintenances-data/maintenances-data.component';

@Component({
  selector: 'app-maintenance-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormErrorComponent],
  templateUrl: './maintenance-form.component.html',
  styleUrl: './maintenance-form.component.scss',
})
export class MaintenanceFormComponent implements OnInit {
  form: FormGroup;
  assets: Asset[] = [];
  history: MaintenanceExecution[] = [];
  loading = false;
  loadingHistory = false;
  isEditMode = false;
  isViewOnly = false;
  maintenanceId: string | null = null;
  units = Object.values(FrequencyUnit);

  displayedHistoryColumns = ['executedAt', 'cost', 'serviceProvider', 'notes'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private assetService: AssetService,
    private maintenanceService: MaintenanceService,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      assetId: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      frequencyAmount: [1, [Validators.required, Validators.min(1)]],
      unit: [FrequencyUnit.MONTH, Validators.required],
      lastServiceDate: [null],
      nextServiceDate: [null],
      cost: [null, Validators.min(0)],
      serviceProvider: ['', Validators.maxLength(255)],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.maintenanceId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.maintenanceId;
    this.isViewOnly = this.router.url.includes('/view/');

    if (this.isViewOnly) {
      this.form.disable();
    }

    this.loadAssets();
    if (this.maintenanceId) {
      this.loadMaintenance(this.maintenanceId);
      this.loadHistory(this.maintenanceId);
    }
  }

  getTitle(): string {
    if (this.isViewOnly) {
      return 'Detalle de mantenimiento';
    }
    return this.isEditMode ? 'Editar mantenimiento' : 'Nuevo mantenimiento';
  }

  loadAssets(): void {
    this.assetService.getAllPaginated([], { page: 1, pageSize: 1000 }).subscribe({
      next: (response) => {
        this.assets = response.items;
      },
      error: (error) => {
        console.error('Error loading assets:', error);
        this.toastService.error('No se pudieron cargar los activos');
      },
    });
  }

  loadMaintenance(id: string): void {
    this.loading = true;
    this.maintenanceService.getById(id).subscribe({
      next: (response) => {
        const maintenance = response as unknown as any;
        this.form.patchValue({
          assetId: maintenance.assetId,
          description: maintenance.description,
          frequencyAmount: maintenance.frequencyAmount,
          unit: maintenance.unit,
          lastServiceDate: maintenance.lastServiceDate
            ? new Date(maintenance.lastServiceDate)
            : null,
          nextServiceDate: maintenance.nextServiceDate
            ? new Date(maintenance.nextServiceDate)
            : null,
          cost: maintenance.cost,
          serviceProvider: maintenance.serviceProvider,
          notes: maintenance.notes,
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading maintenance:', error);
        this.toastService.error('No se pudo cargar el mantenimiento');
        this.loading = false;
        this.router.navigate(['/maintenances']);
      },
    });
  }

  loadHistory(id: string): void {
    this.loadingHistory = true;
    this.maintenanceService.getExecutionHistory(id).subscribe({
      next: (history) => {
        this.history = history;
        this.loadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading maintenance history:', error);
        this.loadingHistory = false;
      },
    });
  }

  executeMaintenance(): void {
    if (!this.maintenanceId) {
      return;
    }
    const dialogRef = this.dialog.open(MaintenanceExecutionDialogComponent, {
      width: '520px',
      data: {
        maintenance: {
          id: this.maintenanceId,
          description: this.form.value.description,
        },
      },
    });

    dialogRef.afterClosed().subscribe((payload) => {
      if (!payload) {
        return;
      }
      this.maintenanceService.executeMaintenance(this.maintenanceId!, payload).subscribe({
        next: () => {
          this.toastService.success('Ejecución registrada');
          this.loadMaintenance(this.maintenanceId!);
          this.loadHistory(this.maintenanceId!);
        },
        error: (error) => {
          console.error('Error executing maintenance:', error);
          this.toastService.error(
            error?.error?.message || 'No se pudo registrar la ejecución'
          );
        },
      });
    });
  }

  onSubmit(): void {
    if (this.isViewOnly) {
      this.onCancel();
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.warning('Corrige los campos requeridos');
      return;
    }

    this.loading = true;
    const value = this.form.value;
    const payload = {
      ...value,
      lastServiceDate: value.lastServiceDate
        ? new Date(value.lastServiceDate).toISOString()
        : null,
      nextServiceDate: value.nextServiceDate
        ? new Date(value.nextServiceDate).toISOString()
        : null,
    };

    const request$ =
      this.isEditMode && this.maintenanceId
        ? this.maintenanceService.update(this.maintenanceId, payload)
        : this.maintenanceService.create(payload);

    request$.subscribe({
      next: () => {
        this.toastService.success(
          this.isEditMode
            ? 'Mantenimiento actualizado'
            : 'Mantenimiento creado'
        );
        this.loading = false;
        this.router.navigate(['/maintenances']);
      },
      error: (error) => {
        console.error('Error saving maintenance:', error);
        this.toastService.error(
          error?.error?.message || 'No se pudo guardar el mantenimiento'
        );
        this.loading = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/maintenances']);
  }

  getUnitLabel(unit: FrequencyUnit): string {
    const labels: Record<FrequencyUnit, string> = {
      [FrequencyUnit.DAY]: 'Día(s)',
      [FrequencyUnit.WEEK]: 'Semana(s)',
      [FrequencyUnit.MONTH]: 'Mes(es)',
      [FrequencyUnit.YEAR]: 'Año(s)',
    };
    return labels[unit] || unit;
  }
}
