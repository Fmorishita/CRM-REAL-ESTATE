import "server-only";

import type { ChannelAdapter, ChannelKind, OutboundMessage, SendResult } from "@/lib/integrations/channels/types";

/** Mock adapter: pretends to deliver and returns a synthetic external id. */
function createMockAdapter(channel: ChannelKind): ChannelAdapter {
  return {
    channel,
    mode: "mock",
    async send(message: OutboundMessage): Promise<SendResult> {
      void message;
      return { ok: true, externalId: `mock_${channel}_${Date.now()}` };
    },
  };
}

/**
 * Resolves the adapter for a channel. Real providers are wired in Phase 19 by
 * checking for their credentials in the environment; until then every channel
 * resolves to the mock adapter.
 */
export function getChannelAdapter(channel: ChannelKind): ChannelAdapter {
  switch (channel) {
    // case "whatsapp":
    //   if (process.env.WHATSAPP_ACCESS_TOKEN) return createWhatsAppAdapter();
    //   return createMockAdapter(channel);
    default:
      return createMockAdapter(channel);
  }
}
