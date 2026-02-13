/**
 * Shared components that can be used in Angular applications
 * These are basic component interfaces/types that can be implemented
 */

export interface BaseComponent {
  isLoading: boolean;
  error?: string;
}

export interface FormComponent extends BaseComponent {
  isSubmitting: boolean;
  submit(): void;
  reset(): void;
}

export interface ListComponent<T> extends BaseComponent {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  loadItems(): void;
  onPageChange(page: number): void;
}

export interface ModalComponent extends BaseComponent {
  isOpen: boolean;
  title: string;
  open(): void;
  close(): void;
}

// Common component configurations
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface ButtonConfig {
  label: string;
  type: 'primary' | 'secondary' | 'danger' | 'success';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

export interface InputConfig {
  label: string;
  placeholder?: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
}

// Utility functions for components
export function createButtonConfig(
  label: string,
  type: ButtonConfig['type'] = 'primary',
  size: ButtonConfig['size'] = 'medium'
): ButtonConfig {
  return { label, type, size };
}

export function createInputConfig(
  label: string,
  type: InputConfig['type'] = 'text',
  required = false
): InputConfig {
  return { label, type, required };
}

export function createTableColumn(
  key: string,
  label: string,
  sortable = false
): TableColumn {
  return { key, label, sortable };
}

