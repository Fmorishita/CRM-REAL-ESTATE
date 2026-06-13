# Integrations (Phase 19)

> Integration-ready architecture: every external service sits behind a stable
> adapter interface with a working mock. The real implementation activates only
> when its credentials are present in the environment. **Credentials are never
> invented** — a missing variable always means the mock/demo adapter is used.

## How it works

```
Inbox / Visit Planner / Automations
        │  (depend only on the interface)
        ▼
  getXAdapter()  ──►  live adapter   (env configured)
                 └─►  mock adapter   (no env — demo mode)
```

- **Registry** — `src/lib/integrations/registry.ts` is the single source of
  truth: id, category, required/optional env vars, capabilities and docs URL for
  every integration.
- **Status** — `src/modules/integrations/server/queries.ts` reads `process.env`
  and reports each integration as `connected` (live) or demo (mock). Surfaced at
  **Settings → Integraciones** (`/settings/integrations`), gated by
  `settings.manage`.
- **Adapters** — each lives under `src/lib/integrations/<domain>/`:
  - `channels/` — WhatsApp, Instagram, Facebook, WebChat (used by the Inbox).
  - `email/` — Gmail-backed outbound email.
  - `calendar/` — Google Calendar event creation (Visit Planner).
  - `maps/` — route planning + public Google Maps directions URLs.
  - `webhooks/` — signed outbound events for Zapier / Make / n8n.

All adapter modules are `server-only`; no credential is ever exposed to the
client bundle.

## Catalogue

| Integration | Category | Required env | Activates |
|-------------|----------|--------------|-----------|
| WhatsApp Business | messaging | `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` | Live send via Meta Cloud API |
| Instagram & Messenger | messaging | `META_PAGE_ACCESS_TOKEN` | Live send via Graph API |
| Correo (Gmail) | email | `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `EMAIL_FROM` | Live send (needs runtime `GMAIL_ACCESS_TOKEN`) |
| Google Calendar | calendar | `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET` | Event creation (needs runtime `GOOGLE_CALENDAR_ACCESS_TOKEN`) |
| Google Maps | maps | `GOOGLE_MAPS_API_KEY` | Geocoding/distances (mock route planner without it) |
| Webhooks salientes | automation | `WEBHOOK_SIGNING_SECRET` | HMAC-signed outbound events |

## Setup

### WhatsApp Business (Meta Cloud API)

1. Create an app at [developers.facebook.com](https://developers.facebook.com)
   and add the **WhatsApp** product.
2. Copy the **Phone number ID** and a **permanent access token**.
3. Set `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN`.
4. (Optional) For inbound messages, configure a webhook pointing to your app and
   set `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

### Instagram & Facebook Messenger

1. In the same Meta app, add **Messenger** and link the Facebook Page / Instagram
   professional account.
2. Generate a **Page access token** and set `META_PAGE_ACCESS_TOKEN`.

### Gmail

1. Create OAuth credentials in Google Cloud Console (Gmail API enabled).
2. Set `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` and `EMAIL_FROM`.
3. The per-user OAuth flow mints `GMAIL_ACCESS_TOKEN` when the agent connects
   their account; the live adapter sends through `users.messages.send`.

### Google Calendar

1. Enable the Calendar API and reuse the OAuth client.
2. Set `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET`.
3. A connected account provides `GOOGLE_CALENDAR_ACCESS_TOKEN` at runtime; visits
   are mirrored as events on the primary calendar.

### Google Maps

1. Create an API key with the Maps/Directions APIs enabled.
2. Set `GOOGLE_MAPS_API_KEY`. Without it, the Visit Planner still works using the
   haversine route estimator and public Google Maps directions URLs (no key
   required).

### Outbound webhooks

1. Set `WEBHOOK_SIGNING_SECRET` to any strong random string.
2. Events are POSTed with `X-Realtor-Signature: sha256=<hmac>` so receivers can
   verify authenticity. Without the secret the dispatcher stays in mock mode and
   makes no external calls.

## Adding a new integration

1. Add an entry to `INTEGRATIONS` in `registry.ts` (category, required env,
   capabilities, docs URL).
2. Document the variables in `.env.example`.
3. Implement the adapter under `src/lib/integrations/<domain>/` with a mock
   default and an env-gated live path.
4. It appears automatically in **Settings → Integraciones** with the correct
   connected/demo status.

## Security notes

- Tokens are read server-side only and never logged.
- Webhook payloads are HMAC-signed; verify the signature before trusting them.
- Rate limiting (`lib/rate-limit.ts`) protects public surfaces; apply it to any
  new inbound webhook endpoints.
