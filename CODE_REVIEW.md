# Code Review - Nest + Angular Monorepo Template

Fecha: 2026-02-10

## Diagnóstico general

El template está bien encaminado para proyectos híbridos con y sin autenticación:

- Estructura por features en backend (`libs/backend/config`) y separación razonable de concerns.
- Librería `common` útil para estandarizar validación, logging y manejo de excepciones.
- Monorepo con Nx, apps y e2e separados, listo para escalar por dominios.

## Hallazgos principales

### 1) Base sólida sin acoplar autenticación

No incluir auth por defecto es una decisión correcta para un template reusable. Te permite:

- usar proyectos públicos o internos sin seguridad,
- plugar estrategias diferentes (JWT, sesión, API keys, OIDC, mTLS) por proyecto,
- evitar deuda por “auth demo” que luego no aplica.

Recomendación: mantener auth como módulo opcional (`libs/backend/auth-*`) y no en el core.

### 2) Endurecimiento mínimo recomendado (agnóstico de auth)

Incluso sin autenticación, conviene tener baseline operativo:

- CORS configurable por ambiente,
- shutdown hooks para terminar procesos de forma limpia,
- `.env.example` con variables base comunes,
- endpoint de salud/versionado (si quieres observabilidad mínima).

## Cambios aplicados en esta revisión

1. **CORS configurable + shutdown hooks** en bootstrap de Nest.
2. **`CORS_ORIGIN`** documentado en `.env.example`.

## Backlog genérico sugerido (sin imponer auth)

- **Rate limiting opcional por entorno** para APIs públicas.
- **Headers de seguridad (`helmet`)** activable por flag.
- **Health checks (`/health`)** con DB ping opcional.
- **OpenAPI/Swagger** solo en `development` y protegido en `staging/prod`.
- **Métricas** (Prometheus/OpenTelemetry) desacopladas del dominio.
- **Auditoría de logs**: masking adicional y request-id/correlation-id.

## Opinión final

Tu decisión de no incluir auth por defecto es técnicamente acertada para un starter multiproyecto. La clave es complementar con una **línea base operativa y de seguridad mínima**, parametrizable por ambiente, sin acoplar una estrategia de identidad específica.
