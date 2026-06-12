# Riesgos y supuestos

> Fase 0 · Versión 1.0

## Supuestos

1. **Supabase aún no existe.** El proyecto se creará antes/durante la Fase 2. Hasta
   entonces la app corre en modo demo (datos en memoria/fixtures) y compila/deploya en
   Vercel sin variables de entorno.
2. **Vercel ya está conectado al repo** (indicado por el usuario). El branch de trabajo
   genera preview deploys automáticamente.
3. **Sin credenciales de terceros todavía** (WhatsApp Business API, Meta, Google, OpenAI,
   Anthropic…). Todo arranca con adapters/providers mock.
4. **Mercado inicial México** (es-MX, MXN/USD) pero ninguna lógica país-específica
   hardcodeada.
5. Un solo desarrollador/equipo pequeño opera el repo: priorizamos simplicidad operativa
   (monorepo simple, una app) sobre microservicios.
6. El volumen MVP es de demo/early-adopters (decenas de tenants), no producción masiva:
   colas y workers dedicados se difieren a V2.

## Riesgos principales y mitigación

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|-----------|
| 1 | **Fuga de datos entre tenants** | Crítico | Triple capa: TenantContext obligatorio en services + RLS en Postgres + audit logs. Tests de aislamiento en F18. |
| 2 | **WhatsApp Business API**: aprobación de Meta lenta, plantillas pre-aprobadas, costos por conversación | Alto (canal #1 en LatAm) | Arquitectura adapter + inbox funcional con mock desde F8; alternativa de arranque vía BSP (Twilio/360dialog) documentada en F19. |
| 3 | **Alcance enorme (20 módulos)** → riesgo de no terminar nada bien | Alto | Roadmap por fases con gate "compila o no avanzas"; MVP definido en 12 capacidades; cada fase entrega algo usable. |
| 4 | **Costos de IA** descontrolados por tenant | Medio | Cost tracking por request, `max_cost_usd` por tarea, mock por defecto, human approval para acciones masivas. |
| 5 | **Next.js como backend** se queda corto para automatizaciones con scheduling/colas | Medio | Services desacoplados (ADR-002); en V2 worker dedicado o colas gestionadas. F12 ejecuta automatizaciones de forma síncrona/cron simple. |
| 6 | **Prisma en serverless**: conexiones a Postgres agotadas | Medio | Supabase pooler (pgbouncer/Supavisor) desde F2; `DATABASE_URL` pooled + `DIRECT_URL` para migraciones. |
| 7 | **SEO/perf de landings** públicas con tráfico real | Medio | Landings como Server Components estáticos/ISR, imágenes optimizadas, metadata OG completa (F7/F20). |
| 8 | **Datos sensibles** (documentos de clientes, contratos) | Alto | Storage por tenant con políticas; visibilidad explícita por documento; export controlado por permiso `data.export` + audit log. |
| 9 | **Scraping de portales inmobiliarios** puede violar ToS | Legal | Solo integraciones por API oficial o importación CSV/XML; scraping únicamente si es legal y autorizado (decisión por portal en F19/V2). |
| 10 | **Dependencia de Supabase** | Bajo/Medio | Postgres estándar vía Prisma; auth y storage encapsulados en `lib/*` con interfaces propias. |
| 11 | **Drag & drop + realtime** complejos de testear | Bajo | E2E básicos de flujos críticos (crear contacto, mover etapa, responder inbox) con Playwright desde F5/F8. |

## Preguntas abiertas (no bloquean MVP)

- ¿Billing por asiento, por tenant o híbrido? (decidir antes de V2/Stripe)
- ¿BSP preferido para WhatsApp (Meta directo, Twilio, 360dialog)? (decidir en F19)
- ¿Dominio custom por tenant para landings (`inmobiliaria.com`) o subpath? (V2 — el
  esquema de `landing_pages` ya soporta ambos)
- ¿Idioma del portal de clientes sigue el locale del tenant o del cliente? (V2 i18n)
