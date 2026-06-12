# Realtor Pro CRM

**El sistema operativo inmobiliario.** SaaS multi-tenant para agentes, equipos, brokers,
inmobiliarias y desarrolladoras: CRM, pipeline, inbox omnicanal, gestión de propiedades,
landing pages, smart matching, planificador de visitas, automatizaciones, deal
intelligence y AI Copilot — con enfoque 100% real estate y WhatsApp como canal de
primera clase.

## Estado del proyecto

🚧 **Fase 0 — Product Blueprint** (en desarrollo por fases).

| Documento | Contenido |
|-----------|-----------|
| [`docs/00-product-blueprint.md`](docs/00-product-blueprint.md) | Visión, usuarios, mapa de módulos, navegación |
| [`docs/01-architecture.md`](docs/01-architecture.md) | Stack, multi-tenancy, RBAC, estructura de carpetas |
| [`docs/02-data-model.md`](docs/02-data-model.md) | Modelo de datos inicial (~30 tablas) |
| [`docs/03-roadmap.md`](docs/03-roadmap.md) | Fases 0–20, MVP / V2 / V3 |
| [`docs/04-technical-decisions.md`](docs/04-technical-decisions.md) | ADRs |
| [`docs/05-risks-and-assumptions.md`](docs/05-risks-and-assumptions.md) | Riesgos, supuestos, preguntas abiertas |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript estricto · Tailwind CSS v4 · shadcn/ui ·
Prisma + PostgreSQL (Supabase) · Supabase Auth/Realtime/Storage · AI Orchestrator
multi-proveedor (mock-first) · Vercel.

## Desarrollo

Requisitos: Node 22+, pnpm 10+.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # build de producción
pnpm lint       # ESLint
pnpm typecheck  # TypeScript
```

La app corre en **modo demo sin variables de entorno** (todas las integraciones caen a
adapters mock). Para conectar servicios reales, copia `.env.example` a `.env.local` y
llena las credenciales — nunca se hardcodean.

## Principios

1. Multi-tenant estricto: toda tabla de negocio lleva `organization_id`; cero fuga entre organizaciones.
2. Nada de lógica país-específica hardcodeada: multi-moneda, multi-idioma, multi-zona-horaria.
3. Integraciones por adapters: sin credenciales → mock funcional.
4. UX premium (Linear / Stripe / Notion / Attio): estados loading/empty/error siempre diseñados.
5. Trabajo por fases: no se avanza si la fase actual no compila.
