import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@shared/material';
import { PaginationComponent } from '@shared/components';
import { ContactService, ToastService } from '@core/services';
import { Contact, ODataFilter, FilterOperator } from '@libs/shared';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ContactFormComponent } from '../contact-form/contact-form.component';
import { ConfirmDialogComponent } from '../../assets/assets-data/assets-data.component';

interface FilterState {
  name: string;
  email: string;
  department: string;
}

@Component({
  selector: 'app-contacts-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    PaginationComponent,
  ],
  templateUrl: './contacts-data.component.html',
  styleUrl: './contacts-data.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ContactsDataComponent implements OnInit {
  contacts: Contact[] = [];
  total: number = 0;
  page: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  loading: boolean = false;
  filtersExpanded: boolean = false;

  displayedColumns: string[] = [
    'name',
    'email',
    'phoneNumber',
    'department',
    'position',
    'actions',
  ];

  filters: FilterState = {
    name: '',
    email: '',
    department: '',
  };

  constructor(
    private contactService: ContactService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    this.loading = true;
    const odataFilters = this.buildODataFilters();

    this.contactService
      .getAllPaginated(odataFilters, { page: this.page, pageSize: this.pageSize })
      .subscribe({
        next: (response) => {
          this.contacts = response.items;
          this.total = response.total;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading contacts:', error);
          this.toastService.error('Error al cargar contactos');
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

    if (this.filters.email) {
      filters.push({
        prop: 'email',
        operator: FilterOperator.CONTAINS,
        value: this.filters.email,
      });
    }

    if (this.filters.department) {
      filters.push({
        prop: 'department',
        operator: FilterOperator.CONTAINS,
        value: this.filters.department,
      });
    }

    return filters;
  }

  applyFilters(): void {
    this.page = 1;
    this.loadContacts();
  }

  clearFilters(): void {
    this.filters = {
      name: '',
      email: '',
      department: '',
    };
    this.applyFilters();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadContacts();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.page = 1;
    this.loadContacts();
  }

  openCreateDialog(): void {
    this.router.navigate(['/contacts/new']);
  }

  openEditDialog(contact: Contact): void {
    this.router.navigate(['/contacts', contact.id]);
  }

  openViewDialog(contact: Contact): void {
    this.router.navigate(['/contacts', 'view', contact.id]);
  }

  deleteContact(contact: Contact): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: `¿Está seguro que desea eliminar el contacto '${contact.name}'?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.contactService.delete(contact.id).subscribe({
          next: () => {
            this.toastService.success('Contacto eliminado exitosamente');
            this.loadContacts();
          },
          error: (error) => {
            console.error('Error deleting contact:', error);
            this.toastService.error('Error al eliminar el contacto');
          },
        });
      }
    });
  }
}
