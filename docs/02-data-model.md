# Modelo de datos inicial

> Fase 0 · Versión 1.0 — esquema conceptual; el DDL real (Prisma) se crea en Fase 2.

Convenciones globales:

- PK: `id` (uuid v7). Timestamps: `created_at`, `updated_at`. Soft delete donde aplica: `deleted_at`.
- **Toda tabla de negocio lleva `organization_id`** (FK a `organizations`) + índice compuesto
  `(organization_id, …)` en los accesos frecuentes.
- Dinero: `amount: decimal(14,2)` + `currency: char(3)` (ISO 4217). Nunca floats.
- Campos flexibles por país/empresa: `custom_fields: jsonb` validado por Zod.

## 1. Tenancy & identidad

```
organizations      id, name, slug, country, default_currency, default_locale, timezone,
                   logo_url, plan (free|starter|pro|enterprise), plan_limits jsonb,
                   settings jsonb, branding jsonb
branches           id, organization_id, name, address, timezone
teams              id, organization_id, branch_id?, name, leader_membership_id?
users              id, auth_id (Supabase), name, email, phone, avatar_url, locale
memberships        id, organization_id, user_id, role, team_id?, branch_id?, status
                   UNIQUE (organization_id, user_id)
roles              id, organization_id? (null = rol de sistema), key, name
permissions        key (catálogo: contacts.view, contacts.create, …)
role_permissions   role_id, permission_key
audit_logs         id, organization_id, membership_id, action, entity_type, entity_id,
                   metadata jsonb, ip, created_at
```

## 2. CRM

```
contacts             id, organization_id, type (buyer|seller|investor|renter|
                     external_broker|referrer|developer), first_name, last_name,
                     email?, phone?, whatsapp?, lead_source_id?, stage,
                     assigned_membership_id?, score int, close_probability,
                     last_contact_at, next_follow_up_at, custom_fields jsonb,
                     search_vector tsvector
contact_preferences  contact_id, budget_min, budget_max, currency, zones text[],
                     property_types text[], bedrooms_min, bathrooms_min,
                     amenities text[], purchase_reason, urgency (low|medium|high),
                     lifestyle_notes
tags                 id, organization_id, name, color
contact_tags         contact_id, tag_id
notes                id, organization_id, entity_type (contact|property|opportunity|
                     visit|conversation), entity_id, membership_id, body
activities           id, organization_id, entity_type, entity_id, membership_id?,
                     kind (created|updated|stage_changed|message|call|visit|note|
                     ai_action|…), payload jsonb, occurred_at   ← timeline unificado
lead_sources         id, organization_id, name, kind (facebook|google|portal|referral|
                     landing|walk_in|other), utm_defaults jsonb
saved_segments       id, organization_id, membership_id, entity (contacts|properties),
                     name, filters jsonb
```

## 3. Propiedades

```
properties           id, organization_id, title, slug, description, property_type
                     (house|apartment|land|office|retail|warehouse|development|
                     presale|vacation_rental|rental), operation (sale|rent|presale),
                     status (available|reserved|sold|rented|paused),
                     price, currency, address jsonb, lat, lng, zone, city, state,
                     country, bedrooms, bathrooms, parking, lot_size_m2, built_m2,
                     amenities text[], commission_pct, shared_commission_pct,
                     developer_name?, assigned_membership_id?, available_from?,
                     delivery_date?, development_stage?, tags text[],
                     custom_fields jsonb, search_vector tsvector
property_media       id, organization_id, property_id, kind (photo|video|tour|plan),
                     url, position, alt
property_documents   id, organization_id, property_id, name, url, visibility
property_views       id, organization_id, property_id, source, utm jsonb, viewed_at
                     ← analytics de landing
contact_properties   contact_id, property_id, relation (favorite|viewed|recommended|
                     visited|offered), score?, created_at
```

## 4. Pipeline

```
pipelines          id, organization_id, name, is_default
pipeline_stages    id, organization_id, pipeline_id, key, name, position, probability,
                   is_won, is_lost
opportunities      id, organization_id, pipeline_id, stage_id, contact_id,
                   property_id?, title, amount, currency, commission_amount,
                   probability, expected_close_date, assigned_membership_id,
                   lost_reason?, ai_score, ai_risk (low|medium|high),
                   ai_next_action?, closed_at?
```

Etapas seed: Nuevo lead → Contactado → Calificado → Buscando propiedad → Visita agendada
→ Visita realizada → Oferta/negociación → Documentación → Cierre → **Ganado** / **Perdido**.

## 5. Inbox omnicanal

```
channel_accounts   id, organization_id, channel (whatsapp|email|instagram|facebook|
                   webchat), name, status (mock|connected|error), credentials_ref,
                   settings jsonb
conversations      id, organization_id, channel_account_id, contact_id?,
                   external_id?, status (new|open|waiting_customer|needs_attention|
                   closed), assigned_membership_id?, priority, last_message_at,
                   ai_summary?, ai_sentiment?, ai_intent?, unread_count
messages           id, organization_id, conversation_id, direction (inbound|outbound),
                   author (contact|membership_id|ai|system), body, media jsonb,
                   external_id?, status (queued|sent|delivered|read|failed), sent_at
quick_replies      id, organization_id, title, body, channel?
```

## 6. Visitas y tareas

```
visits         id, organization_id, contact_id, property_id, assigned_membership_id,
               scheduled_at, duration_min, status (pending|confirmed|en_route|done|
               no_show|rescheduled|cancelled), notes?, feedback?, checklist jsonb,
               route_order?
tasks          id, organization_id, title, description?, due_at, completed_at?,
               priority, assigned_membership_id, entity_type?, entity_id?
               ← vinculable a contacto/oportunidad/propiedad/visita
```

## 7. Automatizaciones

```
automations       id, organization_id, name, status (active|inactive|draft),
                  trigger jsonb {type, config}, conditions jsonb[], actions jsonb[],
                  template_key?
automation_runs   id, organization_id, automation_id, trigger_entity jsonb,
                  status (success|failed|partial|skipped), steps jsonb[], error?,
                  started_at, finished_at
```

## 8. IA

```
ai_task_configs   id, organization_id, task_key, provider, model, temperature,
                  max_cost_usd, prompt_override?, requires_approval bool, enabled
ai_logs           id, organization_id, task_key, provider, model, membership_id?,
                  entity_type?, entity_id?, input_tokens, output_tokens, cost_usd,
                  latency_ms, status, quality_rating?, error?
ai_approvals      id, organization_id, ai_log_id, payload jsonb, status
                  (pending|approved|rejected), resolved_by?, resolved_at?
```

## 9. Landing pages & portal

```
landing_pages            id, organization_id, kind (property|company), property_id?,
                         slug UNIQUE per org, template, is_active, hide_price,
                         show_exact_location, cta_config jsonb, seo jsonb,
                         views_count, leads_count
landing_leads            id, organization_id, landing_page_id, contact_id?,
                         form_data jsonb, utm jsonb, created_at
client_portal_accounts   id, organization_id, contact_id, auth_id?, email,
                         portal_type (buyer|seller|investor), status, last_login_at
```

## 10. Relaciones clave (resumen)

```
organizations 1─N memberships N─1 users
organizations 1─N contacts 1─1 contact_preferences
contacts 1─N opportunities N─1 properties (opcional)
contacts 1─N conversations 1─N messages
contacts N─N properties (contact_properties: favorite/viewed/recommended/visited)
contacts 1─N visits N─1 properties
properties 1─N property_media / property_documents / landing_pages
automations 1─N automation_runs
ai_task_configs por (organization_id, task_key)
activities = timeline polimórfico de todo
```

## 11. Índices y rendimiento (mínimos F2)

- `(organization_id, created_at)` en tablas de listado.
- `(organization_id, assigned_membership_id)` en contacts/opportunities/conversations/visits.
- `(organization_id, stage_id)` en opportunities; `(organization_id, status)` en conversations.
- GIN sobre `search_vector` (contacts, properties) y sobre `amenities`/`zones`.
- `landing_pages.slug` único por organización; lookup público por `(slug)` con covering index.
