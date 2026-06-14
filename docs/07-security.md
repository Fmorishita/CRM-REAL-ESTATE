# Security, Audit & Permissions (Phase 18)

> Defense in depth across application and database layers.

## Multi-tenant isolation

- **Every business table carries `organization_id`.** Reads and writes always
  scope by `ctx.organization.id`, resolved server-side from the session — never
  from client input.
- **Row Level Security** is enabled on all 37 tenant tables (verified). The
  `anon` / `authenticated` Postgres roles have no bypass and no policies, so the
  public Supabase keys can read nothing. The app connects as `postgres`
  (BYPASSRLS) and enforces isolation in the application layer; RLS is the
  defense-in-depth net.
- Action handlers re-verify that referenced entities (contact, property, stage,
  conversation…) belong to the caller's organization before mutating.

## RBAC

- 10 roles, 21 granular permissions (`config/permissions.ts`).
- Server guard `requirePermission(ctx, permission)` gates every sensitive server
  action; navigation is filtered by permission in the app shell (UX only — the
  server is the source of truth).

## Input validation & sanitization

- All action inputs are validated with **Zod** at the boundary.
- `sanitizeText()` strips control characters from free-text where needed.

## Rate limiting

- Basic in-memory fixed-window limiter (`lib/rate-limit.ts`) applied to abuse-prone
  public surfaces: portal login (10/min/IP) and landing lead capture (5/min/IP).
- For multi-instance production, back the limiter with Upstash/Redis (same
  interface).

## Audit logging

- Sensitive actions (create/update/delete contacts, opportunities, properties,
  conversations assignment, visits, automations, AI config) write to
  `audit_logs` with actor membership, action, entity and timestamp.
- Visible at **Settings → Auditoría** (`/settings/audit`), gated by
  `settings.manage`.

## Confirmations for sensitive actions

- Destructive or outward-facing actions require explicit confirmation:
  automation delete, AI Copilot write actions (task creation), demo-mode writes
  are blocked with a clear message.

## HTTP hardening

- Security headers on all routes (`next.config.ts`): `X-Content-Type-Options`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Strict-Transport-Security`,
  `Permissions-Policy`.
- Portal session cookie is `httpOnly` + `secure` (production) + `sameSite=lax`.

## Error handling

- Per-request fallback to demo data on DB errors keeps the app responsive.
- Error boundaries: dashboard (`/dashboard`) and the whole authenticated app
  (`(app)/error.tsx`) render a friendly retry screen instead of crashing.

## Pending / future

- ✅ Real authentication (Supabase Auth) implemented in Phase 21 (opt-in via
  `AUTH_ENABLED`); see `docs/11-authentication.md`. Sign-in resolves the tenant
  from the signed-in user's membership, with no demo fallback in auth mode.
- Per-org custom roles (schema already supports it).
- Distributed rate limiting and WAF at the edge for production scale.
