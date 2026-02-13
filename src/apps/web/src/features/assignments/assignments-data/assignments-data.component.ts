import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@shared/material';
import { PaginationComponent } from '@shared/components';
import { AssignmentService, ToastService } from '@core/services';
import { Assignment, ODataFilter, FilterOperator } from '@libs/shared';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from '../../assets/assets-data/assets-data.component';

interface FilterState {
  assetName: string;
  contactName: string;
  isActive: boolean | null;
}

@Component({
  selector: 'app-assignments-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    PaginationComponent,
  ],
  templateUrl: './assignments-data.component.html',
  styleUrl: './assignments-data.component.scss',
})
export class AssignmentsDataComponent implements OnInit {
  assignments: Assignment[] = [];
  total: number = 0;
  page: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  loading: boolean = false;
  filtersExpanded: boolean = false;

  displayedColumns: string[] = [
    'asset',
    'contact',
    'assignedAt',
    'returnedAt',
    'actions',
  ];

  filters: FilterState = {
    assetName: '',
    contactName: '',
    isActive: null,
  };

  constructor(
    private assignmentService: AssignmentService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.loading = true;
    const odataFilters = this.buildODataFilters();
    const hasTextFilters =
      this.filters.assetName.trim().length > 0 ||
      this.filters.contactName.trim().length > 0;

    this.assignmentService
      .getAllPaginated(odataFilters, {
        page: hasTextFilters ? 1 : this.page,
        pageSize: hasTextFilters ? 500 : this.pageSize,
      })
      .subscribe({
        next: (response) => {
          const items = hasTextFilters
            ? this.applyClientSideFilters(response.items)
            : response.items;
          if (hasTextFilters) {
            this.total = items.length;
            const start = (this.page - 1) * this.pageSize;
            this.assignments = items.slice(start, start + this.pageSize);
          } else {
            this.assignments = response.items;
            this.total = response.total;
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading assignments:', error);
          this.toastService.error('Error al cargar las asignaciones');
          this.loading = false;
        },
      });
  }

  buildODataFilters(): ODataFilter[] {
    const filters: ODataFilter[] = [];

    if (this.filters.isActive === true) {
      filters.push({
        prop: 'returnDate',
        operator: FilterOperator.IS_NULL,
        value: null,
      });
    } else if (this.filters.isActive === false) {
        filters.push({
            prop: 'returnDate',
            operator: FilterOperator.IS_NOT_NULL,
            value: null,
        });
    }

    return filters;
  }

  applyClientSideFilters(items: Assignment[]): Assignment[] {
    const assetName = this.filters.assetName.trim().toLowerCase();
    const contactName = this.filters.contactName.trim().toLowerCase();
    return items.filter((assignment) => {
      const assetMatches = assetName
        ? (assignment.asset?.name || '').toLowerCase().includes(assetName)
        : true;
      const contactMatches = contactName
        ? (assignment.assignee?.name || '').toLowerCase().includes(contactName)
        : true;
      return assetMatches && contactMatches;
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadAssignments();
  }

  clearFilters(): void {
    this.filters = {
      assetName: '',
      contactName: '',
      isActive: null,
    };
    this.applyFilters();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadAssignments();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.page = 1;
    this.loadAssignments();
  }

  openCreateDialog(): void {
    this.router.navigate(['/assignments/new']);
  }

  openViewDialog(assignment: Assignment): void {
    this.router.navigate(['/assignments/view', assignment.id]);
  }

  openEditDialog(assignment: Assignment): void {
    this.router.navigate(['/assignments', assignment.id]);
  }

  returnAssignment(assignment: Assignment): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Registrar devolución',
        message: `¿Desea cerrar la asignación del activo "${assignment.asset?.name || 'activo'}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.assignmentService.closeAssignment(assignment.id).subscribe({
        next: () => {
          this.toastService.success('Asignación cerrada exitosamente');
          this.loadAssignments();
        },
        error: (error) => {
          console.error('Error closing assignment:', error);
          this.toastService.error(
            error?.error?.message || 'No se pudo cerrar la asignación'
          );
        },
      });
    });
  }
}
