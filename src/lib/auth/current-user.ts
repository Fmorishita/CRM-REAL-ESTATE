import "server-only";

import { readAuthCookie } from "@/lib/auth/cookie";

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Returns the signed-in Supabase user from the auth cookie, or null. Access-token
 * refresh happens in middleware (cookies can't be written during a render), so
 * this only reads — an expired token is treated as signed out and triggers a
 * redirect to the login page upstream.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await readAuthCookie();
  if (!session) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  if (session.expiresAt <= nowSec) return null;
  return { id: session.userId, email: session.email };
}
