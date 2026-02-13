import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-error.component.html',
  styleUrl: './form-error.component.scss',
})
export class FormErrorComponent {
  @Input() control: AbstractControl | null = null;
  @Input() fieldName: string = 'Este campo';

  get errorMessage(): string | null {
    if (!this.control || !this.shouldShowError()) {
      return null;
    }

    const errors = this.control.errors;
    if (!errors) {
      return null;
    }

    // Required
    if (errors['required']) {
      return `${this.fieldName} es requerido`;
    }

    // MaxLength
    if (errors['maxlength']) {
      const maxLength = errors['maxlength'].requiredLength;
      return `${this.fieldName} no puede exceder ${maxLength} caracteres`;
    }

    // MinLength
    if (errors['minlength']) {
      const minLength = errors['minlength'].requiredLength;
      return `${this.fieldName} debe tener al menos ${minLength} caracteres`;
    }

    // Min
    if (errors['min']) {
      const min = errors['min'].min;
      return `${this.fieldName} debe ser mayor o igual a ${min}`;
    }

    // Max
    if (errors['max']) {
      const max = errors['max'].max;
      return `${this.fieldName} debe ser menor o igual a ${max}`;
    }

    // Email
    if (errors['email']) {
      return `${this.fieldName} debe ser un correo electrónico válido`;
    }

    // Pattern
    if (errors['pattern']) {
      return `${this.fieldName} tiene un formato inválido`;
    }

    // Custom validators
    if (errors['futureDate']) {
      return 'La fecha de compra no puede ser futura';
    }

    if (errors['beforePurchase']) {
      return 'La fecha de vencimiento debe ser posterior a la fecha de compra';
    }

    if (errors['invalidJson']) {
      return 'Ingrese un JSON válido';
    }

    if (errors['alphanumeric']) {
      return 'El número de serie solo puede contener letras y números';
    }

    return 'Campo inválido';
  }

  shouldShowError(): boolean {
    if (!this.control) {
      return false;
    }
    return (this.control.invalid && (this.control.dirty || this.control.touched));
  }
}
