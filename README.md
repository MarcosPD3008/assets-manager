# Assets Manager

Aplicación fullstack para la **gestión integral de activos empresariales**: inventario, asignaciones a contactos, mantenimientos periódicos, recordatorios y notificaciones multicanal.

Construida como monorepo **Nx** con **NestJS** en el backend y **Angular** en el frontend.

---

## Tabla de contenidos

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Modelos de datos](#modelos-de-datos)
- [API REST](#api-rest)
- [Instalación y configuración](#instalación-y-configuración)
- [Desarrollo](#desarrollo)
- [Build y producción](#build-y-producción)
- [Docker](#docker)
- [Tests](#tests)

---

## Características

### Gestión de activos
- Alta, edición y baja de activos con campos de inventario completos: número de serie, categoría, ubicación, fecha de compra, precio, vencimiento de garantía y metadatos libres (JSON).
- Estados: `AVAILABLE` · `ASSIGNED` · `MAINTENANCE` · `RETIRED`
- Filtros OData por cualquier campo (`filter=status eq AVAILABLE and purchasePrice gt 1000`)
- Listados paginados

### Asignaciones
- Asignación de activos a contactos con fechas de inicio, vencimiento y devolución
- Soporte de asignaciones permanentes y temporales
- Estados automáticos: `ACTIVE` · `COMPLETED` · `OVERDUE`

### Contactos
- Directorio de personas con email, teléfono, departamento, cargo y notas
- Histórico de asignaciones por contacto

### Mantenimientos
- Programación de mantenimientos periódicos con frecuencia configurable (día / semana / mes / año)
- Registro de ejecuciones con costo, proveedor y responsable
- Cálculo automático de próxima fecha de servicio

### Recordatorios y reglas
- Recordatorios manuales o generados automáticamente por reglas (`ReminderRule`)
- Vinculados a asignaciones o mantenimientos
- Prioridad: `LOW` · `MEDIUM` · `HIGH`
- Canales: `IN_APP` · `EMAIL` · `SMS` · `PUSH` · `WHATSAPP`
- Estados: `PENDING` · `SENT` · `OVERDUE`

### Sistema de notificaciones
- Cola de entregas basada en **pg-boss** con reintentos automáticos
- Seguimiento por entrega: `QUEUED` → `PROCESSING` → `SENT` / `FAILED` / `DEAD_LETTER`
- Soporte de idempotencia y registro de errores por intento

### Importación y exportación masiva
- **Exportación** de activos y contactos a **Excel** o **PDF** con columnas traducidas
- **Importación masiva** con flujo de dos pasos: validación previa (`/import/validate`) y confirmación (`/import/commit`)
- Soporte de aliases de enum en los archivos importados

### Vista de calendario
- Vista consolidada de asignaciones, mantenimientos y recordatorios del período seleccionado

### Dashboard
- Pantalla de inicio con resumen del estado del sistema

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | NestJS | ^11 |
| ORM | TypeORM | ^0.3 |
| Base de datos | PostgreSQL | >= 14 |
| Cola de tareas | pg-boss | ^12 |
| Logs | pino + pino-pretty | ^10 |
| Documentación API | Swagger / OpenAPI | @nestjs/swagger ^8 |
| Frontend | Angular | ~21.1 |
| UI | Angular Material | ^21.1 |
| Exportación | exceljs + pdfkit | ^4 / ^0.17 |
| Monorepo | Nx | 22 |
| Lenguaje | TypeScript | ~5.9 |

---

## Arquitectura

```
assets-manager/
├── src/
│   ├── apps/
│   │   ├── api/                        # Backend NestJS
│   │   │   └── src/
│   │   │       ├── app/                # AppModule raíz
│   │   │       ├── controllers/        # Controladores REST
│   │   │       │   ├── assets.controller.ts
│   │   │       │   ├── contacts.controller.ts
│   │   │       │   ├── assignments.controller.ts
│   │   │       │   ├── maintenances.controller.ts
│   │   │       │   ├── reminders.controller.ts
│   │   │       │   ├── reminder-rules.controller.ts
│   │   │       │   ├── calendar.controller.ts
│   │   │       │   ├── notification-deliveries.controller.ts
│   │   │       │   └── users.controller.ts
│   │   │       ├── modules/
│   │   │       │   ├── export/         # Exportación Excel / PDF
│   │   │       │   ├── import/         # Importación masiva
│   │   │       │   └── notifications/  # Cola pg-boss
│   │   │       └── decorators/         # Decoradores Swagger CRUD
│   │   └── web/                        # Frontend Angular
│   │       └── src/
│   │           ├── app/                # Rutas y configuración
│   │           ├── features/           # Páginas lazy-loaded
│   │           │   ├── dashboard/
│   │           │   ├── assets/
│   │           │   ├── contacts/
│   │           │   ├── assignments/
│   │           │   ├── maintenances/
│   │           │   ├── reminders/
│   │           │   ├── calendar/
│   │           │   └── imports/        # Importación masiva UI
│   │           ├── core/               # Servicios y modelos globales
│   │           └── shared/             # Componentes, utils y validadores
│   └── libs/
│       ├── backend/
│       │   └── config/                 # Entidades TypeORM, servicios y DTOs
│       ├── frontend/
│       │   └── api-client/             # Cliente HTTP tipado para el frontend
│       └── shared/                     # Interfaces y enums compartidos (frontend + backend)
```

---

## Modelos de datos

```
Asset ──────────────────────────────────────────────────
  id · name · serialNumber · category · location
  status: AVAILABLE | ASSIGNED | MAINTENANCE | RETIRED
  purchaseDate · purchasePrice · warrantyExpiryDate
  metadata (JSON) · description
  → assignments[] · maintenances[]

Contact ─────────────────────────────────────────────────
  id · name · email · phoneNumber
  department · position · notes · metadata (JSON)
  → assignments[]

Assignment ──────────────────────────────────────────────
  id · assetId → Asset · assigneeId → Contact
  startDate · dueDate · returnDate · isPermanent
  status: ACTIVE | COMPLETED | OVERDUE
  assignedBy · notes
  → reminders[]

Maintenance ─────────────────────────────────────────────
  id · assetId → Asset · description
  frequencyAmount · unit: DAY | WEEK | MONTH | YEAR
  lastServiceDate · nextServiceDate
  cost · serviceProvider · notes
  → executions[] · reminders[]

Reminder ────────────────────────────────────────────────
  id · message · scheduledDate
  status: PENDING | SENT | OVERDUE
  type: ASSIGNMENT | MAINTENANCE
  sourceType: MANUAL | RULE
  priority: LOW | MEDIUM | HIGH
  channel: IN_APP | EMAIL | SMS | PUSH | WHATSAPP
  → assignment? · maintenance? · reminderRule?

ReminderRule ────────────────────────────────────────────
  targetEntityType: ASSIGNMENT | MAINTENANCE
  offsetValue · offsetUnit: DAY | WEEK | MONTH
  priority · channel · active · messageTemplate

ReminderDelivery ────────────────────────────────────────
  status: QUEUED | PROCESSING | SENT | FAILED | DEAD_LETTER
  attempts · maxAttempts · jobId · idempotencyKey
  queuedAt · processedAt · sentAt · lastError
```

---

## API REST

La documentación interactiva (Swagger UI) está disponible en:

```
http://localhost:3000/api/docs
```

### Endpoints principales

| Módulo | Base URL | Operaciones |
|--------|----------|-------------|
| Assets | `/api/assets` | CRUD · export · import/validate · import/commit |
| Contacts | `/api/contacts` | CRUD · export · import/validate · import/commit |
| Assignments | `/api/assignments` | CRUD |
| Maintenances | `/api/maintenances` | CRUD · executions |
| Reminders | `/api/reminders` | CRUD |
| Reminder Rules | `/api/reminder-rules` | CRUD |
| Notification Deliveries | `/api/notification-deliveries` | GET · retry |
| Calendar | `/api/calendar` | GET (rango de fechas) |
| Users | `/api/users` | CRUD |

### Paginación y filtros

Todos los endpoints de listado soportan:

```
GET /api/assets?page=1&pageSize=20&filter=status eq AVAILABLE and purchasePrice gt 500
```

### Exportación

```
GET /api/assets/export?format=excel
GET /api/assets/export?format=pdf
```

### Importación masiva

```
# 1. Validar sin insertar
POST /api/assets/import/validate
{ "rows": [{ "name": "Laptop Dell", "status": "Disponible", ... }] }

# 2. Confirmar inserción
POST /api/assets/import/commit
{ "rows": [...] }
```

---

## Instalación y configuración

### Requisitos previos

- Node.js >= 20
- PostgreSQL >= 14
- npm

### Instalación de dependencias

```sh
npm install
```

### Variables de entorno

Copia `.env.example` a `.env`:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=assets_manager

# CORS (separar con comas para múltiples orígenes)
CORS_ORIGIN=http://localhost:4200

# Puerto del API (opcional, por defecto 3000)
PORT=3000
```

---

## Desarrollo

```sh
# Iniciar API (NestJS) — http://localhost:3000
npm run start:api

# Iniciar Web (Angular) — http://localhost:4200
npm run start:web

# Iniciar ambos en paralelo
npm run start:all
```

---

## Build y producción

```sh
# Build del API
npx nx build api

# Build del frontend
npx nx build web

# Build de todo el monorepo
npx nx run-many -t build

# Grafo de dependencias
npx nx graph
```

---

## Docker

```sh
# Producción (todos los servicios)
docker-compose up --build

# Desarrollo con hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

| Servicio | Puerto |
|----------|--------|
| PostgreSQL | 5432 |
| API (NestJS) | 3000 |
| Web (Angular) | 4200 / 80 |

---

## Tests

```sh
# Tests unitarios
npx nx test api
npx nx test web

# Tests E2E
npx nx e2e api-e2e
npx nx e2e web-e2e

# Lint
npx nx run-many -t lint
```
