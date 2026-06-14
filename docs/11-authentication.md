# Authentication (Phase 21 · V2)

> Real sign-in backed by **Supabase Auth (GoTrue)**, gated behind an explicit
> flag. With auth off, the app keeps running on the demo owner context — zero
> configuration, public demo never locked behind a login.

## When is auth on?

`isAuthEnabled()` (`src/lib/auth/config.ts`) returns true only when **all** hold:

1. `DEMO_MODE` is not `true` (demo mode always wins and keeps auth off).
2. `AUTH_ENABLED=true` (explicit opt-in).
3. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.

The explicit `AUTH_ENABLED` flag is intentional: a configured database must never
accidentally put the public demo behind a sign-in wall.

## How it works

```
Browser ── credentials ──► signInAction (server action)
                              │  Supabase GoTrue /token (password grant)
                              ▼
                         membership check (resolveTenantForEmail)
                              │  ok → httpOnly cookie (rp_auth) → /dashboard
                              └  no membership → GoTrue logout + error
```

- **GoTrue REST client** (`src/lib/supabase/gotrue.ts`) — talks to
  `/auth/v1/token`, `/auth/v1/logout` over HTTPS. No SDK dependency, edge-safe.
- **Session cookie** (`src/lib/auth/cookie.ts`) — `rp_auth`, httpOnly + secure +
  sameSite=lax, holding `{ userId, email, accessToken, refreshToken, expiresAt }`.
- **Token refresh** (`src/middleware.ts`) — when the access token is within 60s of
  expiry, the middleware refreshes it via the refresh-token grant and rewrites the
  cookie. Server components only read the cookie (they can't write during render).
- **Tenant resolution** (`getTenantContext` in `src/lib/auth/session.ts`) — with
  auth on, the signed-in user's **email** is matched to an active membership via
  `resolveTenantForEmail`. No session or no membership → redirect to `/login`. It
  never falls back to the demo/owner context in auth mode (that would grant access
  without a real membership).
- **Sign out** (`signOutAction`) — revokes the GoTrue session and clears the cookie.

## Mapping Supabase users to app members

Authorization comes from the app's own `memberships` table, not from Supabase. A
Supabase Auth user grants access only if their email matches an **active**
membership. To onboard someone:

1. Create the Supabase Auth user (Supabase dashboard → Authentication → Users, or
   a future in-app invite/signup flow) with the email you want to authorize.
2. Ensure that email has an active `membership` row in an organization (the seed
   already creates the Morishita team; real orgs create these on invite).

Multi-org users land in their first active membership; an org switcher (preferred
org id) is supported by `resolveTenantForEmail` and is a follow-up UI task.

## Enabling it (production)

```bash
DEMO_MODE=false
AUTH_ENABLED=true
DATABASE_URL=...                  # pooled connection
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

In Supabase Auth settings, enable Email provider and set the Site URL / redirect
URLs to your app domain.

## Security notes

- The cookie is httpOnly (no JS access) and short-lived access tokens are rotated
  by middleware; the refresh token is the long-lived secret.
- Sign-in is rate limited (10/min/IP) like the portal login.
- A valid Supabase user with no membership cannot hold a half-open session — the
  GoTrue session is signed back out immediately.

## Pending / future

- In-app invite + signup with organization provisioning.
- JWT signature verification of the access token on the server (currently trusted
  within its short lifetime; refresh validates against GoTrue).
- Org switcher UI writing the preferred-org cookie.
- Password reset / magic-link / OAuth providers (GoTrue supports them).
