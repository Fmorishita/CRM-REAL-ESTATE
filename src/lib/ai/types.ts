/** AI Orchestrator — provider-agnostic types. */

export type AiProviderId = "mock" | "anthropic" | "openai" | "gemini" | "grok" | "deepseek";

export const AI_TASK_KEYS = [
  "summarize_conversation",
  "suggest_reply",
  "score_lead",
  "recommend_properties",
  "generate_property_description",
  "next_best_action",
] as const;

export type AiTaskKey = (typeof AI_TASK_KEYS)[number];

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiModelConfig {
  provider: AiProviderId;
  model: string;
  temperature: number;
  maxTokens?: number;
}

export interface AiCompletionRequest {
  system?: string;
  messages: AiMessage[];
  config: AiModelConfig;
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface AiResponse {
  text: string;
  provider: AiProviderId;
  model: string;
  usage: AiUsage;
  latencyMs: number;
}

/** Stable interface every AI provider implements. */
export interface AiProvider {
  readonly id: AiProviderId;
  /** Whether this provider is usable in the current environment (credentials present). */
  isAvailable(): boolean;
  complete(request: AiCompletionRequest): Promise<AiResponse>;
}

export interface AiModelInfo {
  provider: AiProviderId;
  /** API model id. */
  id: string;
  label: string;
  /** USD per 1M tokens. */
  inputCostPer1M: number;
  outputCostPer1M: number;
  /** Whether a real adapter is implemented for this provider. */
  implemented: boolean;
}

export interface AiProviderInfo {
  id: AiProviderId;
  label: string;
  implemented: boolean;
  models: AiModelInfo[];
}
