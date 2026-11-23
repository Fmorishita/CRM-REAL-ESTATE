/**
 * Meta credentials for Page-scoped calls (Messenger, Instagram Direct, posts).
 *
 * META_PAGE_ACCESS_TOKEN may be a *page* token or a *system-user* token. A
 * system-user token is not a page: "/me" is the system user, not the page, so
 * every call addresses the page explicitly (/{META_PAGE_ID}/…) and, when the
 * configured token can mint it, uses the page's own access token.
 */

export const GRAPH_BASE = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION?.trim() || "v23.0"}`;

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const TOKEN_TTL_MS = 50 * 60 * 1000;
const cache = new Map<string, { token: string; expiresAt: number }>();

/** Test hook. */
export function clearPageTokenCache(): void {
  cache.clear();
}

/**
 * Page access token: asks Graph for `/{pageId}?fields=access_token` with the
 * configured token (works for system-user and long-lived user tokens that manage
 * the page). Falls back to the configured token, which is already a page token
 * when that call returns none. Cached per configured token for 50 minutes.
 */
export async function resolvePageToken(
  configured: string,
  pageId: string,
  fetchImpl: FetchLike = fetch,
  now: number = Date.now(),
): Promise<string> {
  const key = `${pageId}:${configured}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.token;
  let token = configured;
  try {
    const res = await fetchImpl(`${GRAPH_BASE}/${pageId}?fields=access_token`, {
      headers: { Authorization: `Bearer ${configured}` },
      cache: "no-store",
    });
    if (res.ok) {
      const json = (await res.json().catch(() => null)) as { access_token?: string } | null;
      if (json?.access_token) token = json.access_token;
    }
  } catch {
    // Network error: keep the configured token; the send itself will report the failure.
  }
  cache.set(key, { token, expiresAt: now + TOKEN_TTL_MS });
  return token;
}

export interface SendRequest {
  url: string;
  body: { recipient: { id: string }; messaging_type: "RESPONSE"; message: { text: string } };
}

/**
 * Messenger and Instagram Direct replies both go to the Page's messages edge.
 * `to` is the PSID / IGSID of the thread (conversation.externalId).
 */
export function buildMessageRequest(pageId: string, to: string, text: string): SendRequest {
  return {
    url: `${GRAPH_BASE}/${pageId}/messages`,
    body: { recipient: { id: to }, messaging_type: "RESPONSE", message: { text } },
  };
}
