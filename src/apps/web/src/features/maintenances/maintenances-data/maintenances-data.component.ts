import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '@shared/material';
import { PaginationComponent } from '@shared/components';
import {
  MaintenanceService,
  ToastService,
  ExecuteMaintenancePayload,
} from '@core/services';
import {
  Maintenance,
  ODataFilter,
  FilterOperator,
  FrequencyUnit,
} from '@libs/shared';
import { ConfirmDialogComponent } from '../../assets/assets-data/assets-data.component';

interface FilterState {
  assetName: string;
  serviceProvider: string;
  upcomingOnly: boolean;
}

interface MaintenanceExecutionDialogData {
  maintenance: Pick<Maintenance, 'id' | 'description'>;
}

@Component({
  selector: 'app-maintenance-execution-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <h2 mat-dialog-title>Registrar ejecución</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <p class="dialog-subtitle">
          Mantenimiento: <strong>{{ data.maintenance.description }}</strong>
        </p>

        <mat-form-field appearance="outline">
          <mat-label>Fecha de ejecución</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="executedAt" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Costo</mat-label>
          <input matInput type="number" formControlName="cost" placeholder="0" />
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Proveedor</mat-label>
          <input matInput formControlName="serviceProvider" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Notas</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid">
        Registrar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 420px;
      }

      .dialog-subtitle {
        margin: 0 0 8px;
      }
    `,
  ],
})
export class MaintenanceExecutionDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MaintenanceExecutionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MaintenanceExecutionDialogData
  ) {
    this.form = this.fb.group({
      executedAt: [new Date(), Validators.required],
      cost: [null, [Validators.min(0)]],
      serviceProvider: [''],
      notes: [''],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    this.dialogRef.close({
      executedAt: value.executedAt ? new Date(value.executedAt).toISOString() : undefined,
      cost: value.cost,
      serviceProvider: value.serviceProvider,
      notes: value.notes,
    } as ExecuteMaintenancePayload);
  }
}

@Component({
  selector: 'app-maintenances-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    PaginationComponent,
  ],
  templateUrl: './maintenances-data.component.html',
  styleUrl: './maintenances-data.component.scss',
})
export class MaintenancesDataComponent implements OnInit {
  maintenances: Maintenance[] = [];
  total = 0;
  page = 1;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  loading = false;
  filtersExpanded = false;
  frequencies = Object.values(FrequencyUnit);
  totalMonthlyCost = 0;
  topCostAssets: Array<{ assetId: string; assetName: string; total: number }> = [];

  displayedColumns: string[] = [
    'asset',
    'description',
    'frequency',
    'nextServiceDate',
    'serviceProvider',
    'cost',
    'actions',
  ];

  filters: FilterState = {
    assetName: '',
    serviceProvider: '',
    upcomingOnly: false,
  };

  constructor(
    private maintenanceService: MaintenanceService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMaintenances();
    const now = new Date();
    this.loadCostSummary(now.getMonth() + 1, now.getFullYear());
  }

  loadMaintenances(): void {
    this.loading = true;
    const odataFilters = this.buildODataFilters();
    const hasAssetFilter = this.filters.assetName.trim().length > 0;

    this.maintenanceService
      .getAllPaginated(odataFilters, {
        page: hasAssetFilter ? 1 : this.page,
        pageSize: hasAssetFilter ? 500 : this.pageSize,
      })
      .subscribe({
        next: (response) => {
          const items = hasAssetFilter
            ? this.filterByAssetName(response.items)
            : response.items;

          if (hasAssetFilter) {
            this.total = items.length;
            const start = (this.page - 1) * this.pageSize;
            this.maintenances = items.slice(start, start + this.pageSize);
          } else {
            this.maintenances = items;
            this.total = response.total;
          }

          this.loading = false;
          this.loadCostSummary(new Date().getMonth() + 1, new Date().getFullYear());
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading maintenances:', error);
          this.toastService.error('Error al cargar mantenimientos');
          this.loading = false;
        },
      });
  }

  buildODataFilters(): ODataFilter[] {
    const filters: ODataFilter[] = [];

    if (this.filters.serviceProvider) {
      filters.push({
        prop: 'serviceProvider',
        operator: FilterOperator.CONTAINS,
        value: this.filters.serviceProvider,
      });
    }

    if (this.filters.upcomingOnly) {
      filters.push({
        prop: 'nextServiceDate',
        operator: FilterOperator.GE,
        value: new Date().toISOString(),
      });
    }

    return filters;
  }

  filterByAssetName(items: Maintenance[]): Maintenance[] {
    const assetName = this.filters.assetName.trim().toLowerCase();
    return items.filter((item) =>
      (item.asset?.name || '').toLowerCase().includes(assetName)
    );
  }

  applyFilters(): void {
    this.page = 1;
    this.loadMaintenances();
  }

  clearFilters(): void {
    this.filters = {
      assetName: '',
      serviceProvider: '',
      upcomingOnly: false,
    };
    this.applyFilters();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadMaintenances();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.page = 1;
    this.loadMaintenances();
  }

  openCreate(): void {
    this.router.navigate(['/maintenances/new']);
  }

  openView(maintenance: Maintenance): void {
    this.router.navigate(['/maintenances/view', maintenance.id]);
  }

  openEdit(maintenance: Maintenance): void {
    this.router.navigate(['/maintenances', maintenance.id]);
  }

  execute(maintenance: Maintenance): void {
    const dialogRef = this.dialog.open(MaintenanceExecutionDialogComponent, {
      width: '520px',
      data: { maintenance },
    });

    dialogRef.afterClosed().subscribe((payload?: ExecuteMaintenancePayload) => {
      if (!payload) {
        return;
      }
      this.maintenanceService.executeMaintenance(maintenance.id, payload).subscribe({
        next: () => {
          this.toastService.success('Mantenimiento ejecutado y reprogramado');
          this.loadMaintenances();
          this.loadCostSummary(new Date().getMonth() + 1, new Date().getFullYear());
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

  delete(maintenance: Maintenance): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar mantenimiento',
        message: '¿Desea eliminar este mantenimiento? Esta acción no se puede deshacer.',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.maintenanceService.delete(maintenance.id).subscribe({
        next: () => {
          this.toastService.success('Mantenimiento eliminado');
          this.loadMaintenances();
          this.loadCostSummary(new Date().getMonth() + 1, new Date().getFullYear());
        },
        error: (error) => {
          console.error('Error deleting maintenance:', error);
          this.toastService.error('No se pudo eliminar el mantenimiento');
        },
      });
    });
  }

  getFrequencyLabel(unit: FrequencyUnit): string {
    const labels: Record<FrequencyUnit, string> = {
      [FrequencyUnit.DAY]: 'Días',
      [FrequencyUnit.WEEK]: 'Semanas',
      [FrequencyUnit.MONTH]: 'Meses',
      [FrequencyUnit.YEAR]: 'Años',
    };
    return labels[unit] || unit;
  }

  loadCostSummary(month: number, year: number): void {
    this.maintenanceService.getCostSummary(month, year).subscribe({
      next: (summary) => {
        this.totalMonthlyCost = summary.total;
        this.topCostAssets = summary.byAsset.slice(0, 3);
      },
    });
  }
}
