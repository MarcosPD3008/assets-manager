import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '@shared/material';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  @Input() total: number = 0;
  @Input() page: number = 1;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  get startIndex(): number {
    return (this.page - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    const end = this.page * this.pageSize;
    return end > this.total ? this.total : end;
  }

  get isFirstPage(): boolean {
    return this.page === 1;
  }

  get isLastPage(): boolean {
    return this.page >= this.totalPages;
  }

  goToFirstPage(): void {
    if (!this.isFirstPage) {
      this.pageChange.emit(1);
    }
  }

  goToPreviousPage(): void {
    if (!this.isFirstPage) {
      this.pageChange.emit(this.page - 1);
    }
  }

  goToNextPage(): void {
    if (!this.isLastPage) {
      this.pageChange.emit(this.page + 1);
    }
  }

  goToLastPage(): void {
    if (!this.isLastPage) {
      this.pageChange.emit(this.totalPages);
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSizeChange.emit(newSize);
    // Reset to first page when changing page size
    if (this.page !== 1) {
      this.pageChange.emit(1);
    }
  }
}
