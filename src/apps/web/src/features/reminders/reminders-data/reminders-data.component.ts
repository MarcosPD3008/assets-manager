import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '@shared/material';
import { PaginationComponent } from '@shared/components';
import { ReminderService, ToastService } from '@core/services';
import {
  Reminder,
  ReminderType,
  Priority,
  Channel,
  ReminderSourceType,
  ReminderStatus,
  ODataFilter,
  FilterOperator,
} from '@libs/shared';

interface FilterState {
  status: ReminderStatus | '';
  type: ReminderType | '';
  sourceType: ReminderSourceType | '';
}

@Component({
  selector: 'app-reminders-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    PaginationComponent,
  ],
  templateUrl: './reminders-data.component.html',
  styleUrl: './reminders-data.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class RemindersDataComponent implements OnInit {
  reminders: Reminder[] = [];
  total = 0;
  page = 1;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  loading = false;
  filtersExpanded = false;

  displayedColumns: string[] = [
    'message',
    'scheduledDate',
    'type',
    'priority',
    'channel',
    'sourceType',
    'status',
    'actions',
  ];

  filters: FilterState = {
    status: '',
    type: '',
    sourceType: '',
  };

  reminderTypes = Object.values(ReminderType);
  reminderStatuses = Object.values(ReminderStatus);
  reminderSources = Object.values(ReminderSourceType);

  constructor(
    private reminderService: ReminderService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReminders();
  }

  loadReminders(): void {
    this.loading = true;
    const odataFilters = this.buildODataFilters();

    this.reminderService
      .getAllPaginated(odataFilters, { page: this.page, pageSize: this.pageSize })
      .subscribe({
        next: (response) => {
          this.reminders = response.items.map((item) => ({
            ...item,
            status:
              item.status ??
              ((item as Reminder).isSent ? ReminderStatus.SENT : ReminderStatus.PENDING),
            sourceType: item.sourceType ?? ReminderSourceType.MANUAL,
          }));
          this.total = response.total;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading reminders:', error);
          this.toastService.error('Error al cargar los recordatorios');
          this.loading = false;
        },
      });
  }

  buildODataFilters(): ODataFilter[] {
    const filters: ODataFilter[] = [];

    if (this.filters.status) {
      filters.push({
        prop: 'status',
        operator: FilterOperator.EQ,
        value: this.filters.status,
      });
    }

    if (this.filters.type) {
      filters.push({
        prop: 'type',
        operator: FilterOperator.EQ,
        value: this.filters.type,
      });
    }

    if (this.filters.sourceType) {
      filters.push({
        prop: 'sourceType',
        operator: FilterOperator.EQ,
        value: this.filters.sourceType,
      });
    }

    return filters;
  }

  applyFilters(): void {
    this.page = 1;
    this.loadReminders();
  }

  clearFilters(): void {
    this.filters = {
      status: '',
      type: '',
      sourceType: '',
    };
    this.applyFilters();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadReminders();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.page = 1;
    this.loadReminders();
  }

  markAsSent(reminder: Reminder): void {
    this.loading = true;
    this.reminderService.markAsSent(reminder.id).subscribe({
      next: () => {
        this.toastService.success('Recordatorio marcado como enviado');
        this.loadReminders();
      },
      error: (error) => {
        console.error('Error marking as sent:', error);
        this.toastService.error('Error al actualizar el recordatorio');
        this.loading = false;
      },
    });
  }

  getPriorityColor(priority: Priority): string {
    switch (priority) {
      case Priority.HIGH:
        return '#f44336';
      case Priority.MEDIUM:
        return '#ff9800';
      case Priority.LOW:
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  }

  getPriorityLabel(priority: Priority): string {
    const labels: Record<Priority, string> = {
      [Priority.HIGH]: 'Alta',
      [Priority.MEDIUM]: 'Media',
      [Priority.LOW]: 'Baja',
    };
    return labels[priority] || priority;
  }

  getStatusLabel(status: ReminderStatus): string {
    const labels: Record<ReminderStatus, string> = {
      [ReminderStatus.PENDING]: 'Pendiente',
      [ReminderStatus.SENT]: 'Enviado',
      [ReminderStatus.OVERDUE]: 'Vencido',
    };
    return labels[status] || status;
  }

  getStatusClass(status: ReminderStatus): string {
    if (status === ReminderStatus.SENT) {
      return 'status-sent';
    }
    if (status === ReminderStatus.OVERDUE) {
      return 'status-overdue';
    }
    return 'status-pending';
  }

  getSourceTypeLabel(sourceType: ReminderSourceType): string {
    return sourceType === ReminderSourceType.RULE ? 'Regla' : 'Manual';
  }

  getChannelLabel(channel: Channel): string {
    const labels: Record<Channel, string> = {
      [Channel.IN_APP]: 'In-App',
      [Channel.EMAIL]: 'Correo',
      [Channel.SMS]: 'SMS',
      [Channel.PUSH]: 'Push',
      [Channel.WHATSAPP]: 'WhatsApp',
    };
    return labels[channel] || channel;
  }

  canMarkAsSent(reminder: Reminder): boolean {
    return reminder.status === ReminderStatus.PENDING || reminder.status === ReminderStatus.OVERDUE;
  }

  navigateToCreate(): void {
    this.router.navigate(['/reminders/new']);
  }

  navigateToEdit(reminder: Reminder): void {
    this.router.navigate(['/reminders', reminder.id]);
  }

  navigateToView(reminder: Reminder): void {
    this.router.navigate(['/reminders/view', reminder.id]);
  }
}
