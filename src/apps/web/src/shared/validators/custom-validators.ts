import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Validates that a date is not in the future
   */
  static notFutureDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const inputDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate > today) {
        return { futureDate: true };
      }

      return null;
    };
  }

  /**
   * Validates that a date is after another date field
   * @param purchaseDateField Name of the purchase date field to compare against
   */
  static afterPurchaseDate(purchaseDateField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const parent = control.parent;
      if (!parent) {
        return null;
      }

      const purchaseDate = parent.get(purchaseDateField)?.value;
      if (!purchaseDate) {
        return null;
      }

      const warrantyDate = new Date(control.value);
      const purchase = new Date(purchaseDate);

      if (warrantyDate <= purchase) {
        return { beforePurchase: true };
      }

      return null;
    };
  }

  /**
   * Validates that a string is valid JSON
   */
  static validJSON(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      try {
        JSON.parse(control.value);
        return null;
      } catch (e) {
        return { invalidJson: true };
      }
    };
  }

  /**
   * Validates that a string contains only alphanumeric characters
   */
  static alphanumeric(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      if (!alphanumericRegex.test(control.value)) {
        return { alphanumeric: true };
      }

      return null;
    };
  }
}
