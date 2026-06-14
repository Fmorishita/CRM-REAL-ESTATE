# REALTOR PRO CRM — Product Blueprint

> Fase 0 · Versión 1.0 · Última actualización: 2026-06-12

## 1. Visión

REALTOR PRO CRM es el **sistema operativo inmobiliario**: el centro operativo diario de
agentes, equipos, brokers, inmobiliarias y desarrolladoras.

No es un CRM que guarda información. Es un sistema que **prioriza trabajo, automatiza
seguimiento y aumenta conversiones**. Cuando un agente entra por la mañana, el dashboard
le dice qué hacer hoy: a quién contactar, qué responder primero, qué leads están calientes,
qué visitas tiene, qué propiedades recomendar y qué oportunidades están en riesgo.

**Posicionamiento:** competir dentro del nicho inmobiliario contra GoHighLevel, HubSpot,
Salesforce, Follow Up Boss, KVCore, Lofty y Pipedrive — con enfoque 100% real estate y
WhatsApp como canal de primera clase (clave en Latinoamérica).

## 2. Mercado objetivo

- **Inicial:** México.
- **Arquitectura:** global desde el día uno — multi-moneda, multi-idioma, multi-país,
  multi-zona-horaria, campos personalizables por organización.
- **Regla:** ninguna lógica exclusiva de México hardcodeada. Todo configurable por tenant.

## 3. Tipos de usuario

| # | Usuario | Acceso |
|---|---------|--------|
| 1 | Agente independiente | App completa, organización de 1 usuario |
| 2 | Equipo pequeño | App completa + team management |
| 3 | Broker | App completa + supervisión |
| 4 | Inmobiliaria completa | App completa + branches + analytics ejecutivo |
| 5 | Desarrolladora | App completa + desarrollos/preventas |
| 6 | Administrador de empresa | Settings, usuarios, billing |
| 7 | Supervisor comercial | Pipeline, analytics, reasignación |
| 8 | Coordinador operativo | Visitas, tareas, documentos |
| 9 | Cliente comprador | Customer Portal |
| 10 | Cliente vendedor | Customer Portal |
| 11 | Cliente inversionista | Customer Portal |

## 4. Mapa de módulos

| # | Módulo | Fase MVP | Descripción |
|---|--------|----------|-------------|
| 1 | Dashboard Inteligente | F3 | Today Command Center, hot leads, pipeline, visitas, AI insights |
| 2 | CRM de contactos | F4 | Compradores, vendedores, inversionistas; score, timeline, segmentos |
| 3 | Pipeline de oportunidades | F5 | Kanban inmobiliario configurable, forecast, comisiones |
| 4 | Omnichannel Inbox | F8 | WhatsApp, email, web chat, IG, FB — adapters mock/real-ready |
| 5 | Gestión de propiedades | F6 | Inventario completo: casas, deptos, terrenos, preventas, desarrollos |
| 6 | Landing Page Engine | F7 | Landing pública por propiedad (`/p/[slug]`) y por inmobiliaria (`/company/[slug]`) |
| 7 | Smart Matching Engine | F10 | Score de compatibilidad cliente↔propiedad con razones y mensaje sugerido |
| 8 | Smart Visit Planner | F11 | Agenda de visitas, rutas inteligentes (mock → Google Maps) |
| 9 | Automation Builder | F12 | Triggers → conditions → actions, plantillas, logs |
| 10 | AI Copilot | F15 | Chat con tool-calling, permisos y confirmación de acciones sensibles |
| 11 | Deal Intelligence | F14 | Lead score, deal score, riesgo de abandono, next best action |
| 12 | Customer Portal | F13 | Portales comprador / vendedor / inversionista |
| 13 | Analytics & BI | F16 | Executive overview, performance por agente, fuentes, forecast |
| 14 | Campaigns & Lead Sources | F16 | Atribución UTM, ROI por fuente |
| 15 | Tasks & Calendar | F4/F11 | Tareas, recordatorios, agenda |
| 16 | Team Management | F1 | Usuarios, roles, equipos, branches |
| 17 | Documents | V2 | Documentos por contacto/propiedad/oportunidad |
| 18 | Settings | F1 | Organización, usuarios, IA, automatizaciones, branding |
| 19 | Integrations | F19 | WhatsApp Business API, Meta, Gmail, Calendar, Maps, webhooks |
| 20 | Billing | V2/V3 | Stripe, planes, límites por plan |

## 5. AI Orchestrator (capa transversal)

Capa propia que desacopla el producto de cualquier proveedor de IA:

- **Proveedores:** OpenAI, Anthropic, Google Gemini, Grok, DeepSeek, locales (futuro), mock.
- **Tareas configurables:** suggest_reply, summarize_conversation, score_lead,
  recommend_properties, generate_property_description, next_best_action, etc.
- **Por tarea se configura:** proveedor, modelo, temperatura, prompt base, costo máximo,
  aprobación humana sí/no.
- **Operación:** routing por tarea, fallbacks, cost tracking, latency tracking, logs,
  quality rating, safety settings.
- Sin API keys configuradas, el sistema funciona con `MockProvider` (respuestas demo
  deterministas) para que la demo siempre funcione.

## 6. Estructura de navegación

### App principal (autenticada, por tenant)

```
/dashboard        → Dashboard Inteligente (home)
/contacts         → CRM (tabla, kanban, /contacts/[id] perfil)
/pipeline         → Oportunidades (kanban, tabla, forecast)
/inbox            → Omnichannel Inbox (lista + chat)
/properties       → Propiedades (grid, tabla, mapa, /properties/[id])
/visits           → Smart Visit Planner (agenda, mapa, rutas)
/automations      → Automation Builder (workflows, logs, plantillas)
/analytics        → Analytics & BI (overview, sales, agents, sources…)
/copilot          → AI Copilot (chat completo; también panel lateral global)
/settings         → Organización, usuarios y roles, IA, integraciones, branding
```

### Navegación

- **Desktop:** sidebar lateral colapsable + topbar con búsqueda global (CommandBar ⌘K),
  TenantSwitcher y UserMenu.
- **Mobile:** bottom nav con 5 accesos (Dashboard, Inbox, Contactos, Visitas, Más) +
  quick actions (nota rápida, tarea rápida, click-to-WhatsApp).

### Superficies públicas (sin auth, por tenant)

```
/p/[slug]         → Landing pública de propiedad (SEO, OG, captura UTM, form → lead)
/company/[slug]   → Landing de inmobiliaria (branding, agentes, propiedades)
```

### Customer Portal (auth de cliente, branding del tenant)

```
/portal/login     → Acceso seguro de clientes
/portal           → Home según tipo: comprador / vendedor / inversionista
```

### Auth

```
/login, /signup, /onboarding   → Autenticación y alta de organización
```

## 7. Principios de diseño UX/UI

Inspiración: **Linear** (claridad/velocidad), **Stripe** (calidad visual), **Notion**
(simplicidad), **Vercel** (estética), **Raycast** (productividad), **Attio** (CRM moderno).

- Dashboard limpio, mucho espacio en blanco, cards elegantes, bordes suaves, sombras sutiles.
- Animaciones mínimas y premium (Framer Motion solo donde aporta).
- Modo claro y oscuro desde Fase 1 (tokens semánticos en Tailwind v4).
- Mobile responsive real: el agente en campo es usuario de primera clase.
- Estados siempre diseñados: loading (skeletons), empty (con CTA), error (con retry).
- Accesibilidad básica: focus visible, contraste AA, navegación por teclado.

## 8. MVP realista (qué demuestra valor primero)

1. SaaS multiempresa base (orgs, roles, tenant context)
2. Dashboard inteligente
3. CRM contactos
4. Pipeline
5. Propiedades
6. Landing pages
7. Inbox simulada (adapters real-ready)
8. AI Orchestrator (mock/real-ready)
9. Smart matching básico
10. Visitas
11. Deal intelligence básico
12. Copilot básico

**Demo story:** "Morishita Realty Group" entra al sistema, recibe leads de su landing,
el inbox los convierte en contactos, el matching recomienda propiedades, agenda visitas
y la IA prioriza los cierres de la semana.

## 9. Documentos relacionados

- [01 — Arquitectura](./01-architecture.md)
- [02 — Modelo de datos](./02-data-model.md)
- [03 — Roadmap](./03-roadmap.md)
- [04 — Decisiones técnicas (ADRs)](./04-technical-decisions.md)
- [05 — Riesgos y supuestos](./05-risks-and-assumptions.md)
