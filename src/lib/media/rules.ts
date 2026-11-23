/**
 * What each channel accepts as an outgoing attachment, and how stored message
 * media is represented. Pure module (no I/O): unit-tested and shared by the
 * browser (pre-checks), the server action and the channel adapters.
 *
 * Limits follow Meta's documentation for WhatsApp Cloud API, Messenger Platform
 * and Instagram Messaging; they are enforced here so a rejected file is
 * explained before upload instead of failing silently at Meta.
 */

export type MediaKind = "image" | "video" | "audio" | "document";
export type MediaChannel = "whatsapp" | "instagram" | "facebook";

const MB = 1024 * 1024;

/** Per-object cap of the chat-media bucket (Supabase Storage); no outgoing limit may exceed it. */
export const STORAGE_MAX_BYTES = 50 * MB;

export interface MediaRule {
  mimes: string[];
  maxBytes: number;
}

export const MEDIA_RULES: Record<MediaChannel, Partial<Record<MediaKind, MediaRule>>> = {
  whatsapp: {
    image: { mimes: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * MB },
    video: { mimes: ["video/mp4", "video/3gpp"], maxBytes: 16 * MB },
    audio: { mimes: ["audio/aac", "audio/mp4", "audio/mpeg", "audio/amr", "audio/ogg"], maxBytes: 16 * MB },
    document: {
      mimes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
      ],
      maxBytes: STORAGE_MAX_BYTES,
    },
  },
  facebook: {
    image: { mimes: ["image/jpeg", "image/png", "image/gif", "image/webp"], maxBytes: 8 * MB },
    video: { mimes: ["video/mp4", "video/quicktime"], maxBytes: 25 * MB },
    audio: { mimes: ["audio/aac", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg"], maxBytes: 25 * MB },
    document: { mimes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain"], maxBytes: 25 * MB },
  },
  // Instagram Direct does not accept generic files through the API.
  instagram: {
    image: { mimes: ["image/jpeg", "image/png"], maxBytes: 8 * MB },
    video: { mimes: ["video/mp4", "video/quicktime"], maxBytes: 25 * MB },
    audio: { mimes: ["audio/aac", "audio/mp4", "audio/mpeg", "audio/wav"], maxBytes: 25 * MB },
  },
};

export function kindFromMime(mime: string): MediaKind {
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  return "document";
}

const ES: Record<MediaKind, string> = { image: "imágenes", video: "videos", audio: "audios", document: "documentos" };

export function acceptedLabel(channel: MediaChannel): string {
  return (Object.keys(MEDIA_RULES[channel]) as MediaKind[]).map((k) => ES[k]).join(", ");
}

/** Browser `accept` attribute for the file picker. */
export function acceptAttribute(channel: MediaChannel): string {
  return Object.values(MEDIA_RULES[channel]).flatMap((r) => r?.mimes ?? []).join(",");
}

export type MediaCheck = { ok: true; kind: MediaKind } | { ok: false; error: string };

export function checkOutgoingMedia(channel: MediaChannel, mime: string, size: number): MediaCheck {
  const kind = kindFromMime(mime);
  const rule = MEDIA_RULES[channel][kind];
  const channelName = channel === "whatsapp" ? "WhatsApp" : channel === "instagram" ? "Instagram" : "Messenger";
  if (!rule) return { ok: false, error: `${channelName} no admite ${ES[kind]} por esta vía. Admite: ${acceptedLabel(channel)}.` };
  if (!rule.mimes.includes(mime.toLowerCase())) {
    return { ok: false, error: `Formato no admitido en ${channelName} (${mime || "desconocido"}) para ${ES[kind]}.` };
  }
  if (size <= 0) return { ok: false, error: "El archivo está vacío." };
  if (size > rule.maxBytes) {
    return { ok: false, error: `El archivo pesa ${(size / MB).toFixed(1)} MB y ${channelName} admite hasta ${Math.floor(rule.maxBytes / MB)} MB en ${ES[kind]}.` };
  }
  return { ok: true, kind };
}

export interface StoredMedia {
  type: MediaKind;
  url: string;
  name?: string;
  mime?: string;
}

const KNOWN_TYPES: Record<string, MediaKind> = {
  image: "image", sticker: "image", photo: "image", ig_reel: "video", reel: "video", story_mention: "image", share: "image",
  video: "video", audio: "audio", voice: "audio", file: "document", document: "document",
};

/** Maps a Meta attachment type (sticker, ig_reel, story_mention, file…) to what the chat renders. */
export function normalizeMediaType(type: unknown): MediaKind {
  return KNOWN_TYPES[String(type ?? "").toLowerCase()] ?? "document";
}

/**
 * Normalizes whatever was stored in messages.media (older rows hold
 * {type} objects without a URL, newer ones arrays of {type,url}).
 */
export function parseMedia(raw: unknown): StoredMedia[] {
  const list = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? [raw] : [];
  const out: StoredMedia[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const url = typeof o.url === "string" && /^https?:\/\//.test(o.url) ? o.url : null;
    if (!url) continue;
    const type = normalizeMediaType(o.type);
    out.push({
      type,
      url,
      name: typeof o.name === "string" ? o.name : undefined,
      mime: typeof o.mime === "string" ? o.mime : undefined,
    });
  }
  return out;
}

/** Text shown when a message is only media (and the body is just a placeholder). */
export function isPlaceholderBody(body: string): boolean {
  return /^\[[^\]]+\]$/.test(body.trim());
}

export function extensionFor(mime: string, fileName?: string): string {
  const fromName = fileName?.match(/\.([a-z0-9]{1,6})$/i)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  const map: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
    "video/mp4": "mp4", "video/quicktime": "mov", "video/3gpp": "3gp",
    "audio/aac": "aac", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/ogg": "ogg", "audio/amr": "amr", "audio/wav": "wav",
    "application/pdf": "pdf", "text/plain": "txt",
  };
  return map[mime.toLowerCase()] ?? "bin";
}

/** Storage keys always start with the organization id so tenants can never reference each other's files. */
export function belongsToOrganization(path: string, organizationId: string): boolean {
  return path.startsWith(`${organizationId}/`) && !path.includes("..") && !path.includes("//");
}
