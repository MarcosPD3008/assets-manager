import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '@shared/material';
import { FormErrorComponent, MetadataEditorComponent } from '@shared/components';
import { AssignmentService, ContactService, ToastService } from '@core/services';
import { Assignment, Contact, FilterOperator } from '@libs/shared';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormErrorComponent, MetadataEditorComponent],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.scss',
})
export class ContactFormComponent implements OnInit {
  contactForm: FormGroup;
  isEditMode: boolean = false;
  isViewOnly: boolean = false;
  loading: boolean = false;
  contactId: string | null = null;
  assignments: Assignment[] = [];
  assignmentColumns = ['asset', 'startDate', 'dueDate', 'status'];

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private assignmentService: AssignmentService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.contactForm = this.createForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const url = this.router.url;
    
    if (id) {
      this.contactId = id;
      this.isEditMode = true;
      this.isViewOnly = url.includes('/view/');
      this.loadContact(id);
    }

    if (this.isViewOnly) {
      this.contactForm.disable();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      phoneNumber: ['', [Validators.maxLength(50)]],
      department: ['', [Validators.maxLength(100)]],
      position: ['', [Validators.maxLength(100)]],
      notes: ['', [Validators.maxLength(500)]],
      metadata: [{}], // Initialize with empty object for MetadataEditor
    });
  }

  loadContact(id: string): void {
    this.loading = true;
    this.contactService.getById(id).subscribe({
      next: (response) => {
        const contact = response as any;
        this.contactForm.patchValue({
          name: contact.name,
          email: contact.email,
          phoneNumber: contact.phoneNumber || '',
          department: contact.department || '',
          position: contact.position || '',
          notes: contact.notes || '',
          metadata: contact.metadata || {},
        });
        this.loadAssignmentHistory(id);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading contact:', error);
        this.toastService.error('Error al cargar el contacto');
        this.loading = false;
        this.router.navigate(['/contacts']);
      },
    });
  }

  loadAssignmentHistory(contactId: string): void {
    this.assignmentService
      .getAllPaginated(
        [{ prop: 'assigneeId', operator: FilterOperator.EQ, value: contactId }],
        { page: 1, pageSize: 100 }
      )
      .subscribe({
        next: (response) => {
          this.assignments = response.items;
        },
      });
  }

  getTitle(): string {
    if (this.isViewOnly) {
      return 'Detalles del Contacto';
    }
    return this.isEditMode ? 'Editar Contacto' : 'Nuevo Contacto';
  }

  onSubmit(): void {
    if (this.isViewOnly) {
      this.router.navigate(['/contacts']);
      return;
    }

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.contactForm.value;

    const contactData = {
      ...formValue,
      metadata: formValue.metadata // Already an object from MetadataEditor
    };

    const request$ = this.isEditMode && this.contactId
      ? this.contactService.update(this.contactId, contactData)
      : this.contactService.create(contactData);

    request$.subscribe({
      next: () => {
        this.toastService.success(
          this.isEditMode ? 'Contacto actualizado exitosamente' : 'Contacto creado exitosamente'
        );
        this.loading = false;
        this.router.navigate(['/contacts']);
      },
      error: (error) => {
        console.error('Error saving contact:', error);
        this.toastService.error(error?.error?.message || 'Error al guardar el contacto');
        this.loading = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/contacts']);
  }
}
