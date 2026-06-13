import type { AiModelInfo, AiProviderId, AiProviderInfo } from "@/lib/ai/types";

/**
 * Model registry with pricing for cost tracking. Mock and Anthropic have real
 * adapters; the rest are listed for selection and become live when their adapter
 * + credentials are added (the router falls back to mock until then).
 */
export const AI_PROVIDERS: AiProviderInfo[] = [
  {
    id: "mock",
    label: "Mock (demo)",
    implemented: true,
    models: [{ provider: "mock", id: "mock-1", label: "Mock 1", inputCostPer1M: 0, outputCostPer1M: 0, implemented: true }],
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    implemented: true,
    models: [
      { provider: "anthropic", id: "claude-opus-4-8", label: "Claude Opus 4.8", inputCostPer1M: 5, outputCostPer1M: 25, implemented: true },
      { provider: "anthropic", id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", inputCostPer1M: 3, outputCostPer1M: 15, implemented: true },
      { provider: "anthropic", id: "claude-haiku-4-5", label: "Claude Haiku 4.5", inputCostPer1M: 1, outputCostPer1M: 5, implemented: true },
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    implemented: false,
    models: [
      { provider: "openai", id: "gpt-5", label: "GPT-5", inputCostPer1M: 5, outputCostPer1M: 15, implemented: false },
      { provider: "openai", id: "gpt-5-mini", label: "GPT-5 mini", inputCostPer1M: 0.5, outputCostPer1M: 1.5, implemented: false },
    ],
  },
  {
    id: "gemini",
    label: "Google Gemini",
    implemented: false,
    models: [{ provider: "gemini", id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", inputCostPer1M: 2.5, outputCostPer1M: 10, implemented: false }],
  },
  {
    id: "grok",
    label: "xAI Grok",
    implemented: false,
    models: [{ provider: "grok", id: "grok-4", label: "Grok 4", inputCostPer1M: 5, outputCostPer1M: 15, implemented: false }],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    implemented: false,
    models: [{ provider: "deepseek", id: "deepseek-v3", label: "DeepSeek V3", inputCostPer1M: 0.3, outputCostPer1M: 1.2, implemented: false }],
  },
];

const MODEL_INDEX = new Map<string, AiModelInfo>();
for (const provider of AI_PROVIDERS) {
  for (const model of provider.models) {
    MODEL_INDEX.set(`${provider.id}:${model.id}`, model);
  }
}

export function findModel(provider: AiProviderId, model: string): AiModelInfo | undefined {
  return MODEL_INDEX.get(`${provider}:${model}`);
}

export function isProviderImplemented(provider: AiProviderId): boolean {
  return AI_PROVIDERS.find((p) => p.id === provider)?.implemented ?? false;
}

/** USD cost for a completed request, from the registry pricing. */
export function estimateCost(provider: AiProviderId, model: string, inputTokens: number, outputTokens: number): number {
  const info = findModel(provider, model);
  if (!info) return 0;
  return (inputTokens / 1_000_000) * info.inputCostPer1M + (outputTokens / 1_000_000) * info.outputCostPer1M;
}
