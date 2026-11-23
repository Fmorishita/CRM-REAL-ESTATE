import "server-only";

import { randomUUID } from "node:crypto";

import { extensionFor } from "@/lib/media/rules";

/**
 * Chat media in Supabase Storage (REST over HTTPS, no SDK).
 *
 * One public bucket with unguessable keys (<orgId>/<in|out>/<uuid>.<ext>):
 * Meta must be able to fetch outgoing files by URL, and incoming files are
 * copied here because Meta's attachment links expire within hours.
 * The bucket is created on first use.
 */

export const MEDIA_BUCKET = "chat-media";
const MAX_INBOUND_BYTES = 50 * 1024 * 1024;

function config(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

export function isStorageConfigured(): boolean {
  return config() !== null;
}

const headers = (key: string, extra: Record<string, string> = {}) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  ...extra,
});

let bucketReady = false;

async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  const c = config();
  if (!c) throw new Error("Storage no configurado.");
  const res = await fetch(`${c.url}/storage/v1/bucket`, {
    method: "POST",
    headers: headers(c.key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ id: MEDIA_BUCKET, name: MEDIA_BUCKET, public: true, file_size_limit: MAX_INBOUND_BYTES }),
    cache: "no-store",
  });
  // 200 created, 400/409 already exists.
  if (!res.ok && res.status !== 400 && res.status !== 409) {
    throw new Error(`No se pudo preparar el almacenamiento (${res.status}).`);
  }
  bucketReady = true;
}

export function mediaKey(organizationId: string, direction: "in" | "out", mime: string, fileName?: string): string {
  return `${organizationId}/${direction}/${randomUUID()}.${extensionFor(mime, fileName)}`;
}

export function publicMediaUrl(key: string): string {
  const c = config();
  if (!c) throw new Error("Storage no configurado.");
  return `${c.url}/storage/v1/object/public/${MEDIA_BUCKET}/${key}`;
}

/** Signed URL + token so the browser uploads straight to Storage (no file through Vercel). */
export async function createSignedUpload(key: string): Promise<{ uploadUrl: string; token: string }> {
  const c = config();
  if (!c) throw new Error("Storage no configurado.");
  await ensureBucket();
  const res = await fetch(`${c.url}/storage/v1/object/upload/sign/${MEDIA_BUCKET}/${key}`, {
    method: "POST",
    // No Content-Type / body: Storage answers 400 to a JSON content type with an empty body.
    headers: headers(c.key),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as { url?: string; token?: string } | null;
  if (!res.ok || !json?.url) throw new Error(`No se pudo preparar la subida (${res.status}).`);
  const token = json.token ?? new URL(json.url, c.url).searchParams.get("token") ?? "";
  return { uploadUrl: `${c.url}/storage/v1/object/upload/sign/${MEDIA_BUCKET}/${key}?token=${token}`, token };
}

export async function uploadBuffer(key: string, data: ArrayBuffer | Uint8Array, contentType: string): Promise<string> {
  const c = config();
  if (!c) throw new Error("Storage no configurado.");
  await ensureBucket();
  const res = await fetch(`${c.url}/storage/v1/object/${MEDIA_BUCKET}/${key}`, {
    method: "POST",
    headers: headers(c.key, { "Content-Type": contentType, "x-upsert": "true" }),
    body: data as BodyInit,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`No se pudo guardar el archivo (${res.status}).`);
  return publicMediaUrl(key);
}

/** True when the object exists (used to confirm a browser upload finished). */
export async function objectExists(key: string): Promise<boolean> {
  try {
    const res = await fetch(publicMediaUrl(key), { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export interface InboundFile {
  type: "image" | "video" | "audio" | "document";
  url: string;
  mime?: string;
  name?: string;
}

/**
 * Copies a remote attachment into Storage. Returns the stored copy, or null when
 * it cannot be downloaded (the caller keeps the original, temporary link).
 */
export async function persistRemoteMedia(
  organizationId: string,
  source: { url: string; type: InboundFile["type"]; headers?: Record<string, string>; name?: string; mime?: string },
): Promise<InboundFile | null> {
  if (!isStorageConfigured()) return null;
  try {
    const res = await fetch(source.url, { headers: source.headers, cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_INBOUND_BYTES) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > MAX_INBOUND_BYTES) return null;
    const mime = (source.mime ?? res.headers.get("content-type") ?? "application/octet-stream").split(";")[0]!.trim();
    const key = mediaKey(organizationId, "in", mime, source.name);
    const url = await uploadBuffer(key, buf, mime);
    return { type: source.type, url, mime, name: source.name };
  } catch (error) {
    console.error("persistRemoteMedia failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
