import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private toastr: ToastrService) {}

  /**
   * Show success toast
   */
  success(message: string, title?: string, options?: Partial<ToastOptions>): void {
    this.toastr.success(message, title, {
      timeOut: options?.duration || 5000,
      positionClass: this.getPositionClass(options?.position || 'top-right'),
    });
  }

  /**
   * Show error toast
   */
  error(message: string, title?: string, options?: Partial<ToastOptions>): void {
    this.toastr.error(message, title, {
      timeOut: options?.duration || 5000,
      positionClass: this.getPositionClass(options?.position || 'top-right'),
    });
  }

  /**
   * Show warning toast
   */
  warning(message: string, title?: string, options?: Partial<ToastOptions>): void {
    this.toastr.warning(message, title, {
      timeOut: options?.duration || 5000,
      positionClass: this.getPositionClass(options?.position || 'top-right'),
    });
  }

  /**
   * Show info toast
   */
  info(message: string, title?: string, options?: Partial<ToastOptions>): void {
    this.toastr.info(message, title, {
      timeOut: options?.duration || 5000,
      positionClass: this.getPositionClass(options?.position || 'top-right'),
    });
  }

  /**
   * Show toast with custom type
   */
  show(type: ToastType, message: string, title?: string, options?: Partial<ToastOptions>): void {
    const toastOptions = {
      timeOut: options?.duration || 5000,
      positionClass: this.getPositionClass(options?.position || 'top-right'),
    };

    switch (type) {
      case 'success':
        this.toastr.success(message, title, toastOptions);
        break;
      case 'error':
        this.toastr.error(message, title, toastOptions);
        break;
      case 'warning':
        this.toastr.warning(message, title, toastOptions);
        break;
      case 'info':
        this.toastr.info(message, title, toastOptions);
        break;
    }
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toastr.clear();
  }

  /**
   * Convert position string to Toastr position class
   */
  private getPositionClass(position: ToastOptions['position']): string {
    const positionMap: Record<string, string> = {
      'top-right': 'toast-top-right',
      'top-left': 'toast-top-left',
      'bottom-right': 'toast-bottom-right',
      'bottom-left': 'toast-bottom-left',
      'top-center': 'toast-top-center',
      'bottom-center': 'toast-bottom-center',
    };
    return positionMap[position || 'top-right'] || 'toast-top-right';
  }
}
