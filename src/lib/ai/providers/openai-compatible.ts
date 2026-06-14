import "server-only";

import { estimateCost } from "@/lib/ai/registry";
import type { AiCompletionRequest, AiProvider, AiProviderId, AiResponse } from "@/lib/ai/types";

/**
 * A single adapter for any OpenAI-compatible Chat Completions API. This is the
 * key to running many models at once: OpenRouter, Groq, DeepSeek, Ollama and
 * OpenAI all speak the same `/chat/completions` shape, so one adapter unlocks
 * dozens of open-source (free) and paid models, each selectable per task. Each
 * backend activates only when its API key (or base URL, for keyless Ollama) is
 * configured; otherwise the router falls back to the mock provider.
 */
export interface OpenAiCompatibleConfig {
  id: AiProviderId;
  defaultBaseUrl: string;
  /** Env var holding the API key. */
  apiKeyEnv: string;
  /** Env var overriding the base URL (self-hosted / proxy). */
  baseUrlEnv: string;
  /** Backends like Ollama need no key; availability keys off the base URL. */
  keyless?: boolean;
  /** Extra headers (e.g. OpenRouter attribution). */
  headers?: Record<string, string>;
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export function createOpenAiCompatibleProvider(cfg: OpenAiCompatibleConfig): AiProvider {
  const baseUrl = (): string => (process.env[cfg.baseUrlEnv]?.trim() || cfg.defaultBaseUrl).replace(/\/$/, "");

  return {
    id: cfg.id,

    isAvailable() {
      if (cfg.keyless) return Boolean(process.env[cfg.baseUrlEnv]?.trim());
      return Boolean(process.env[cfg.apiKeyEnv]?.trim());
    },

    async complete(request: AiCompletionRequest): Promise<AiResponse> {
      const started = Date.now();
      const apiKey = process.env[cfg.apiKeyEnv]?.trim();

      const messages = [
        ...(request.system ? [{ role: "system" as const, content: request.system }] : []),
        ...request.messages.map((m) => ({
          role: (m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user") as
            | "system"
            | "user"
            | "assistant",
          content: m.content,
        })),
      ];

      const res = await fetch(`${baseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          ...cfg.headers,
        },
        body: JSON.stringify({
          model: request.config.model,
          messages,
          temperature: request.config.temperature,
          max_tokens: request.config.maxTokens ?? 1024,
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`${cfg.id} API ${res.status}: ${detail.slice(0, 200)}`);
      }

      const data = (await res.json()) as ChatCompletionResponse;
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";
      const inputTokens = data.usage?.prompt_tokens ?? 0;
      const outputTokens = data.usage?.completion_tokens ?? 0;

      return {
        text,
        provider: cfg.id,
        model: request.config.model,
        usage: {
          inputTokens,
          outputTokens,
          costUsd: estimateCost(cfg.id, request.config.model, inputTokens, outputTokens),
        },
        latencyMs: Date.now() - started,
      };
    },
  };
}
