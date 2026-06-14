# Roadmap — MVP / V2 / V3

> Fase 0 · Versión 1.0 — regla: **no avanzar de fase si la actual no compila.**

## MVP (Fases 0–16) — demostrar valor rápido

| Fase | Entregable | Estado |
|------|-----------|--------|
| **F0** | Blueprint + proyecto base Next.js + decisiones técnicas | ✅ |
| **F1** | Foundation SaaS: AppShell, sidebar/bottom-nav/topbar, theme claro/oscuro, shadcn/ui, páginas shell de los 10 módulos, tenant context + auth preparada | ✅ |
| **F2** | Database core: Prisma + Supabase, migraciones, RLS, seeds demo "Morishita Realty Group", Zod schemas | ✅ |
| **F3** | Dashboard inteligente: Today Command Center, Hot Leads, Pipeline Overview, Conversations, Upcoming Visits, AI Insights | ✅ |
| **F4** | CRM contactos: tabla/kanban/perfil, búsqueda, filtros, tags, notas, timeline, score | ✅ |
| **F5** | Pipeline: kanban drag & drop, forecast, comisiones, probabilidad | ✅ |
| **F6** | Propiedades: CRUD, galería, grid/tabla/detalle, demo (Ensenada, CDMX, Valle de Guadalupe, Tijuana, Monterrey) | ✅ |
| **F7** | Landing Page Engine: `/p/[slug]`, `/company/[slug]`, SEO/OG, form → contacto + oportunidad + UTM | ✅ |
| **F8** | Inbox MVP: conversaciones demo, chat, filtros, asignación, adapters mock (WhatsApp/Email/IG/FB/WebChat) | ✅ |
| **F9** | AI Orchestrator MVP: providers/router/prompts/logs, MockProvider, UI de configuración en settings | ✅ |
| **F10** | Smart Matching MVP: score + razones + mensaje sugerido; en perfil de contacto y en propiedad | ✅ |
| **F11** | Visit Planner MVP: agenda, estados, notas post-visita, ruta mock | ✅ |
| **F12** | Automation Builder MVP: trigger/conditions/actions, plantillas, logs | ✅ |
| **F13** | Customer Portal MVP: `/portal`, comprador y vendedor, mobile-first | ✅ |
| **F14** | Deal Intelligence MVP: lead/deal score, riesgo, next best action en perfil/pipeline/dashboard | ✅ |
| **F15** | AI Copilot MVP: chat, tool-calling interno, confirmación de acciones sensibles | ✅ |
| **F16** | Analytics MVP: overview, sales, agents, properties, sources, automations | ✅ |

## Hardening del MVP (Fases 17–20)

| Fase | Entregable |
|------|-----------|
| **F17** | Mobile experience tipo app: bottom nav, quick actions, click-to-WhatsApp, rutas ✅ |
| **F18** | Security & audit: RLS verificado, RBAC real en todas las rutas, audit logs, rate limiting, sanitización ✅ |
| **F19** | Integration-ready: adapters reales WhatsApp Business API, Meta Graph, Gmail, Google Calendar/Maps, webhooks (solo con credenciales por env) ✅ |
| **F20** | Polish & demo: onboarding, tour, microinteracciones, performance, README, demo story completa ✅ |

## V2 (en progreso)

| Fase | Entregable | Estado |
|------|-----------|--------|
| **F21** | Autenticación real (Supabase Auth): sign-in/sign-out, sesión httpOnly, refresh en middleware, tenant por usuario; opt-in con `AUTH_ENABLED` | ✅ |

Backlog V2:

- Workspaces y branches activos en UI; roles personalizados por organización
- Documents module completo (Drive/Dropbox/OneDrive)
- Campaigns avanzadas: Facebook Lead Ads / Google Ads ingest real
- Búsqueda con Meilisearch/Typesense
- Billing con Stripe: planes, límites, trials
- Notificaciones push/email del portal de clientes
- Importadores de portales inmobiliarios (API/CSV/XML)
- i18n completo (en-US además de es-MX)

## V3

- Firma electrónica (DocuSign/Adobe Sign), gestión documental legal
- SMS, llamadas (click-to-call, logging)
- Marketplace de integraciones, API pública + Zapier/Make
- Modelos de IA locales y fine-tuning por tenant
- Mobile app nativa (wrapper o React Native) si la demanda lo justifica
- Migración del backend a NestJS si la escala lo exige (ver ADR-002)

## Definición de "fase terminada"

1. `pnpm build` y `pnpm lint` pasan sin errores.
2. Estados loading/empty/error cubiertos en la UI nueva.
3. Datos demo actualizados si aplica.
4. Resumen de cambios entregado (qué, archivos, decisiones, cómo probar, riesgos, siguiente fase).
