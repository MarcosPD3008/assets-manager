# Toast Service

Servicio wrapper para `ngx-toastr` que simplifica el uso de notificaciones toast en la aplicación.

## Uso

### Inyectar el servicio

```typescript
import { Component } from '@angular/core';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-example',
  standalone: true,
  // ...
})
export class ExampleComponent {
  constructor(private toast: ToastService) {}

  onSuccess() {
    this.toast.success('Operación exitosa', 'Éxito');
  }

  onError() {
    this.toast.error('Ocurrió un error', 'Error');
  }

  onWarning() {
    this.toast.warning('Atención requerida', 'Advertencia');
  }

  onInfo() {
    this.toast.info('Información importante', 'Info');
  }

  // Con opciones personalizadas
  customToast() {
    this.toast.show('success', 'Mensaje personalizado', 'Título', {
      duration: 3000,
      position: 'bottom-right',
    });
  }
}
```

## Métodos disponibles

### `success(message, title?, options?)`
Muestra un toast de éxito (verde).

### `error(message, title?, options?)`
Muestra un toast de error (rojo).

### `warning(message, title?, options?)`
Muestra un toast de advertencia (amarillo).

### `info(message, title?, options?)`
Muestra un toast informativo (azul).

### `show(type, message, title?, options?)`
Muestra un toast con tipo personalizado.

### `clear()`
Limpia todos los toasts visibles.

## Opciones

```typescript
interface ToastOptions {
  duration?: number;        // Duración en ms (default: 5000)
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}
```
