# Notificaciones con Cron + Cola (NestJS Schedule + pg-boss)

## Objetivo
Este documento describe la arquitectura implementada para notificaciones en `assets-manager` con:

1. Scheduler (`@nestjs/schedule`) para detectar recordatorios vencidos.
2. Cola (`pg-boss`) sobre PostgreSQL actual.
3. Worker para procesamiento desacoplado.
4. Factory de canales para soporte multi-canal extensible.

La implementación actual habilita solo `IN_APP`, pero deja listos los adapters de `EMAIL`, `SMS`, `PUSH`, `WHATSAPP`.

## Arquitectura

### Flujo principal
1. `ReminderDispatchScheduler` corre cada 5 minutos.
2. Busca reminders vencidos (`PENDING` y `OVERDUE`) con `scheduledDate <= now`.
3. Crea/actualiza `ReminderDelivery` en `QUEUED` (idempotente).
4. Encola job en `notifications.dispatch`.
5. Worker consume job, resuelve canal via `NotificationChannelFactory`.
6. Si éxito:
   - `ReminderDelivery -> SENT`
   - `Reminder -> SENT`
7. Si falla:
   - incrementa intentos
   - `FAILED` (si aún tiene reintentos)
   - `DEAD_LETTER` + cola `notifications.dead-letter` (si agotó intentos)

### Componentes clave
- `src/apps/api/src/modules/notifications/notifications.module.ts`
- `src/apps/api/src/modules/notifications/reminder-dispatch.scheduler.ts`
- `src/apps/api/src/modules/notifications/reminder-dispatch.worker.ts`
- `src/apps/api/src/modules/notifications/reminder-dispatch.service.ts`
- `src/apps/api/src/modules/notifications/queue/pg-boss-queue.adapter.ts`
- `src/apps/api/src/modules/notifications/channels/notification-channel.factory.ts`
- `src/libs/backend/config/src/lib/features/reminders/reminder-delivery.entity.ts`

## Contratos internos (ports)

### `NotificationQueuePort`
- `enqueueDispatch(payload, opts)`
- `enqueueDeadLetter(payload, reason)`
- `registerDispatchWorker(handler)`
- `close()`

### `NotificationChannelPort`
- `channel: Channel`
- `send(input)`

### `NotificationChannelFactoryPort`
- `get(channel)`

Estos contratos permiten reemplazar tecnología sin tocar lógica de dominio.

## Variables de entorno
- `NOTIFICATION_QUEUE_DRIVER=pgboss`
- `NOTIFICATION_CRON_ENABLED=true`
- `NOTIFICATION_CRON_EXPRESSION=*/5 * * * *`
- `NOTIFICATION_WORKER_ENABLED=true`
- `NOTIFICATION_MAX_ATTEMPTS=5`
- `NOTIFICATION_RETRY_BACKOFF=true`
- `NOTIFICATION_DLQ_NAME=notifications.dead-letter`
- `NOTIFICATION_ACTIVE_CHANNELS=IN_APP`
- `APP_TIMEZONE=UTC`

## API administrativa
- `GET /api/notification-deliveries`
  - filtros: `status`, `channel`, `reminderId`
  - paginación: `page`, `pageSize`
- `POST /api/notification-deliveries/:id/requeue`
  - solo estados `FAILED` o `DEAD_LETTER`

## Cómo agregar un nuevo canal
Ejemplo: `TelegramNotificationService`.

1. Crear servicio en:
   - `src/apps/api/src/modules/notifications/channels/telegram-notification.service.ts`
2. Implementar `NotificationChannelPort`.
3. Agregar enum en `Channel` (backend + shared).
4. Registrar provider en `NotificationsModule`.
5. Actualizar `NotificationChannelFactory` para mapear el nuevo canal.
6. Si es activo en ambiente, incluir en `NOTIFICATION_ACTIVE_CHANNELS`.

## Cómo agregar un nuevo QueueAdapter (ej. BullMQ)

1. Crear adapter que implemente `NotificationQueuePort`.
2. Registrar provider en `NotificationsModule`:
   - `NOTIFICATION_QUEUE_PORT -> useExisting: BullMqQueueAdapter`
3. Mantener naming de colas:
   - dispatch: `notifications.dispatch`
   - dead-letter: `notifications.dead-letter`
4. Respetar política de retries y DLQ para no romper semántica.

No se debe modificar `ReminderDispatchService`; solo cambiar binding del token.

## Cómo cambiar scheduler (cron)
Si se migra a scheduler externo (por ejemplo Cloud Scheduler):
1. Desactivar cron local: `NOTIFICATION_CRON_ENABLED=false`.
2. Exponer/usar trigger seguro que llame `enqueueDueReminders()`.
3. Mantener worker y cola sin cambios.

## Compatibilidad y reglas
1. `ReminderStatus` se mantiene (`PENDING/SENT/OVERDUE`).
2. Estado técnico de entrega vive en `ReminderDelivery`.
3. Idempotencia por `idempotencyKey = ${reminderId}:${channel}`.
4. Si canal solicitado no está activo, fallback a `IN_APP`.

## Runbook operativo

### Ver retrasos
1. Consultar `GET /api/notification-deliveries?status=FAILED`.
2. Consultar `GET /api/notification-deliveries?status=DEAD_LETTER`.

### Reprocesar
1. Ejecutar `POST /api/notification-deliveries/:id/requeue`.
2. Verificar que vuelva a `QUEUED` y luego a `SENT` o `FAILED`.

### Troubleshooting rápido
1. Verificar conectividad DB (pg-boss usa Postgres).
2. Confirmar flags:
   - cron habilitado
   - worker habilitado
   - canal activo
3. Revisar `lastError` en `ReminderDelivery`.

## Estrategia de migración futura a recurso dedicado
Si se incorpora Redis/Rabbit/Kafka:
1. Introducir nuevo adapter cumpliendo `NotificationQueuePort`.
2. Activar por configuración y despliegue progresivo (canary).
3. Mantener `ReminderDelivery` como fuente de verdad operativa.
4. Retirar `pg-boss` cuando no haya jobs pendientes.
