/**
 * Shared interfaces and models between Angular and NestJS
 */

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

/**
 * Standard error response format from API
 */
export interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  error?: string;
  errors?: ValidationError[];
  timestamp: string;
  path: string;
  stack?: string; // Only in development
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Generic API error
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export function shared(): string {
  return 'shared';
}