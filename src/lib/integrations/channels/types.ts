import "server-only";

/**
 * Stable interface every messaging channel implements. The inbox only knows this
 * interface; real providers (WhatsApp Business API, Meta Graph, Gmail…) plug in
 * during Phase 19. Without credentials the mock adapter is used so the inbox
 * works end-to-end in demo mode.
 */
export interface OutboundMessage {
  to: string;
  body: string;
  conversationExternalId?: string | null;
}

export interface SendResult {
  ok: boolean;
  externalId?: string;
  error?: string;
}

/** Approved WhatsApp template (the only thing allowed outside the 24h window). */
export interface TemplateMessage {
  to: string;
  name: string;
  language: string;
  /** Values for {{1}}, {{2}}… in the template body, in order. */
  bodyParams: string[];
}

/** Attachment sent by public URL (Meta fetches it). */
export interface MediaMessage {
  to: string;
  kind: "image" | "video" | "audio" | "document";
  url: string;
  fileName?: string;
  /** Shown with the file where the channel supports captions. */
  caption?: string;
}

export interface ChannelAdapter {
  readonly channel: "whatsapp" | "email" | "instagram" | "facebook" | "webchat";
  readonly mode: "mock" | "live";
  send(message: OutboundMessage): Promise<SendResult>;
  /** WhatsApp only. */
  sendTemplate?(message: TemplateMessage): Promise<SendResult>;
  /** WhatsApp, Messenger and Instagram. */
  sendMedia?(message: MediaMessage): Promise<SendResult>;
}

export type ChannelKind = ChannelAdapter["channel"];
