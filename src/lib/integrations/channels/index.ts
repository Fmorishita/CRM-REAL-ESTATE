import "server-only";

import { hasEnv } from "@/lib/integrations/env";
import {
  buildAttachmentRequest,
  buildMessageRequest,
  buildWhatsAppMediaPayload,
  resolvePageToken,
} from "@/lib/social/meta-auth";
import type {
  ChannelAdapter,
  ChannelKind,
  MediaMessage,
  OutboundMessage,
  SendResult,
  TemplateMessage,
} from "@/lib/integrations/channels/types";

/** Mock adapter: pretends to deliver and returns a synthetic external id. */
function createMockAdapter(channel: ChannelKind): ChannelAdapter {
  return {
    channel,
    mode: "mock",
    async send(message: OutboundMessage): Promise<SendResult> {
      void message;
      return { ok: true, externalId: `mock_${channel}_${Date.now()}` };
    },
    async sendTemplate(message: TemplateMessage): Promise<SendResult> {
      void message;
      return { ok: true, externalId: `mock_${channel}_tpl_${Date.now()}` };
    },
    async sendMedia(message: MediaMessage): Promise<SendResult> {
      void message;
      return { ok: true, externalId: `mock_${channel}_media_${Date.now()}` };
    },
  };
}

const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v23.0";

/** Readable error from a Graph API failure body (never includes the token). */
async function graphError(res: Response, prefix: string): Promise<string> {
  const detail = await res.text();
  try {
    const parsed = JSON.parse(detail) as { error?: { message?: string; code?: number; error_data?: { details?: string } } };
    const e = parsed.error;
    if (e) return `${prefix} ${e.code ?? res.status}: ${e.error_data?.details ?? e.message ?? "error"}`.slice(0, 300);
  } catch {
    // not JSON
  }
  return `${prefix} ${res.status}: ${detail.slice(0, 200)}`;
}

async function postWhatsApp(payload: Record<string, unknown>): Promise<SendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token = process.env.WHATSAPP_ACCESS_TOKEN!;
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...payload }),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: await graphError(res, "WhatsApp") };
    const data = (await res.json()) as { messages?: { id: string }[] };
    return { ok: true, externalId: data.messages?.[0]?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "send failed" };
  }
}

/**
 * Live WhatsApp adapter via the Meta WhatsApp Business Cloud API. Activated only
 * when WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN are configured.
 */
function createWhatsAppAdapter(): ChannelAdapter {
  return {
    channel: "whatsapp",
    mode: "live",
    send(message: OutboundMessage): Promise<SendResult> {
      return postWhatsApp({ to: message.to, type: "text", text: { preview_url: false, body: message.body } });
    },
    async sendMedia(message: MediaMessage): Promise<SendResult> {
      const sent = await postWhatsApp(
        buildWhatsAppMediaPayload(message.to, message.kind, message.url, { caption: message.caption, fileName: message.fileName }),
      );
      // WhatsApp audio cannot carry a caption: deliver the text as its own message, and say so if that part fails.
      if (sent.ok && message.kind === "audio" && message.caption) {
        const text = await postWhatsApp({ to: message.to, type: "text", text: { preview_url: false, body: message.caption } });
        if (!text.ok) return { ok: false, externalId: sent.externalId, error: `El audio se envió, pero el texto no: ${text.error}` };
      }
      return sent;
    },
    sendTemplate(message: TemplateMessage): Promise<SendResult> {
      const components = message.bodyParams.length
        ? [{ type: "body", parameters: message.bodyParams.map((text) => ({ type: "text", text })) }]
        : [];
      return postWhatsApp({
        to: message.to,
        type: "template",
        template: { name: message.name, language: { code: message.language }, components },
      });
    },
  };
}

/**
 * Live adapter for Instagram DMs and Facebook Messenger. Sends through the
 * Page's messages edge (/{META_PAGE_ID}/messages) with the page's access token,
 * so it works whether META_PAGE_ACCESS_TOKEN is a page token or a system-user
 * token. `to` is the platform-scoped recipient id of the thread.
 */
function createMetaAdapter(channel: "instagram" | "facebook"): ChannelAdapter {
  return {
    channel,
    mode: "live",
    async send(message: OutboundMessage): Promise<SendResult> {
      const pageId = process.env.META_PAGE_ID?.trim();
      if (!pageId) return { ok: false, error: "Falta META_PAGE_ID para enviar mensajes de Meta." };
      if (!message.to) return { ok: false, error: "La conversación no tiene destinatario de Meta." };
      try {
        const token = await resolvePageToken(process.env.META_PAGE_ACCESS_TOKEN!.trim(), pageId);
        const req = buildMessageRequest(pageId, message.to, message.body);
        const res = await fetch(req.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(req.body),
          cache: "no-store",
        });
        if (!res.ok) return { ok: false, error: await graphError(res, "Meta Graph") };
        const data = (await res.json()) as { message_id?: string };
        return { ok: true, externalId: data.message_id };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "send failed" };
      }
    },
    async sendMedia(message: MediaMessage): Promise<SendResult> {
      const pageId = process.env.META_PAGE_ID?.trim();
      if (!pageId) return { ok: false, error: "Falta META_PAGE_ID para enviar mensajes de Meta." };
      if (!message.to) return { ok: false, error: "La conversación no tiene destinatario de Meta." };
      try {
        const token = await resolvePageToken(process.env.META_PAGE_ACCESS_TOKEN!.trim(), pageId);
        const post = async (url: string, body: unknown) =>
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
            cache: "no-store",
          });
        const req = buildAttachmentRequest(pageId, message.to, message.kind, message.url);
        const res = await post(req.url, req.body);
        if (!res.ok) return { ok: false, error: await graphError(res, "Meta Graph") };
        const data = (await res.json()) as { message_id?: string };
        // Messenger/Instagram attachments carry no caption: send it as a follow-up text.
        if (message.caption) {
          const textReq = buildMessageRequest(pageId, message.to, message.caption);
          const textRes = await post(textReq.url, textReq.body).catch(() => null);
          if (!textRes?.ok) {
            return { ok: false, externalId: data.message_id, error: "El archivo se envió, pero el texto que lo acompaña no." };
          }
        }
        return { ok: true, externalId: data.message_id };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "send failed" };
      }
    },
  };
}

/**
 * Resolves the adapter for a channel. Real providers activate when their
 * credentials are present; otherwise every channel resolves to the mock adapter
 * so the inbox works end-to-end in demo mode.
 */
export function getChannelAdapter(channel: ChannelKind): ChannelAdapter {
  switch (channel) {
    case "whatsapp":
      return hasEnv("WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN")
        ? createWhatsAppAdapter()
        : createMockAdapter(channel);
    case "instagram":
    case "facebook":
      return hasEnv("META_PAGE_ACCESS_TOKEN", "META_PAGE_ID") ? createMetaAdapter(channel) : createMockAdapter(channel);
    default:
      return createMockAdapter(channel);
  }
}
