import "server-only";

/**
 * Facebook Page + Instagram professional account publishing through the Graph
 * API. Needs a Page access token with pages_manage_posts, pages_read_engagement,
 * instagram_basic and instagram_content_publish (META_PAGE_ACCESS_TOKEN), the
 * Page id (META_PAGE_ID) and the linked Instagram account id (META_IG_USER_ID).
 * Meta is the source of truth: posts are read back from it, not stored here.
 */

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION?.trim() || "v23.0"}`;

export interface SocialConfig {
  pageId: string | null;
  igUserId: string | null;
  connected: boolean;
}

export function socialConfig(): SocialConfig {
  const pageId = process.env.META_PAGE_ID?.trim() || null;
  const igUserId = process.env.META_IG_USER_ID?.trim() || null;
  return { pageId, igUserId, connected: Boolean(process.env.META_PAGE_ACCESS_TOKEN?.trim() && pageId) };
}

function token(): string {
  return process.env.META_PAGE_ACCESS_TOKEN!.trim();
}

async function graph<T>(path: string, init?: { method?: "GET" | "POST"; params?: Record<string, string> }): Promise<T> {
  const params = new URLSearchParams({ ...(init?.params ?? {}), access_token: token() });
  const isPost = init?.method === "POST";
  const res = await fetch(isPost ? `${GRAPH}${path}` : `${GRAPH}${path}?${params}`, {
    method: init?.method ?? "GET",
    ...(isPost ? { body: params, headers: { "Content-Type": "application/x-www-form-urlencoded" } } : {}),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: number } } & T;
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ? `Meta ${json.error.code ?? res.status}: ${json.error.message}` : `Meta ${res.status}`);
  }
  return json;
}

export interface SocialPost {
  id: string;
  network: "facebook" | "instagram";
  text: string;
  imageUrl: string | null;
  permalink: string | null;
  publishedAt: string;
  scheduled: boolean;
}

export async function listRecentPosts(): Promise<{ posts: SocialPost[]; error?: string }> {
  const cfg = socialConfig();
  if (!cfg.connected) return { posts: [] };
  const posts: SocialPost[] = [];
  const errors: string[] = [];
  try {
    const fb = await graph<{ data: { id: string; message?: string; created_time: string; permalink_url?: string; full_picture?: string }[] }>(
      `/${cfg.pageId}/published_posts`,
      { params: { fields: "message,created_time,permalink_url,full_picture", limit: "12" } },
    );
    for (const p of fb.data) {
      posts.push({ id: p.id, network: "facebook", text: p.message ?? "", imageUrl: p.full_picture ?? null, permalink: p.permalink_url ?? null, publishedAt: p.created_time, scheduled: false });
    }
    const sched = await graph<{ data: { id: string; message?: string; scheduled_publish_time?: number; full_picture?: string }[] }>(
      `/${cfg.pageId}/scheduled_posts`,
      { params: { fields: "message,scheduled_publish_time,full_picture", limit: "12" } },
    ).catch(() => ({ data: [] }));
    for (const p of sched.data) {
      posts.push({
        id: p.id, network: "facebook", text: p.message ?? "", imageUrl: p.full_picture ?? null, permalink: null,
        publishedAt: new Date((p.scheduled_publish_time ?? 0) * 1000).toISOString(), scheduled: true,
      });
    }
  } catch (e) {
    errors.push(`Facebook: ${e instanceof Error ? e.message : "error"}`);
  }
  if (cfg.igUserId) {
    try {
      const ig = await graph<{ data: { id: string; caption?: string; media_url?: string; thumbnail_url?: string; permalink?: string; timestamp: string }[] }>(
        `/${cfg.igUserId}/media`,
        { params: { fields: "caption,media_url,thumbnail_url,permalink,timestamp", limit: "12" } },
      );
      for (const p of ig.data) {
        posts.push({ id: p.id, network: "instagram", text: p.caption ?? "", imageUrl: p.thumbnail_url ?? p.media_url ?? null, permalink: p.permalink ?? null, publishedAt: p.timestamp, scheduled: false });
      }
    } catch (e) {
      errors.push(`Instagram: ${e instanceof Error ? e.message : "error"}`);
    }
  }
  posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return { posts, error: errors.length ? errors.join(" · ") : undefined };
}

/** Facebook Page post (text, optional image URL); optional native scheduling (10 min – 30 days ahead). */
export async function publishToFacebook(input: { message: string; imageUrl?: string; scheduledAt?: Date }): Promise<string> {
  const cfg = socialConfig();
  const schedule: Record<string, string> = input.scheduledAt
    ? { published: "false", scheduled_publish_time: String(Math.floor(input.scheduledAt.getTime() / 1000)) }
    : {};
  const res = input.imageUrl
    ? await graph<{ id?: string; post_id?: string }>(`/${cfg.pageId}/photos`, { method: "POST", params: { url: input.imageUrl, caption: input.message, ...schedule } })
    : await graph<{ id?: string }>(`/${cfg.pageId}/feed`, { method: "POST", params: { message: input.message, ...schedule } });
  return (res as { post_id?: string; id?: string }).post_id ?? res.id ?? "";
}

/** Instagram feed post (image required by the API); published immediately. */
export async function publishToInstagram(input: { caption: string; imageUrl: string }): Promise<string> {
  const cfg = socialConfig();
  if (!cfg.igUserId) throw new Error("Falta META_IG_USER_ID.");
  const container = await graph<{ id: string }>(`/${cfg.igUserId}/media`, {
    method: "POST",
    params: { image_url: input.imageUrl, caption: input.caption },
  });
  // Containers are usually ready at once for images; poll briefly just in case.
  for (let i = 0; i < 5; i++) {
    const status = await graph<{ status_code?: string }>(`/${container.id}`, { params: { fields: "status_code" } });
    if (status.status_code === "FINISHED") break;
    if (status.status_code === "ERROR") throw new Error("Instagram no pudo procesar la imagen.");
    await new Promise((r) => setTimeout(r, 1500));
  }
  const published = await graph<{ id: string }>(`/${cfg.igUserId}/media_publish`, { method: "POST", params: { creation_id: container.id } });
  return published.id;
}

/**
 * Best-effort public profile of a Messenger (PSID) or Instagram (IGSID) user,
 * used to name new contacts. Returns null without a token or on any error.
 */
export async function fetchSocialProfile(
  network: "facebook" | "instagram",
  userId: string,
): Promise<{ firstName: string; lastName: string; username: string | null } | null> {
  if (!process.env.META_PAGE_ACCESS_TOKEN?.trim()) return null;
  try {
    if (network === "facebook") {
      const p = await graph<{ first_name?: string; last_name?: string }>(`/${userId}`, { params: { fields: "first_name,last_name" } });
      if (!p.first_name && !p.last_name) return null;
      return { firstName: p.first_name ?? "", lastName: p.last_name ?? "", username: null };
    }
    const p = await graph<{ name?: string; username?: string }>(`/${userId}`, { params: { fields: "name,username" } });
    const [first, ...rest] = (p.name ?? "").split(/\s+/).filter(Boolean);
    if (!first && !p.username) return null;
    return { firstName: first ?? `@${p.username}`, lastName: rest.join(" "), username: p.username ?? null };
  } catch {
    return null;
  }
}
