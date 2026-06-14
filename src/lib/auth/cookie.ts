import "server-only";

import { cookies } from "next/headers";

import type { GoTrueSession } from "@/lib/supabase/gotrue";

export const AUTH_COOKIE = "rp_auth";

/** Server-side session persisted in an httpOnly cookie. */
export interface AuthCookie {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  /** Epoch seconds. */
  expiresAt: number;
}

export function sessionToCookie(session: GoTrueSession): AuthCookie {
  return {
    userId: session.user.id,
    email: session.user.email,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  };
}

export async function readAuthCookie(): Promise<AuthCookie | null> {
  const raw = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthCookie;
    if (!parsed.email || !parsed.accessToken || !parsed.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setAuthCookie(value: AuthCookie): Promise<void> {
  (await cookies()).set(AUTH_COOKIE, JSON.stringify(value), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookie(): Promise<void> {
  (await cookies()).delete(AUTH_COOKIE);
}
