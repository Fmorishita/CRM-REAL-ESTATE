# Realtor Pro CRM

**El sistema operativo inmobiliario.** SaaS multi-tenant para agentes, equipos,
brokers, inmobiliarias y desarrolladoras: CRM, pipeline, inbox omnicanal,
propiedades, landing pages, smart matching, planificador de visitas,
automatizaciones, deal intelligence y AI Copilot — con enfoque 100% real estate
y WhatsApp como canal de primera clase.

> **Demo-first:** la app arranca sin ninguna variable de entorno usando datos
> demo en memoria ("Morishita Realty Group"). Cada integración cae a un adaptador
> mock cuando faltan sus credenciales, así que nada se rompe sin configuración.

## Estado

MVP completo (Fases 0–20). Ver [`docs/03-roadmap.md`](docs/03-roadmap.md) para el
detalle por fase y el backlog de V2/V3.

## Funcionalidades

- **Dashboard inteligente** — command center diario, hot leads, pipeline overview,
  conversaciones, próximas visitas, AI insights y primeros pasos.
- **Contactos** — tabla/kanban/perfil, búsqueda, filtros, tags, notas, timeline y score.
- **Pipeline** — kanban drag & drop, forecast, comisiones y probabilidad.
- **Propiedades** — CRUD, galería, grid/tabla/detalle y matching de compradores.
- **Inbox omnicanal** — WhatsApp, email, Instagram, Facebook y WebChat vía adaptadores.
- **Landing Page Engine** — `/p/[slug]` y `/company/[slug]` con SEO/OG y captura de leads.
- **AI Orchestrator** — multi-proveedor (mock por defecto, Anthropic real), router por tarea, costos y logs.
- **Smart Matching** — score de compatibilidad comprador↔propiedad con razones y mensaje sugerido.
- **Visit Planner** — agenda, estados, feedback y ruta optimizada (mock o Google Maps).
- **Automation Builder** — triggers, condiciones, acciones, plantillas y logs.
- **Customer Portal** — `/portal` para comprador y vendedor, mobile-first.
- **Deal Intelligence** — lead/deal score, riesgo y next best action.
- **AI Copilot** — chat con tool-calling interno y confirmación de acciones sensibles.
- **Analytics** — overview, ventas, agentes, propiedades, fuentes y automatizaciones.
- **Seguridad** — RLS multi-tenant, RBAC (10 roles · 21 permisos), audit logs, rate limiting.
- **Integraciones** — WhatsApp Business, Meta, Gmail, Google Calendar/Maps y webhooks firmados.

## Stack

Next.js 16 (App Router · Server Components · Server Actions) · React 19 ·
TypeScript estricto · Tailwind CSS v4 · shadcn/ui · Prisma + PostgreSQL
(Supabase) · AI Orchestrator multi-proveedor (mock-first) · Vercel.

## Principios

1. **Multi-tenant estricto** — toda tabla de negocio lleva `organization_id`; cero fuga entre organizaciones.
2. **Sin lógica país-específica hardcodeada** — multi-moneda, multi-idioma, multi-zona-horaria.
3. **Integraciones por adapters** — sin credenciales → mock funcional; nunca se inventan credenciales.
4. **UX premium** (Linear / Stripe / Notion / Attio) — estados loading/empty/error siempre diseñados.
5. **Trabajo por fases** — no se avanza si la fase actual no compila.

## Arquitectura

- **Multi-tenant** — el contexto del tenant se resuelve en el servidor (nunca desde
  el cliente) y Row Level Security protege la base como defensa en profundidad.
- **Módulos** — `src/modules/<dominio>/{server,components,types,demo}` con un patrón
  consistente: queries y server actions (Zod + RBAC + audit) por dominio.
- **Adaptadores** — integraciones externas detrás de interfaces estables con mock;
  el adaptador real se activa solo con credenciales (`src/lib/integrations/`).
- **Demo mode** — `isDemoMode()` (sin `DATABASE_URL` o con `DEMO_MODE=true`) sirve
  datos sembrados en memoria, así que la app corre end-to-end sin base de datos.

Detalle en [`docs/01-architecture.md`](docs/01-architecture.md).

## Desarrollo

Requisitos: **Node 22+**, **pnpm 10+**.

```bash
pnpm install            # instala dependencias y genera el cliente de Prisma
cp .env.example .env    # opcional: la app corre en demo mode sin esto
pnpm dev                # http://localhost:3000
```

Atajo: `./scripts/setup.sh` hace el install + copia de `.env` por ti.

Scripts útiles:

| Script | Acción |
|--------|--------|
| `pnpm dev` | Servidor de desarrollo (Turbopack) |
| `pnpm build` | Build de producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript sin emitir |
| `pnpm db:migrate` | Aplica migraciones (`prisma migrate deploy`) |
| `pnpm db:seed` | Siembra datos demo |
| `pnpm db:studio` | Prisma Studio |

## Base de datos e integraciones

- Para conectar Supabase real (esquema, RLS, seeds) sigue
  [`docs/06-database-setup.md`](docs/06-database-setup.md).
- Para activar WhatsApp, Meta, Gmail, Calendar, Maps y webhooks, configura las
  variables en `.env` siguiendo [`docs/08-integrations.md`](docs/08-integrations.md).
  Sin credenciales, todo funciona en modo demo.

## Despliegue

Optimizado para **Vercel** (preset Next.js forzado en `vercel.json`). Define las
variables de entorno en el proyecto y conecta el repositorio; cada push genera un
preview deployment.

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [`docs/00-product-blueprint.md`](docs/00-product-blueprint.md) | Visión, usuarios, mapa de módulos |
| [`docs/01-architecture.md`](docs/01-architecture.md) | Stack, multi-tenancy, RBAC, carpetas |
| [`docs/02-data-model.md`](docs/02-data-model.md) | Modelo de datos |
| [`docs/03-roadmap.md`](docs/03-roadmap.md) | Fases 0–20, MVP / V2 / V3 |
| [`docs/04-technical-decisions.md`](docs/04-technical-decisions.md) | ADRs |
| [`docs/05-risks-and-assumptions.md`](docs/05-risks-and-assumptions.md) | Riesgos y supuestos |
| [`docs/06-database-setup.md`](docs/06-database-setup.md) | Setup de Supabase |
| [`docs/07-security.md`](docs/07-security.md) | Seguridad, auditoría y permisos |
| [`docs/08-integrations.md`](docs/08-integrations.md) | Integraciones y adaptadores |
| [`docs/09-demo-story.md`](docs/09-demo-story.md) | Guion de demo "Morishita Realty Group" |
| [`docs/10-launch-checklist.md`](docs/10-launch-checklist.md) | Checklist de lanzamiento del MVP |

## Licencia

Propietario. Todos los derechos reservados.
