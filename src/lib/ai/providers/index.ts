import "server-only";

import { anthropicProvider } from "@/lib/ai/providers/anthropic";
import { createOpenAiCompatibleProvider } from "@/lib/ai/providers/openai-compatible";
import type { AiProvider, AiProviderId } from "@/lib/ai/types";

/**
 * Network providers with real adapters. Mock is handled by the router. Several
 * OpenAI-compatible backends share one adapter so you can wire many models —
 * open-source/free (Groq, OpenRouter free tiers, local Ollama) and paid
 * (OpenAI, DeepSeek) — and route each AI task to a different one.
 */
const PROVIDERS: Partial<Record<AiProviderId, AiProvider>> = {
  anthropic: anthropicProvider,
  openai: createOpenAiCompatibleProvider({
    id: "openai",
    defaultBaseUrl: "https://api.openai.com/v1",
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrlEnv: "OPENAI_BASE_URL",
  }),
  openrouter: createOpenAiCompatibleProvider({
    id: "openrouter",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY",
    baseUrlEnv: "OPENROUTER_BASE_URL",
    headers: { "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "", "X-Title": "Realtor Pro CRM" },
  }),
  groq: createOpenAiCompatibleProvider({
    id: "groq",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    baseUrlEnv: "GROQ_BASE_URL",
  }),
  deepseek: createOpenAiCompatibleProvider({
    id: "deepseek",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    baseUrlEnv: "DEEPSEEK_BASE_URL",
  }),
  ollama: createOpenAiCompatibleProvider({
    id: "ollama",
    defaultBaseUrl: "http://localhost:11434/v1",
    apiKeyEnv: "OLLAMA_API_KEY",
    baseUrlEnv: "OLLAMA_BASE_URL",
    keyless: true,
  }),
};

/** Returns a usable network provider, or null when none is configured/available. */
export function getNetworkProvider(id: AiProviderId): AiProvider | null {
  const provider = PROVIDERS[id];
  if (provider && provider.isAvailable()) return provider;
  return null;
}
