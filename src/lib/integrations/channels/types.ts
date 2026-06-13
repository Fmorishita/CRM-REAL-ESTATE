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

export interface ChannelAdapter {
  readonly channel: "whatsapp" | "email" | "instagram" | "facebook" | "webchat";
  readonly mode: "mock" | "live";
  send(message: OutboundMessage): Promise<SendResult>;
}

export type ChannelKind = ChannelAdapter["channel"];
