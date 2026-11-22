import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Pure helpers for the WhatsApp Cloud API webhook: signature verification and
 * payload normalization. No I/O here, so every rule is unit-testable.
 */

/** Verifies `X-Hub-Signature-256: sha256=<hex>` = HMAC-SHA256(rawBody, appSecret). */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header || !header.startsWith("sha256=") || !appSecret) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const given = header.slice("sha256=".length);
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"));
}

export interface CtwaReferral {
  sourceUrl: string | null;
  sourceId: string | null;
  sourceType: string | null;
  headline: string | null;
  body: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  ctwaClid: string | null;
  raw: Record<string, unknown>;
}

export interface InboundMessageEvent {
  kind: "message";
  phoneNumberId: string;
  messageId: string;
  waId: string | null;
  bsuid: string | null;
  profileName: string | null;
  timestamp: Date;
  type: string;
  text: string;
  referral: CtwaReferral | null;
  raw: Record<string, unknown>;
}

export interface StatusEvent {
  kind: "status";
  phoneNumberId: string;
  messageId: string;
  status: string;
  timestamp: Date;
  errorCode: string | null;
  errorMessage: string | null;
}

export type WhatsAppEvent = InboundMessageEvent | StatusEvent;

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);
const toDate = (ts: unknown): Date => {
  const n = Number(ts);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000) : new Date();
};

/** Human-readable text for any inbound message type. */
function messageText(m: Obj): string {
  const type = str(m.type) ?? "unknown";
  switch (type) {
    case "text":
      return str(obj(m.text).body) ?? "";
    case "button":
      return str(obj(m.button).text) ?? "[botón]";
    case "interactive": {
      const i = obj(m.interactive);
      return str(obj(i.button_reply).title) ?? str(obj(i.list_reply).title) ?? "[respuesta interactiva]";
    }
    case "image":
    case "video":
    case "document":
    case "audio":
    case "sticker":
      return str(obj(m[type]).caption) ?? `[${type}]`;
    case "location":
      return "[ubicación]";
    case "contacts":
      return "[contacto compartido]";
    default:
      return `[${type}]`;
  }
}

function parseReferral(r: unknown): CtwaReferral | null {
  const ref = obj(r);
  if (Object.keys(ref).length === 0) return null;
  return {
    sourceUrl: str(ref.source_url),
    sourceId: str(ref.source_id),
    sourceType: str(ref.source_type),
    headline: str(ref.headline),
    body: str(ref.body),
    mediaType: str(ref.media_type),
    mediaUrl: str(ref.video_url) ?? str(ref.image_url) ?? str(ref.thumbnail_url),
    ctwaClid: str(ref.ctwa_clid),
    raw: ref,
  };
}

/** Flattens a webhook body into messages and delivery statuses. Unknown shapes are skipped. */
export function parseWhatsAppPayload(body: unknown): WhatsAppEvent[] {
  const root = obj(body);
  if (root.object !== "whatsapp_business_account") return [];
  const events: WhatsAppEvent[] = [];

  for (const entry of arr(root.entry)) {
    for (const change of arr(obj(entry).changes)) {
      const c = obj(change);
      if (c.field !== "messages") continue;
      const value = obj(c.value);
      const phoneNumberId = str(obj(value.metadata).phone_number_id);
      if (!phoneNumberId) continue;

      const contacts = arr(value.contacts).map(obj);
      for (const message of arr(value.messages)) {
        const m = obj(message);
        const id = str(m.id);
        if (!id) continue;
        const from = str(m.from);
        const contact =
          contacts.find((ct) => str(ct.wa_id) === from) ?? contacts.find((ct) => str(ct.user_id) !== null) ?? contacts[0] ?? {};
        events.push({
          kind: "message",
          phoneNumberId,
          messageId: id,
          waId: from ?? str(contact.wa_id),
          bsuid: str(contact.user_id) ?? str(m.from_user_id),
          profileName: str(obj(contact.profile).name),
          timestamp: toDate(m.timestamp),
          type: str(m.type) ?? "unknown",
          text: messageText(m),
          referral: parseReferral(m.referral),
          raw: m,
        });
      }

      for (const status of arr(value.statuses)) {
        const s = obj(status);
        const id = str(s.id);
        const st = str(s.status);
        if (!id || !st) continue;
        const err = obj(arr(s.errors)[0]);
        events.push({
          kind: "status",
          phoneNumberId,
          messageId: id,
          status: st,
          timestamp: toDate(s.timestamp),
          errorCode: err.code !== undefined ? String(err.code) : null,
          errorMessage: str(err.title) ?? str(err.message) ?? str(obj(err.error_data).details),
        });
      }
    }
  }
  return events;
}

/** Stable idempotency key per event (Meta can deliver the same event more than once). */
export function eventKey(e: WhatsAppEvent): string {
  return e.kind === "message" ? `msg:${e.messageId}` : `status:${e.messageId}:${e.status}`;
}
