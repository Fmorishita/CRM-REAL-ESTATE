# Database setup (Phase 2)

> Provisioned on Supabase. The hosted demo DB is live and seeded.

## What exists

- **Supabase project** `CRM-REAL-ESTATE` (ref `jfogejsnmzjakixfxtnx`, region `us-west-2`,
  Postgres 17).
- **37 tables, 26 enums, 86 indexes** generated from `prisma/schema.prisma`.
- **Row Level Security** enabled on every tenant table. The `anon`/`authenticated`
  roles have no access (no policies yet); the app connects as `postgres`
  (`BYPASSRLS`) and enforces tenant isolation in the application layer — RLS is the
  defense-in-depth net. Org-scoped policies for `authenticated` arrive with
  Supabase Auth.
- **Demo data** seeded for "Morishita Realty Group" (+ a second org "Baja Living
  Premium" to prove isolation): 7 users, 9 system roles, 10 contacts, 5 properties,
  6 opportunities, 3 conversations, visits, tasks and AI task configs.

## Connection

Prisma uses two URLs (both via Supabase's Supavisor pooler):

- `DATABASE_URL` — transaction pooler, port 6543, `?pgbouncer=true&connection_limit=1`
  (runtime, serverless-friendly).
- `DIRECT_URL` — session pooler, port 5432 (migrations).

These plus the Supabase keys live in `.env` locally (gitignored) and in the Vercel
project (production + preview + development). `DEMO_MODE=false` makes the app read
from the database; with no `DATABASE_URL` it falls back to in-memory demo data.

## Migrations

Two migrations under `prisma/migrations/`, recorded in `_prisma_migrations`:

1. `00000000000000_init` — full schema.
2. `00000000000001_updated_at_defaults` — `DEFAULT now()` on every `updated_at`
   column so raw SQL inserts (seeds, imports) satisfy NOT NULL.

The hosted DB was provisioned over the Supabase Management API (the build environment
only allows outbound HTTPS, not raw Postgres TCP). From a machine with database
access the same result comes from:

```bash
pnpm db:migrate   # prisma migrate deploy
pnpm db:seed      # runs prisma/seed.sql (single source of truth for demo data)
```

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm db:generate` | Generate the Prisma client (also runs on `postinstall`) |
| `pnpm db:migrate` | Apply pending migrations (`migrate deploy`) |
| `pnpm db:seed` | Load the Morishita demo dataset from `prisma/seed.sql` |
| `pnpm db:studio` | Open Prisma Studio |
