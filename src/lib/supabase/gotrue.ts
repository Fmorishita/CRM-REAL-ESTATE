import "server-only";

/**
 * Minimal Supabase Auth (GoTrue) REST client over HTTPS. We talk to the auth
 * endpoints directly instead of pulling the Supabase SDK, matching how this repo
 * already provisions Supabase over the Management API and keeping the edge
 * middleware dependency-free. Every call is a no-op (returns null) when Supabase
 * is not configured.
 */

export interface GoTrueUser {
  id: string;
  email: string;
}

export interface GoTrueSession {
  accessToken: string;
  refreshToken: string;
  /** Epoch seconds when the access token expires. */
  expiresAt: number;
  user: GoTrueUser;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  user: { id: string; email?: string | null };
}

function authBase(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url: url.replace(/\/$/, ""), anonKey };
}

function toSession(data: TokenResponse): GoTrueSession {
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at ?? nowSec + (data.expires_in ?? 3600),
    user: { id: data.user.id, email: (data.user.email ?? "").toLowerCase() },
  };
}

export async function signInWithPassword(email: string, password: string): Promise<GoTrueSession | null> {
  const base = authBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: base.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return toSession((await res.json()) as TokenResponse);
  } catch (error) {
    console.error("signInWithPassword failed:", error);
    return null;
  }
}

interface SignUpResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user?: { id: string; email?: string | null };
  id?: string;
  email?: string | null;
}

export interface GoTrueSignUpResult {
  user: GoTrueUser | null;
  /** Null when the project requires email confirmation (no session until confirmed). */
  session: GoTrueSession | null;
}

export async function signUpWithPassword(email: string, password: string): Promise<GoTrueSignUpResult | null> {
  const base = authBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base.url}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: base.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SignUpResponse;

    const userObj = data.user ?? (data.id ? { id: data.id, email: data.email } : undefined);
    const user: GoTrueUser | null = userObj ? { id: userObj.id, email: (userObj.email ?? email).toLowerCase() } : null;

    const session =
      data.access_token && data.refresh_token && userObj
        ? toSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            expires_at: data.expires_at,
            user: { id: userObj.id, email: userObj.email },
          })
        : null;

    return { user, session };
  } catch (error) {
    console.error("signUpWithPassword failed:", error);
    return null;
  }
}

export async function refreshSession(refreshToken: string): Promise<GoTrueSession | null> {
  const base = authBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: base.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return toSession((await res.json()) as TokenResponse);
  } catch (error) {
    console.error("refreshSession failed:", error);
    return null;
  }
}

export async function signOutGoTrue(accessToken: string): Promise<void> {
  const base = authBase();
  if (!base) return;
  try {
    await fetch(`${base.url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: base.anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("signOutGoTrue failed:", error);
  }
}
