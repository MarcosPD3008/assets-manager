import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { QueryFailedError, EntityNotFoundError, TypeORMError } from 'typeorm';
import { TimeoutError } from 'rxjs';

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


@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger: Logger;

  constructor(private readonly loggerService?: LoggerService) {
    this.logger = new Logger(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isDevelopment = process.env['NODE_ENV'] !== 'production';

    let status: number;
    let message: string;
    let error: string | undefined;
    let errors: ValidationError[] | undefined;
    let stack: string | undefined;

    // Handle TypeORM errors
    if (exception instanceof QueryFailedError) {
      const dbError = this.handleDatabaseError(exception);
      status = dbError.statusCode;
      message = dbError.message;
      error = dbError.error;
      stack = isDevelopment ? (exception as Error).stack : undefined;
    } else if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Resource not found';
      error = 'EntityNotFoundError';
      stack = isDevelopment ? (exception as Error).stack : undefined;
    } else if (exception instanceof TypeORMError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = isDevelopment ? exception.message : 'Database error occurred';
      error = 'DatabaseError';
      stack = isDevelopment ? (exception as Error).stack : undefined;
    }
    // Handle timeout errors
    else if (exception instanceof TimeoutError) {
      status = HttpStatus.REQUEST_TIMEOUT;
      message = 'Request timeout';
      error = 'TimeoutError';
    }
    // Handle HTTP exceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj['message'] as string) || exception.message || 'An error occurred';
        error = (responseObj['error'] as string) || exception.name;
        
        // Handle validation errors with improved formatting
        if (Array.isArray(responseObj['message'])) {
          errors = (responseObj['message'] as string[]).map((msg: string, index: number) => {
            // Try to extract field name from validation message
            const fieldMatch = msg.match(/^(\w+)\s/);
            const field = fieldMatch ? fieldMatch[1] : `field${index}`;
            return {
              field,
              message: msg,
            };
          });
          message = 'Validation failed';
        }
        // Handle validation errors from class-validator
        else if (responseObj['errors'] && Array.isArray(responseObj['errors'])) {
          errors = responseObj['errors'] as ValidationError[];
          message = 'Validation failed';
        }
      } else {
        message = exception.message || 'An error occurred';
      }
    } 
    // Handle generic errors
    else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Internal server error';
      error = exception.name;
      stack = isDevelopment ? exception.stack : undefined;
    } 
    // Handle unknown errors
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'UnknownError';
    }

    // Sanitize error in production
    if (!isDevelopment) {
      message = this.sanitizeErrorMessage(message, status);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message,
      statusCode: status,
      error,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(isDevelopment && stack ? { stack } : {}),
    };

    // Log the error
    const logContext = {
      method: request.method,
      url: request.url,
      statusCode: status,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };

    if (status >= 500) {
      // Server errors
      if (this.loggerService) {
        this.loggerService.error(message, stack, logContext);
      } else {
        this.logger.error(`${message} ${stack || ''}`, JSON.stringify(logContext));
      }
    } else if (status >= 400) {
      // Client errors
      if (this.loggerService) {
        this.loggerService.warn(message, logContext);
      } else {
        this.logger.warn(message, JSON.stringify(logContext));
      }
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Handle database errors from TypeORM
   */
  private handleDatabaseError(error: QueryFailedError): {
    statusCode: number;
    message: string;
    error: string;
  } {
    const isDevelopment = process.env['NODE_ENV'] !== 'production';
    
    // Handle specific database errors
    const driverError = error.driverError as { code?: string; detail?: string };
    
    // PostgreSQL error codes
    if (driverError.code === '23505') {
      // Unique violation
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Resource already exists',
        error: 'DuplicateError',
      };
    } else if (driverError.code === '23503') {
      // Foreign key violation
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Referenced resource does not exist',
        error: 'ForeignKeyViolation',
      };
    } else if (driverError.code === '23502') {
      // Not null violation
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Required field is missing',
        error: 'NotNullViolation',
      };
    }

    // Generic database error
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isDevelopment ? error.message : 'Database error occurred',
      error: 'DatabaseError',
    };
  }

  /**
   * Sanitize error messages in production to avoid exposing sensitive information
   */
  private sanitizeErrorMessage(message: string, status: number): string {
    // For server errors, use generic message
    if (status >= 500) {
      return 'An internal server error occurred. Please try again later.';
    }

    // For client errors, keep the message but remove any potential sensitive data
    // Remove file paths, SQL queries, etc.
    return message
      .replace(/\/[^\s]+\.(ts|js|sql)/gi, '[file]')
      .replace(/at\s+[^\s]+\s+\([^)]+\)/gi, '')
      .replace(/Query:\s+.+/gi, '')
      .trim();
  }
}
