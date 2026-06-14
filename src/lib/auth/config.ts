import "server-only";

import { isDemoMode } from "@/lib/db";

/**
 * Real authentication (Supabase Auth) is active only when it is explicitly opted
 * into (`AUTH_ENABLED=true`), Supabase is configured, and demo mode is off.
 *
 * The explicit flag is deliberate: it guarantees the public demo can never get
 * locked behind a login wall just because a database happens to be configured.
 * Without it the app uses the demo owner context and runs with zero config.
 */
export function isAuthEnabled(): boolean {
  if (isDemoMode()) return false;
  if (process.env.AUTH_ENABLED !== "true") return false;
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
  );
}
