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
    implemented: true,
    models: [
      { provider: "openai", id: "gpt-5", label: "GPT-5", inputCostPer1M: 5, outputCostPer1M: 15, implemented: true },
      { provider: "openai", id: "gpt-5-mini", label: "GPT-5 mini", inputCostPer1M: 0.5, outputCostPer1M: 1.5, implemented: true },
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
    implemented: true,
    models: [
      { provider: "deepseek", id: "deepseek-chat", label: "DeepSeek V3 (chat)", inputCostPer1M: 0.27, outputCostPer1M: 1.1, implemented: true },
      { provider: "deepseek", id: "deepseek-reasoner", label: "DeepSeek R1 (reasoner)", inputCostPer1M: 0.55, outputCostPer1M: 2.19, implemented: true },
    ],
  },
  {
    // Free, very fast hosting of open-source models. Great default for cheap tasks.
    id: "groq",
    label: "Groq (open source, gratis)",
    implemented: true,
    models: [
      { provider: "groq", id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", inputCostPer1M: 0, outputCostPer1M: 0, implemented: true },
      { provider: "groq", id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (instant)", inputCostPer1M: 0, outputCostPer1M: 0, implemented: true },
      { provider: "groq", id: "qwen-2.5-32b", label: "Qwen 2.5 32B", inputCostPer1M: 0, outputCostPer1M: 0, implemented: true },
    ],
  },
  {
    // One key, hundreds of models (many `:free`) — paid and open source.
    id: "openrouter",
    label: "OpenRouter (multi-modelo)",
    implemented: true,
    models: [
      { provider: "openrouter", id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (free)", inputCostPer1M: 0, outputCostPer1M: 0, implemented: true },
      { provider: "openrouter", id: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B", inputCostPer1M: 0.4, outputCostPer1M: 0.4, implemented: true },
      { provider: "openrouter", id: "deepseek/deepseek-chat", label: "DeepSeek V3 (via OpenRouter)", inputCostPer1M: 0.27, outputCostPer1M: 1.1, implemented: true },
    ],
  },
  {
    // Local / self-hosted models. Fully free and private; set OLLAMA_BASE_URL.
    id: "ollama",
    label: "Ollama (local, gratis)",
    implemented: true,
    models: [
      { provider: "ollama", id: "llama3.1", label: "Llama 3.1 (local)", inputCostPer1M: 0, outputCostPer1M: 0, implemented: true },
      { provider: "ollama", id: "qwen2.5", label: "Qwen 2.5 (local)", inputCostPer1M: 0, outputCostPer1M: 0, implemented: true },
    ],
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
