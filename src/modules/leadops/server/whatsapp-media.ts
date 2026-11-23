import "server-only";

import type { WhatsAppMediaRef } from "@/lib/leadops/whatsapp-webhook";
import { persistRemoteMedia, type InboundFile } from "@/lib/media/storage";

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION?.trim() || "v23.0"}`;

/**
 * WhatsApp sends only a media id. The id resolves (with the access token) to a
 * short-lived download URL that also needs the token. The file is copied into
 * Storage so the chat keeps it. Returns null if anything fails; the message is
 * still saved with its text placeholder.
 */
export async function persistWhatsAppMedia(organizationId: string, ref: WhatsAppMediaRef): Promise<InboundFile | null> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  if (!token) return null;
  try {
    const meta = await fetch(`${GRAPH}/${ref.id}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!meta.ok) return null;
    const info = (await meta.json()) as { url?: string; mime_type?: string };
    if (!info.url) return null;
    return await persistRemoteMedia(organizationId, {
      url: info.url,
      type: ref.kind,
      headers: { Authorization: `Bearer ${token}` },
      name: ref.filename ?? undefined,
      mime: info.mime_type ?? ref.mime ?? undefined,
    });
  } catch (error) {
    console.error("persistWhatsAppMedia failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
