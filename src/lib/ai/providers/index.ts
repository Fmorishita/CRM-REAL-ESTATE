import "server-only";

import { anthropicProvider } from "@/lib/ai/providers/anthropic";
import type { AiProvider, AiProviderId } from "@/lib/ai/types";

/** Network providers with real adapters. Mock is handled by the router. */
const PROVIDERS: Partial<Record<AiProviderId, AiProvider>> = {
  anthropic: anthropicProvider,
};

/** Returns a usable network provider, or null when none is configured/available. */
export function getNetworkProvider(id: AiProviderId): AiProvider | null {
  const provider = PROVIDERS[id];
  if (provider && provider.isAvailable()) return provider;
  return null;
}
