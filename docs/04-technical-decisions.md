# Decisiones técnicas (ADRs)

> Formato corto: contexto → decisión → consecuencias. Estado: ✅ aceptada · 🔄 revisable.

## ADR-001 — Next.js 16 App Router como framework fullstack ✅

**Contexto:** el usuario ya tiene Vercel configurado; el MVP necesita velocidad de entrega,
SSR para landings con SEO y una sola base de código.
**Decisión:** Next.js App Router con Server Components + Server Actions; Route Handlers
para webhooks/integraciones.
**Consecuencias:** deploy trivial en Vercel; menos infraestructura; la lógica de negocio
se mantiene fuera de `app/` para no acoplarse al framework (ver ADR-002).

## ADR-002 — Backend en Next.js ahora, NestJS-ready 🔄

**Contexto:** a escala (workers de automatizaciones, webhooks de WhatsApp con alto QPS)
un backend dedicado puede ser necesario.
**Decisión:** los services de dominio viven en `src/modules/*/server/` como funciones puras
(sin imports de `next/*`), reciben `TenantContext` explícito y devuelven `Result`.
**Consecuencias:** migrar a NestJS = mover services y exponer controllers; las Server
Actions son una capa delgada reemplazable. Revisar cuando automatizaciones requieran
colas/workers persistentes (probable: Vercel Queues o worker en Railway/Fly en V2).

## ADR-003 — Supabase como plataforma de datos ✅

**Contexto:** el usuario indicó "faltaría crear Supabase". Necesitamos Postgres gestionado,
auth, realtime y storage sin operar infraestructura.
**Decisión:** Supabase para Postgres + Auth + Realtime + Storage. El proyecto se crea en
Fase 2; hasta entonces la app funciona en **modo demo** con datos en memoria.
**Consecuencias:** RLS disponible como segunda capa de aislamiento multi-tenant; un solo
proveedor para 4 necesidades; lock-in moderado mitigado porque el acceso a datos pasa por
Prisma (Postgres estándar) y la auth está encapsulada en `lib/auth`.

## ADR-004 — Prisma como ORM (sobre Drizzle) ✅

**Contexto:** necesitamos migraciones ordenadas, seeds y un schema legible que sirva de
documentación viva para un modelo de ~30 tablas.
**Decisión:** Prisma.
**Consecuencias:** DX maduro, migraciones declarativas, tipado end-to-end. Costo: engine
binario y cold starts ligeramente mayores (aceptable con Prisma 6 + driver adapters).
Si el edge runtime se vuelve crítico, Drizzle es la alternativa — la capa repository
lo aísla.

## ADR-005 — Multi-tenancy: single DB, shared schema, `organization_id` + RLS ✅

**Contexto:** miles de organizaciones pequeñas/medianas; aislamiento estricto requerido.
**Decisión:** una base, schema compartido, `organization_id` en toda tabla de negocio,
enforcement en capa de aplicación (TenantContext obligatorio) **y** RLS en Postgres.
**Consecuencias:** operación simple, costo bajo, onboarding instantáneo de tenants.
Schema-per-tenant o DB-per-tenant quedan como opción enterprise futura (V3), no MVP.

## ADR-006 — Supabase Auth (sobre NextAuth/Clerk) ✅

**Contexto:** ya elegimos Supabase (ADR-003); necesitamos auth multi-tenant + auth
separada para Customer Portal.
**Decisión:** Supabase Auth con `@supabase/ssr`. La identidad (users) vive en Supabase;
la **membresía, rol y permisos** viven en nuestras tablas (`memberships`, `roles`).
**Consecuencias:** un proveedor menos; claims de org en JWT habilitan RLS; el portal de
clientes usa el mismo sistema con rol `client`. Encapsulado en `lib/auth` para poder
sustituirlo.

## ADR-007 — AI Orchestrator propio, multi-proveedor, mock-first ✅

**Contexto:** requisito explícito de no depender de un proveedor de IA; la demo debe
funcionar sin API keys.
**Decisión:** capa propia (`lib/ai`) con interface `AIProvider`, registry de modelos,
routing por tarea configurable por tenant, fallbacks, cost/latency tracking y
`MockProvider` por defecto.
**Consecuencias:** cambiar de modelo = configuración, no código; los costos son visibles
por tenant desde el día uno; el mock garantiza demo estable y tests deterministas.

## ADR-008 — Tailwind v4 + shadcn/ui como sistema de diseño ✅

**Contexto:** look premium tipo Linear/Stripe/Attio, con modo oscuro y velocidad de
iteración.
**Decisión:** Tailwind v4 (tokens CSS-first) + shadcn/ui (componentes copiados al repo,
personalizables) + Lucide + Framer Motion puntual.
**Consecuencias:** control total del estilo (no dependemos de releases de una lib de UI),
theming claro/oscuro por tokens semánticos, accesibilidad base de Radix.

## ADR-009 — Postgres FTS para búsqueda en MVP ✅

**Decisión:** `tsvector` + GIN en contacts/properties detrás de interface
`SearchProvider`. Migración a Meilisearch/Typesense en V2 si el volumen lo pide.

## ADR-010 — Mock adapters para toda integración sin credenciales ✅

**Decisión:** ningún canal externo se conecta sin credenciales reales en env. Cada
integración define su adapter (interface estable) con implementación mock que produce
datos demo realistas. `.env.example` documenta cada variable.
**Consecuencias:** la demo es completa sin terceros; conectar el canal real = implementar
el adapter, sin tocar producto.

## ADR-011 — pnpm como package manager ✅

**Decisión:** pnpm (instalación rápida, disco eficiente, estricto con dependencias
fantasma). Lockfile committeado.

## ADR-012 — Idiomas: código en inglés, UI es-MX primero, i18n preparado ✅

**Decisión:** identificadores/comentarios/docs técnicos del código en inglés; textos de
UI centralizados desde F1 (diccionario simple) para no hardcodear español en componentes;
es-MX como locale por defecto, en-US en V2. Formatos de moneda/fecha por `Intl` según
locale y currency del tenant — nunca hardcodeados.
