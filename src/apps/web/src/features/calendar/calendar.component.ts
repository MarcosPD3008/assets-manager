import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '@shared/material';
import { CalendarService } from '@core/services';
import { Assignment, Maintenance, Reminder } from '@libs/shared';

type CalendarEventType = 'assignment' | 'maintenance' | 'reminder';

interface CalendarEventView {
  id: string;
  type: CalendarEventType;
  title: string;
  date: Date;
  payload: Assignment | Maintenance | Reminder;
}

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  events: CalendarEventView[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  days: CalendarDay[] = [];
  selectedDay?: CalendarDay;
  loading = false;

  weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  constructor(private calendarService: CalendarService, private router: Router) {}

  ngOnInit(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    this.loadCalendar();
  }

  previousMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.loadCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.loadCalendar();
  }

  loadCalendar(): void {
    this.loading = true;
    const dateParam = `${this.currentDate.getFullYear()}-${String(
      this.currentDate.getMonth() + 1
    ).padStart(2, '0')}`;

    this.calendarService.getCalendar(dateParam).subscribe({
      next: (response) => {
        const events = this.buildEvents(
          response.assignments || [],
          response.maintenances || [],
          response.reminders || []
        );
        this.days = this.buildCalendarGrid(this.currentDate, events);
        this.selectedDay = this.getDefaultSelectedDay();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading calendar:', error);
        this.days = this.buildCalendarGrid(this.currentDate, []);
        this.loading = false;
      },
    });
  }

  buildEvents(
    assignments: Assignment[],
    maintenances: Maintenance[],
    reminders: Reminder[]
  ): CalendarEventView[] {
    const assignmentEvents = assignments.map((assignment) => ({
      id: assignment.id,
      type: 'assignment' as const,
      title: `Asignación: ${assignment.asset?.name || 'Activo'}`,
      date: this.toCalendarDate(assignment.dueDate || assignment.startDate),
      payload: assignment,
    }));

    const maintenanceEvents = maintenances.map((maintenance) => ({
      id: maintenance.id,
      type: 'maintenance' as const,
      title: `Mantenimiento: ${maintenance.asset?.name || 'Activo'}`,
      date: this.toCalendarDate(
        maintenance.nextServiceDate || maintenance.lastServiceDate || new Date()
      ),
      payload: maintenance,
    }));

    const reminderEvents = reminders.map((reminder) => ({
      id: reminder.id,
      type: 'reminder' as const,
      title: `Recordatorio: ${reminder.message}`,
      date: this.toCalendarDate(reminder.scheduledDate),
      payload: reminder,
    }));

    return [...assignmentEvents, ...maintenanceEvents, ...reminderEvents];
  }

  buildCalendarGrid(monthDate: Date, events: CalendarEventView[]): CalendarDay[] {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - startOffset);

    const days: CalendarDay[] = [];
    for (let i = 0; i < totalCells; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push({
        date,
        inMonth: date.getMonth() === monthDate.getMonth(),
        events: events.filter((event) => this.isSameDate(event.date, date)),
      });
    }
    return days;
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay = day;
  }

  getMonthTitle(): string {
    return this.currentDate.toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric',
    });
  }

  getEventColor(type: CalendarEventType): string {
    switch (type) {
      case 'assignment':
        return '#1976d2';
      case 'maintenance':
        return '#ef6c00';
      case 'reminder':
        return '#d32f2f';
      default:
        return '#616161';
    }
  }

  navigateEvent(event: CalendarEventView): void {
    if (event.type === 'assignment') {
      this.router.navigate(['/assignments/view', event.id]);
      return;
    }
    if (event.type === 'maintenance') {
      this.router.navigate(['/maintenances/view', event.id]);
      return;
    }
    this.router.navigate(['/reminders/view', event.id]);
  }

  private getDefaultSelectedDay(): CalendarDay | undefined {
    const today = new Date();
    const todayInCurrentMonth = this.days.find(
      (d) => d.inMonth && this.isSameDate(d.date, today)
    );
    const firstWithEvents = this.days.find((d) => d.inMonth && d.events.length > 0);
    const firstInMonth = this.days.find((d) => d.inMonth);

    if (todayInCurrentMonth && todayInCurrentMonth.events.length > 0) {
      return todayInCurrentMonth;
    }

    return firstWithEvents || todayInCurrentMonth || firstInMonth;
  }

  private toCalendarDate(value: Date | string): Date {
    const date = new Date(value);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  private isSameDate(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
