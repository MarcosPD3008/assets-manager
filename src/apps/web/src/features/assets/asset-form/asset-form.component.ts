import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '@shared/material';
import { FormErrorComponent, MetadataEditorComponent } from '@shared/components';
import { CustomValidators } from '@shared/validators';
import { AssetService, ToastService } from '@core/services';
import { AssetStatus } from '@libs/shared';

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormErrorComponent, MetadataEditorComponent],
  templateUrl: './asset-form.component.html',
  styleUrl: './asset-form.component.scss',
})
export class AssetFormComponent implements OnInit {
  assetForm: FormGroup;
  isEditMode: boolean = false;
  isViewOnly: boolean = false;
  loading: boolean = false;
  assetStatuses = Object.values(AssetStatus);
  assetId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.assetForm = this.createForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const url = this.router.url;

    if (id) {
      this.assetId = id;
      this.isEditMode = true;
      this.isViewOnly = url.includes('/view/');
      this.loadAsset(id);
    }

    if (this.isViewOnly) {
      this.assetForm.disable();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      serialNumber: ['', [Validators.maxLength(100), CustomValidators.alphanumeric()]],
      status: [AssetStatus.AVAILABLE],
      category: ['', [Validators.maxLength(100)]],
      location: ['', [Validators.maxLength(255)]],
      purchaseDate: ['', [CustomValidators.notFutureDate()]],
      purchasePrice: ['', [Validators.min(0)]],
      warrantyExpiryDate: ['', [CustomValidators.afterPurchaseDate('purchaseDate')]],
      metadata: [{}], // Initialize with empty object for MetadataEditor
    });
  }

  loadAsset(id: string): void {
    this.loading = true;
    this.assetService.getById(id).subscribe({
      next: (response) => {
        const asset = response as any;
        this.assetForm.patchValue({
          name: asset.name,
          description: asset.description || '',
          serialNumber: asset.serialNumber || '',
          status: asset.status,
          category: asset.category || '',
          location: asset.location || '',
          purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : '',
          purchasePrice: asset.purchasePrice || '',
          warrantyExpiryDate: asset.warrantyExpiryDate ? new Date(asset.warrantyExpiryDate) : '',
          metadata: asset.metadata || {},
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading asset:', error);
        this.toastService.error('Error al cargar el asset');
        this.loading = false;
        this.router.navigate(['/assets']);
      },
    });
  }

  getTitle(): string {
    if (this.isViewOnly) {
      return 'Detalles del Asset';
    }
    return this.isEditMode ? 'Editar Asset' : 'Crear Asset';
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

  onSubmit(): void {
    if (this.isViewOnly) {
      this.router.navigate(['/assets']);
      return;
    }

    if (this.assetForm.invalid) {
      this.assetForm.markAllAsTouched();
      this.toastService.warning('Por favor, corrija los errores en el formulario');
      return;
    }

    this.loading = true;
    const formValue = this.assetForm.value;

    // Format dates
    const assetData = {
      ...formValue,
      purchaseDate: formValue.purchaseDate
        ? new Date(formValue.purchaseDate).toISOString().split('T')[0]
        : null,
      warrantyExpiryDate: formValue.warrantyExpiryDate
        ? new Date(formValue.warrantyExpiryDate).toISOString().split('T')[0]
        : null,
      metadata: formValue.metadata, // Already an object
    };

    const request$ = this.isEditMode && this.assetId
      ? this.assetService.update(this.assetId, assetData)
      : this.assetService.create(assetData);

    request$.subscribe({
      next: () => {
        this.toastService.success(
          this.isEditMode ? 'Asset actualizado exitosamente' : 'Asset creado exitosamente'
        );
        this.loading = false;
        this.router.navigate(['/assets']);
      },
      error: (error) => {
        console.error('Error saving asset:', error);
        const errorMessage =
          error?.error?.message || 'Error al guardar el asset';
        this.toastService.error(errorMessage);
        this.loading = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/assets']);
  }
}
