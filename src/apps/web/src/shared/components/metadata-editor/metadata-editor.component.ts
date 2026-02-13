import { Component, forwardRef, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

interface MetadataItem {
  key: string;
  value: string;
}

@Component({
  selector: 'app-metadata-editor',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './metadata-editor.component.html',
  styleUrl: './metadata-editor.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MetadataEditorComponent),
      multi: true,
    },
  ],
})
export class MetadataEditorComponent implements OnInit, ControlValueAccessor {
  items: MetadataItem[] = [];
  disabled = false;

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  ngOnInit(): void {}

  // ControlValueAccessor methods
  writeValue(value: any): void {
    if (value && typeof value === 'object') {
      this.items = Object.entries(value).map(([key, value]) => ({
        key,
        value: String(value), // Ensure value is string for simplicity
      }));
    } else {
      this.items = [];
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Component methods
  addItem(): void {
    this.items.push({ key: '', value: '' });
    this.updateValue();
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    this.updateValue();
  }

  updateValue(): void {
    const result = this.items.reduce((acc, item) => {
      if (item.key.trim()) {
        acc[item.key.trim()] = item.value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    this.onChange(result);
    this.onTouched();
  }
}
