# Arquitectura general

> Fase 0 · Versión 1.0

## 1. Stack definitivo

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | **Next.js 16 (App Router)** + React 19 | Server Components por defecto; Server Actions para mutaciones |
| Lenguaje | **TypeScript estricto** | `strict` + `noUncheckedIndexedAccess` |
| Estilos | **Tailwind CSS v4** + **shadcn/ui** | Tokens semánticos, modo claro/oscuro |
| Animación | Framer Motion | Solo microinteracciones clave |
| Iconos | Lucide | |
| Estado servidor | TanStack Query | Solo en islas client que lo necesiten |
| Estado local | Zustand | UI state (sidebar, command bar, copilot panel) |
| Base de datos | **PostgreSQL (Supabase)** | Single database, shared schema, RLS |
| ORM | **Prisma** | Migraciones ordenadas + seeds demo |
| Auth | **Supabase Auth** (`@supabase/ssr`) | Identidad; roles/permisos en tablas propias |
| Realtime | Supabase Realtime | Inbox y notificaciones |
| Storage | Supabase Storage (S3-compatible) | Buckets por dominio, paths por tenant |
| Validación | Zod | Única fuente de validación en límites (forms, APIs, env) |
| Búsqueda | Postgres FTS | Interface `SearchProvider` para migrar a Meilisearch/Typesense |
| Mapas | Adapter `MapsProvider` (mock → Google Maps) | Rutas inteligentes en F11/F19 |
| IA | **AI Orchestrator propio** | Multi-proveedor, mock por defecto |
| Deploy | Vercel | Ya configurado por el usuario |
| Calidad | ESLint 9 + Prettier + Vitest + Playwright (E2E básico) | |

**Backend en Next.js (Server Actions + Route Handlers) para el MVP.** La lógica de negocio
vive en `src/modules/*/server/` (services puros, sin imports de Next), de modo que una
migración futura a NestJS sea mover services, no reescribirlos. Ver ADR-002.

## 2. Multi-tenancy

Modelo: **single database, shared schema, aislamiento por `organization_id`**.

Jerarquía:

```
Organization (tenant raíz, plan de suscripción)
└── Workspace? (V2 — para MVP: 1 org = 1 workspace implícito)
    └── Branch / Oficina (opcional)
        └── Team
            └── Membership (User × Org × Role)
```

Reglas de aislamiento (defensa en profundidad, 3 capas):

1. **Capa de aplicación:** todo acceso a datos pasa por un "tenant-scoped client":
   los services reciben un `TenantContext { organizationId, userId, role, permissions }`
   resuelto en el servidor desde la sesión — **nunca** desde input del cliente.
   No existe query sin `organizationId`.
2. **Capa de base de datos:** Supabase **RLS activado en todas las tablas tenant** como
   red de seguridad (políticas por `organization_id` vía JWT claims).
3. **Capa de auditoría:** `audit_logs` registra acciones sensibles (export, delete,
   cambios de permisos, configuración de IA).

## 3. RBAC

Roles iniciales: `super_admin` (plataforma), `owner`, `admin`, `broker`, `team_leader`,
`agent`, `assistant`, `marketing`, `viewer`, `client` (portal).

- Cada rol mapea a un set de **permisos granulares** (`contacts.view`, `contacts.create`,
  `contacts.edit`, `contacts.delete`, `conversations.view`, `conversations.reply`,
  `properties.view`, `properties.publish`, `analytics.view`, `users.manage`,
  `automations.manage`, `ai.configure`, `data.export`, …).
- Los permisos se evalúan en el **servidor** (guard `requirePermission(ctx, permission)`)
  y se reflejan en la UI (ocultar acciones no permitidas — UX, no seguridad).
- Roles personalizados por organización: V2 (el esquema lo soporta desde F2).

## 4. Estructura de carpetas

```
src/
├── app/                          # Rutas (App Router) — capa delgada
│   ├── (auth)/                   # /login /signup /onboarding
│   ├── (app)/                    # App autenticada con AppShell
│   │   ├── dashboard/ contacts/ pipeline/ inbox/ properties/
│   │   ├── visits/ automations/ analytics/ copilot/ settings/
│   ├── (public)/                 # /p/[slug]  /company/[slug]
│   ├── (portal)/                 # /portal /portal/login
│   └── api/                      # Route handlers (webhooks, integraciones)
├── modules/                      # Dominios de negocio (núcleo del producto)
│   └── <domain>/                 # contacts, pipeline, properties, inbox, visits,
│       │                         # matching, automations, intelligence, copilot,
│       │                         # landing, portal, analytics, organizations
│       ├── components/           # UI del dominio
│       ├── server/               # Services, queries, actions (tenant-scoped)
│       ├── schemas.ts            # Zod schemas del dominio
│       └── types.ts
├── components/
│   ├── ui/                       # shadcn/ui (generados)
│   └── shared/                   # AppShell, Sidebar, MobileNav, Topbar, StatCard,
│                                 # EmptyState, DataTable, PageHeader, CommandBar,
│                                 # TenantSwitcher, UserMenu
├── lib/                          # Infraestructura transversal
│   ├── db/                       # Prisma client + tenant-scoped helpers
│   ├── auth/                     # Sesión, TenantContext, guards RBAC
│   ├── ai/                       # AI Orchestrator (providers, router, prompts, logs)
│   ├── integrations/             # Adapters: whatsapp, email, maps, calendar…
│   ├── search/                   # SearchProvider (FTS → Meilisearch)
│   └── utils/                    # cn(), formatters (moneda, fecha por locale)
├── config/                       # Navegación, permisos, planes, constantes
└── styles/                       # globals.css (tokens de tema)
```

**Convención clave:** `app/` solo orquesta (resolver tenant, llamar service, render).
La lógica vive en `modules/*/server`. Los services no importan nada de `next/*`.

## 5. Flujo de una request (mutación)

```
UI (form) → Server Action
  → resolveTenantContext()        # sesión → org, rol, permisos
  → requirePermission(ctx, perm)  # RBAC
  → schema.parse(input)           # Zod
  → service(ctx, data)            # lógica de dominio, queries tenant-scoped
  → auditLog(ctx, action)         # si la acción es sensible
  → revalidatePath / response
```

## 6. AI Orchestrator

```
lib/ai/
├── providers/      # AIProvider interface + OpenAI/Anthropic/Gemini/Grok/DeepSeek/Mock
├── registry.ts     # Model registry (modelos disponibles, costos, capacidades)
├── router.ts       # task → provider/model config (por tenant) + fallbacks
├── tasks/          # Definición de cada AITask (schema entrada/salida Zod)
├── prompts/        # Prompt templates versionados
├── logging.ts      # AIUsageLog: tokens, costo, latencia, calidad
└── evaluations/    # Evaluaciones básicas de calidad
```

- Configuración por tenant y por tarea (tabla `ai_task_configs`).
- `MockProvider` por defecto: la demo funciona sin API keys.
- Acciones de IA marcadas como sensibles requieren aprobación humana (human-in-the-loop).

## 7. Integraciones (adapter pattern)

Cada canal/servicio externo implementa una interface estable; el resto del sistema
solo conoce la interface:

```
ChannelAdapter   → WhatsAppAdapter | EmailAdapter | InstagramAdapter |
                   FacebookAdapter | WebChatAdapter   (F8: implementación mock)
MapsProvider     → MockMaps | GoogleMaps             (F11/F19)
CalendarProvider → MockCalendar | GoogleCalendar     (F19)
SearchProvider   → PostgresFTS | Meilisearch         (V2)
```

Credenciales solo por variables de entorno (`.env.example` documenta todas).
Sin credenciales → adapter mock. Nunca se inventan credenciales.

## 8. Convenciones de código

- TypeScript estricto; prohibido `any` (usar `unknown` + narrowing).
- Nombres en inglés en código; UI con i18n preparado (es-MX primero).
- Archivos: `kebab-case.tsx`; componentes `PascalCase`; hooks `use-*`.
- Componentes pequeños y por dominio; nada de "god components".
- Server Components por defecto; `"use client"` solo en hojas interactivas.
- Errores: `Result`-style en services (`{ ok, data | error }`), error boundaries en UI.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`…).
- Cada tabla tenant lleva `organization_id` + índice compuesto.
