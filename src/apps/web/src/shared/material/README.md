# Material Module

Este módulo exporta todos los módulos de Angular Material necesarios para la aplicación.

## Uso

### En Standalone Components

```typescript
import { Component } from '@angular/core';
import { MaterialModule } from '@shared/material';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [MaterialModule], // Importa todos los módulos de Material
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Ejemplo</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <button mat-raised-button color="primary">Click me</button>
      </mat-card-content>
    </mat-card>
  `,
})
export class ExampleComponent {}
```

### Importar módulos específicos (más eficiente)

Si solo necesitas algunos módulos, puedes importarlos directamente:

```typescript
import { MatButtonModule, MatCardModule } from '@angular/material';

@Component({
  standalone: true,
  imports: [MatButtonModule, MatCardModule],
  // ...
})
```

## Componentes disponibles

- **MatButtonModule** - Botones
- **MatCardModule** - Tarjetas
- **MatTableModule** - Tablas con paginación
- **MatDialogModule** - Modales/Dialogs
- **MatFormFieldModule** - Campos de formulario
- **MatInputModule** - Inputs
- **MatSelectModule** - Selects
- **MatDatepickerModule** - Selector de fechas
- **MatIconModule** - Iconos
- **MatPaginatorModule** - Paginación
- **MatSnackBarModule** - Notificaciones (alternativa a toast)
- Y muchos más...

## Iconos

Los iconos de Material están disponibles a través de la fuente web. Usa:

```html
<mat-icon>home</mat-icon>
<mat-icon>delete</mat-icon>
<mat-icon>edit</mat-icon>
```

Lista completa: https://fonts.google.com/icons
