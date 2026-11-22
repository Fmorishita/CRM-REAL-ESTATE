/**
 * Pure parser for Messenger (object "page") and Instagram Direct (object
 * "instagram") webhooks. Both use the Messenger Platform shape:
 * entry[].messaging[] with sender/recipient ids, message {mid, text,
 * attachments, is_echo, app_id} and an optional ad referral.
 * No I/O here, so every rule is unit-tested.
 */

export type SocialNetwork = "facebook" | "instagram";

export interface SocialReferral {
  adId: string | null;
  source: string | null;
  headline: string | null;
  raw: Record<string, unknown>;
}

export interface SocialMessageEvent {
  kind: "social_message";
  network: SocialNetwork;
  /** Page id (Messenger) or Instagram professional account id. */
  accountId: string;
  /** Customer's page-scoped id (PSID) or Instagram-scoped id (IGSID). */
  userId: string;
  messageId: string;
  timestamp: Date;
  text: string;
  media: { type: string; url: string | null }[];
  /** Sent by the business (Meta inbox, phone app or this CRM through the API). */
  isEcho: boolean;
  /** App that sent an echo; equals our app id when the CRM sent it. */
  appId: string | null;
  referral: SocialReferral | null;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : typeof v === "number" ? String(v) : null;

const MEDIA_LABELS: Record<string, string> = {
  image: "[imagen]",
  video: "[video]",
  audio: "[nota de voz]",
  file: "[archivo]",
  sticker: "[sticker]",
  share: "[publicación compartida]",
  story_mention: "[te mencionó en una historia]",
  ig_reel: "[reel]",
  reel: "[reel]",
};

function parseReferral(r: unknown): SocialReferral | null {
  const ref = obj(r);
  if (Object.keys(ref).length === 0) return null;
  const ads = obj(ref.ads_context_data);
  return {
    adId: str(ref.ad_id),
    source: str(ref.source),
    headline: str(ads.ad_title) ?? str(ref.ref),
    raw: ref,
  };
}

export function parseMetaMessagingPayload(body: unknown): SocialMessageEvent[] {
  const root = obj(body);
  const network: SocialNetwork | null = root.object === "page" ? "facebook" : root.object === "instagram" ? "instagram" : null;
  if (!network) return [];
  const events: SocialMessageEvent[] = [];

  for (const entry of arr(root.entry)) {
    const e = obj(entry);
    const accountId = str(e.id);
    if (!accountId) continue;
    for (const item of arr(e.messaging)) {
      const m = obj(item);
      const message = obj(m.message);
      const mid = str(message.mid);
      if (!mid) continue; // reads, deliveries, reactions… are not messages
      if (message.is_deleted === true) continue;
      const isEcho = message.is_echo === true;
      const sender = str(obj(m.sender).id);
      const recipient = str(obj(m.recipient).id);
      // The customer is the recipient of an echo and the sender of anything else.
      const userId = isEcho ? recipient : sender;
      if (!userId || userId === accountId) continue;

      const media = arr(message.attachments).map((a) => {
        const at = obj(a);
        return { type: str(at.type) ?? "file", url: str(obj(at.payload).url) };
      });
      const text =
        str(message.text) ??
        (media.length ? media.map((x) => MEDIA_LABELS[x.type] ?? `[${x.type}]`).join(" ") : "[mensaje]");
      const ts = Number(m.timestamp);

      events.push({
        kind: "social_message",
        network,
        accountId,
        userId,
        messageId: mid,
        timestamp: Number.isFinite(ts) && ts > 0 ? new Date(ts) : new Date(),
        text,
        media,
        isEcho,
        appId: str(message.app_id),
        referral: parseReferral(message.referral ?? m.referral),
      });
    }
  }
  return events;
}

export function socialEventKey(e: SocialMessageEvent): string {
  return `${e.network}:${e.messageId}`;
}
