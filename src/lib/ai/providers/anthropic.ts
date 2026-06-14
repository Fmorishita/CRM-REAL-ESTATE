import "server-only";

import type Anthropic from "@anthropic-ai/sdk";

import { estimateCost } from "@/lib/ai/registry";
import type { AiCompletionRequest, AiProvider, AiResponse } from "@/lib/ai/types";

// Models that reject sampling parameters (temperature/top_p/top_k → 400).
const NO_TEMPERATURE = /^claude-(opus-4-8|opus-4-7|fable)/;

// The SDK is loaded lazily so it is code-split out of the server bundle and only
// pulled in when a real Anthropic completion runs (never in mock/demo mode),
// keeping serverless cold starts light.
let clientPromise: Promise<Anthropic> | null = null;
function getClient(): Promise<Anthropic> {
  if (!clientPromise) {
    clientPromise = import("@anthropic-ai/sdk").then((m) => new m.default());
  }
  return clientPromise;
}

export const anthropicProvider: AiProvider = {
  id: "anthropic",

  isAvailable() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },

  async complete(request: AiCompletionRequest): Promise<AiResponse> {
    const { config, system, messages } = request;
    const started = Date.now();

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: config.model,
      max_tokens: config.maxTokens ?? 1024,
      system,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    };
    // Sampling params are removed on the latest Opus/Fable models.
    if (!NO_TEMPERATURE.test(config.model)) {
      params.temperature = config.temperature;
    }

    const response = await (await getClient()).messages.create(params);
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    return {
      text,
      provider: "anthropic",
      model: config.model,
      usage: {
        inputTokens,
        outputTokens,
        costUsd: estimateCost("anthropic", config.model, inputTokens, outputTokens),
      },
      latencyMs: Date.now() - started,
    };
  },
};
