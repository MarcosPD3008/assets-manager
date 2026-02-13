import { Component, Inject, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '@shared/material';
import { FormErrorComponent } from '@shared/components';
import { AssignmentService, AssetService, ContactService, ToastService } from '@core/services';
import {
  AssignmentStatus,
  Asset,
  AssetStatus,
  Contact,
  FilterOperator,
} from '@libs/shared';

interface DialogData {
  assignmentId?: string;
  viewOnly?: boolean;
}

@Component({
  selector: 'app-assignment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormErrorComponent],
  templateUrl: './assignment-form.component.html',
  styleUrl: './assignment-form.component.scss',
})
export class AssignmentFormComponent implements OnInit {
  assignmentForm: FormGroup;
  isEditMode = false;
  isViewOnly = false;
  loading = false;
  isDialogMode: boolean;
  assignmentId: string | null = null;

  availableAssets: Asset[] = [];
  contacts: Contact[] = [];
  assignmentStatuses = Object.values(AssignmentStatus);

  constructor(
    private fb: FormBuilder,
    private assignmentService: AssignmentService,
    private assetService: AssetService,
    private contactService: ContactService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    @Optional() private dialogRef: MatDialogRef<AssignmentFormComponent> | null,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: DialogData | null
  ) {
    this.isDialogMode = !!dialogRef;
    this.isEditMode = !!data?.assignmentId;
    this.isViewOnly = !!data?.viewOnly;
    this.assignmentForm = this.createForm();

    if (this.isViewOnly) {
      this.assignmentForm.disable();
    }
  }

  ngOnInit(): void {
    if (!this.isDialogMode) {
      this.assignmentId = this.route.snapshot.paramMap.get('id');
      this.isEditMode = !!this.assignmentId;
      this.isViewOnly = this.router.url.includes('/view/');
      if (this.isViewOnly) {
        this.assignmentForm.disable();
      }
    }

    this.loadDependencies();
    const id = this.data?.assignmentId || this.assignmentId;
    if (this.isEditMode && id) {
      this.loadAssignment(id);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      assetId: ['', [Validators.required]],
      assigneeId: ['', [Validators.required]],
      notes: ['', [Validators.maxLength(500)]],
      startDate: [new Date(), [Validators.required]],
      dueDate: [null],
      isPermanent: [false],
      status: [AssignmentStatus.ACTIVE],
    });
  }

  loadDependencies(): void {
    this.loading = true;
    
    // Load available assets
    this.assetService.getAllPaginated([
      { prop: 'status', operator: FilterOperator.EQ, value: AssetStatus.AVAILABLE }
    ], { page: 1, pageSize: 1000 }).subscribe({
      next: (response) => {
        this.availableAssets = response.items;
      },
      error: (error) => {
        console.error('Error loading available assets:', error);
        this.toastService.error('Error al cargar assets disponibles');
      }
    });

    // Load contacts
    this.contactService.getAllPaginated([], { page: 1, pageSize: 1000 }).subscribe({
      next: (response) => {
        this.contacts = response.items;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.toastService.error('Error al cargar contactos');
        this.loading = false;
      }
    });
  }

  loadAssignment(id: string): void {
    this.loading = true;
    this.assignmentService.getById(id).subscribe({
      next: (response) => {
        const assignment = response as unknown as any;
        this.assignmentForm.patchValue({
          assetId: assignment.assetId,
          assigneeId: assignment.assigneeId,
          notes: assignment.notes,
          startDate: assignment.startDate ? new Date(assignment.startDate) : null,
          dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null,
          isPermanent: !!assignment.isPermanent,
          status: assignment.status || AssignmentStatus.ACTIVE,
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading assignment:', error);
        this.toastService.error('Error al cargar la asignación');
        this.loading = false;
        this.close(false);
      },
    });
  }

  getTitle(): string {
    if (this.isViewOnly) {
      return 'Detalles de la Asignación';
    }
    return this.isEditMode ? 'Editar Asignación' : 'Nueva Asignación';
  }

  getStatusLabel(status: AssignmentStatus): string {
    const labels: Record<AssignmentStatus, string> = {
      [AssignmentStatus.ACTIVE]: 'Activa',
      [AssignmentStatus.COMPLETED]: 'Completada',
      [AssignmentStatus.OVERDUE]: 'Vencida',
    };
    return labels[status] || status;
  }

  onSubmit(): void {
    if (this.isViewOnly) {
      this.close(false);
      return;
    }

    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.assignmentForm.value;

    const assignmentData = {
      ...formValue,
      startDate: new Date(formValue.startDate).toISOString(),
      dueDate: formValue.dueDate ? new Date(formValue.dueDate).toISOString() : null,
    };

    const request$ = this.isEditMode && (this.data?.assignmentId || this.assignmentId)
      ? this.assignmentService.update(this.data?.assignmentId || this.assignmentId!, assignmentData)
      : this.assignmentService.create(assignmentData);

    request$.subscribe({
      next: () => {
        this.toastService.success(
          this.isEditMode
            ? 'Asignación actualizada exitosamente'
            : 'Asignación creada exitosamente'
        );
        this.loading = false;
        this.close(true);
      },
      error: (error) => {
        console.error('Error creating assignment:', error);
        this.toastService.error(error?.error?.message || 'Error al crear la asignación');
        this.loading = false;
      },
    });
  }

  onCancel(): void {
    this.close(false);
  }

  private close(success: boolean): void {
    if (this.dialogRef) {
      this.dialogRef.close(success);
      return;
    }
    this.router.navigate(['/assignments']);
  }
}
