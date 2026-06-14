import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE } from "@/lib/auth/cookie";

/**
 * Refreshes the Supabase access token when it is about to expire and writes the
 * rotated session back to the cookie. Server components only read the cookie
 * (they can't write during render), so this keeps the token fresh between
 * requests. It is a no-op when auth is disabled or there is no session, and it
 * never blocks a request: any failure falls through to the normal response.
 */
function authEnabled(): boolean {
  if (process.env.DEMO_MODE === "true") return false;
  if (process.env.AUTH_ENABLED !== "true") return false;
  if (!process.env.DATABASE_URL) return false;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

interface CookieSession {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function middleware(request: NextRequest) {
  if (!authEnabled()) return NextResponse.next();

  const raw = request.cookies.get(AUTH_COOKIE)?.value;
  if (!raw) return NextResponse.next();

  let session: CookieSession;
  try {
    session = JSON.parse(raw) as CookieSession;
  } catch {
    return NextResponse.next();
  }

  const nowSec = Math.floor(Date.now() / 1000);
  // Still fresh (more than 60s of life left): nothing to do.
  if (session.expiresAt - 60 > nowSec) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
      cache: "no-store",
    });

    const response = NextResponse.next();

    if (!res.ok) {
      // Refresh token invalid/expired: drop the session so the user is sent to login.
      response.cookies.delete(AUTH_COOKIE);
      return response;
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in?: number;
      expires_at?: number;
      user: { id: string; email?: string | null };
    };

    const next: CookieSession = {
      userId: data.user.id,
      email: (data.user.email ?? session.email).toLowerCase(),
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at ?? nowSec + (data.expires_in ?? 3600),
    };

    response.cookies.set(AUTH_COOKIE, JSON.stringify(next), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|p/|company/).*)"],
};
