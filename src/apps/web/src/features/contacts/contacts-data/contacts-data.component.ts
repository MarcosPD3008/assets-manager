import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@shared/material';
import { PaginationComponent } from '@shared/components';
import { ContactService, ExportFormat, ExportScope, ToastService } from '@core/services';
import { Contact, ODataFilter, FilterOperator } from '@libs/shared';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from '../../assets/assets-data/assets-data.component';
import { Subject, EMPTY } from 'rxjs';
import { catchError, debounceTime, exhaustMap, finalize, takeUntil, tap } from 'rxjs/operators';

interface FilterState {
  name: string;
  email: string;
  department: string;
}

interface ExportRequest {
  format: ExportFormat;
  scope: ExportScope;
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
export class ContactsDataComponent implements OnInit, OnDestroy {
  contacts: Contact[] = [];
  total: number = 0;
  page: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  loading: boolean = false;
  exportInProgress: boolean = false;
  filtersExpanded: boolean = false;
  private readonly exportRequests$ = new Subject<ExportRequest>();
  private readonly destroy$ = new Subject<void>();

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
    this.setupExportStream();
    this.loadContacts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  requestExport(format: ExportFormat, scope: ExportScope): void {
    this.exportRequests$.next({ format, scope });
  }

  openCreateDialog(): void {
    this.router.navigate(['/contacts/new']);
  }

  openImportPage(): void {
    this.router.navigate(['/contacts/import']);
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

  private setupExportStream(): void {
    this.exportRequests$
      .pipe(
        debounceTime(350),
        exhaustMap((request) => {
          this.exportInProgress = true;
          this.cdr.detectChanges();

          return this.contactService
            .exportData(
              request.format,
              request.scope,
              this.buildODataFilters(),
              { page: this.page, pageSize: this.pageSize },
            )
            .pipe(
              tap((response) => this.downloadFile(response, request.format)),
              tap(() => this.toastService.success('Exportación generada correctamente')),
              catchError((error) => {
                console.error('Error exporting contacts:', error);
                this.toastService.error('No se pudo generar la exportación de contactos');
                return EMPTY;
              }),
              finalize(() => {
                this.exportInProgress = false;
                this.cdr.detectChanges();
              }),
            );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  private downloadFile(response: HttpResponse<Blob>, format: ExportFormat): void {
    const blob = response.body;
    if (!blob) {
      throw new Error('Export response did not include a file');
    }

    const fileName = this.extractFileName(response, format, 'contacts');
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }

  private extractFileName(
    response: HttpResponse<Blob>,
    format: ExportFormat,
    fallbackPrefix: string,
  ): string {
    const contentDisposition = response.headers.get('content-disposition') || response.headers.get('Content-Disposition');
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
      if (match && match[1]) {
        return decodeURIComponent(match[1].replace(/"/g, ''));
      }
    }

    const extension = format === 'pdf' ? 'pdf' : 'xlsx';
    const dateStamp = new Date().toISOString().slice(0, 10);
    return `${fallbackPrefix}-${dateStamp}.${extension}`;
  }
}
