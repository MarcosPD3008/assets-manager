import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@shared/material';
import { PaginationComponent } from '@shared/components';
import { AssetService, ToastService } from '@core/services';
import { Asset, AssetStatus, ODataFilter, FilterOperator } from '@libs/shared';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AssetFormComponent } from '../asset-form/asset-form.component';

interface FilterState {
  name: string;
  status: string;
  category: string;
  location: string;
  priceFrom: number | null;
  priceTo: number | null;
  warrantyStatus: string;
}

@Component({
  selector: 'app-assets-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    PaginationComponent,
  ],
  templateUrl: './assets-data.component.html',
  styleUrl: './assets-data.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AssetsDataComponent implements OnInit {
  assets: Asset[] = [];
  total: number = 0;
  page: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  loading: boolean = false;
  filtersExpanded: boolean = false;

  displayedColumns: string[] = [
    'name',
    'serialNumber',
    'category',
    'location',
    'status',
    'purchasePrice',
    'warrantyExpiryDate',
    'actions',
  ];

  assetStatuses = Object.values(AssetStatus);
  filters: FilterState = {
    name: '',
    status: '',
    category: '',
    location: '',
    priceFrom: null,
    priceTo: null,
    warrantyStatus: '',
  };

  constructor(
    private assetService: AssetService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAssets();
  }

  loadAssets(): void {
    this.loading = true;
    const odataFilters = this.buildODataFilters();

    this.assetService
      .getAllPaginated(odataFilters, { page: this.page, pageSize: this.pageSize })
      .subscribe({
        next: (response) => {
          console.log('Response:', response);
          this.assets = response.items;
          this.total = response.total;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading assets:', error);
          this.toastService.error('Error al cargar los assets');
          this.loading = false;
        },
      });
  }

  buildODataFilters(): ODataFilter[] {
    const filters: ODataFilter[] = [];

    if (this.filters.name) {
      filters.push({
        prop: 'name',
        operator: FilterOperator.CONTAINS,
        value: this.filters.name,
      });
    }

    if (this.filters.status) {
      filters.push({
        prop: 'status',
        operator: FilterOperator.EQ,
        value: this.filters.status,
      });
    }

    if (this.filters.category) {
      filters.push({
        prop: 'category',
        operator: FilterOperator.CONTAINS,
        value: this.filters.category,
      });
    }

    if (this.filters.location) {
      filters.push({
        prop: 'location',
        operator: FilterOperator.CONTAINS,
        value: this.filters.location,
      });
    }

    if (this.filters.priceFrom !== null) {
      filters.push({
        prop: 'purchasePrice',
        operator: FilterOperator.GE,
        value: this.filters.priceFrom,
      });
    }

    if (this.filters.priceTo !== null) {
      filters.push({
        prop: 'purchasePrice',
        operator: FilterOperator.LE,
        value: this.filters.priceTo,
      });
    }

    if (this.filters.warrantyStatus === 'valid') {
      filters.push({
        prop: 'warrantyExpiryDate',
        operator: FilterOperator.GE,
        value: new Date().toISOString().split('T')[0],
      });
    } else if (this.filters.warrantyStatus === 'expired') {
      filters.push({
        prop: 'warrantyExpiryDate',
        operator: FilterOperator.LT,
        value: new Date().toISOString().split('T')[0],
      });
    }

    return filters;
  }

  applyFilters(): void {
    this.page = 1;
    this.loadAssets();
  }

  clearFilters(): void {
    this.filters = {
      name: '',
      status: '',
      category: '',
      location: '',
      priceFrom: null,
      priceTo: null,
      warrantyStatus: '',
    };
    this.applyFilters();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadAssets();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.page = 1;
    this.loadAssets();
  }

  getStatusColor(status: AssetStatus): string {
    const colors: Record<AssetStatus, string> = {
      [AssetStatus.AVAILABLE]: '#4caf50',
      [AssetStatus.ASSIGNED]: '#2196f3',
      [AssetStatus.MAINTENANCE]: '#ff9800',
      [AssetStatus.RETIRED]: '#9e9e9e',
    };
    return colors[status] || '#9e9e9e';
  }

  getStatusLabel(status: AssetStatus): string {
    const labels: Record<AssetStatus, string> = {
      [AssetStatus.AVAILABLE]: 'Disponible',
      [AssetStatus.ASSIGNED]: 'Asignado',
      [AssetStatus.MAINTENANCE]: 'Mantenimiento',
      [AssetStatus.RETIRED]: 'Retirado',
    };
    return labels[status] || status;
  }

  isWarrantyExpired(date: Date | undefined): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  openCreateDialog(): void {
    this.router.navigate(['/assets/new']);
  }

  openEditDialog(asset: Asset): void {
    this.router.navigate(['/assets', asset.id]);
  }

  openViewDialog(asset: Asset): void {
    this.router.navigate(['/assets', 'view', asset.id]);
  }

  changeStatus(asset: Asset, newStatus: AssetStatus): void {
    this.assetService.updateStatus(asset.id, newStatus).subscribe({
      next: () => {
        this.toastService.success('Estado actualizado exitosamente');
        this.loadAssets();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.toastService.error('Error al actualizar el estado');
      },
    });
  }

  deleteAsset(asset: Asset): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: `¿Está seguro que desea eliminar el asset '${asset.name}'? Esta acción no se puede deshacer.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.assetService.delete(asset.id).subscribe({
          next: () => {
            this.toastService.success('Asset eliminado exitosamente');
            this.loadAssets();
          },
          error: (error) => {
            console.error('Error deleting asset:', error);
            this.toastService.error('Error al eliminar el asset');
          },
        });
      }
    });
  }
}

// Confirm Dialog Component
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Eliminar</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}

import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
