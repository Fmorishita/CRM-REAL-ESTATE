import "server-only";

import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { getNetworkProvider } from "@/lib/ai/providers";
import { recordAiLog } from "@/lib/ai/logging";
import { isProviderImplemented } from "@/lib/ai/registry";
import { AI_TASKS } from "@/lib/ai/tasks";
import type { AiMessage, AiModelConfig, AiProviderId, AiTaskKey, AiUsage } from "@/lib/ai/types";

export interface ResolvedTaskConfig extends AiModelConfig {
  requiresApproval: boolean;
  enabled: boolean;
}

/** Resolves the provider/model config for a task in this tenant (DB → task defaults). */
export async function resolveTaskConfig(ctx: TenantContext, taskKey: AiTaskKey): Promise<ResolvedTaskConfig> {
  const def = AI_TASKS[taskKey];
  const fallback: ResolvedTaskConfig = {
    provider: def.defaultProvider,
    model: def.defaultModel,
    temperature: def.defaultTemperature,
    requiresApproval: def.requiresApprovalDefault,
    enabled: true,
  };
  if (isDemoMode()) return fallback;
  try {
    const row = await prisma.aiTaskConfig.findUnique({
      where: { organizationId_taskKey: { organizationId: ctx.organization.id, taskKey } },
    });
    if (!row) return fallback;
    return {
      provider: row.provider as AiProviderId,
      model: row.model,
      temperature: row.temperature,
      requiresApproval: row.requiresApproval,
      enabled: row.enabled,
    };
  } catch (error) {
    console.error("resolveTaskConfig failed, using defaults:", error);
    return fallback;
  }
}

export interface RunTaskInput {
  system: string;
  messages: AiMessage[];
  /** Deterministic demo output used when the provider is mock/unavailable. */
  mock: string;
  maxTokens?: number;
  entity?: { type: string; id: string };
}

export interface AiTaskResult {
  text: string;
  provider: AiProviderId;
  model: string;
  usage: AiUsage;
  latencyMs: number;
  mocked: boolean;
}

/**
 * Core orchestration: resolve config, route to the configured provider (or mock
 * when unavailable/unimplemented), execute, and log usage. Never throws — on a
 * provider error it falls back to the deterministic mock so callers always get text.
 */
export async function runTask(
  ctx: TenantContext,
  taskKey: AiTaskKey,
  input: RunTaskInput,
): Promise<AiTaskResult> {
  const config = await resolveTaskConfig(ctx, taskKey);

  const useReal = config.provider !== "mock" && isProviderImplemented(config.provider);
  const provider = useReal ? getNetworkProvider(config.provider) : null;

  if (provider) {
    try {
      const response = await provider.complete({
        system: input.system,
        messages: input.messages,
        config: { provider: config.provider, model: config.model, temperature: config.temperature, maxTokens: input.maxTokens },
      });
      await recordAiLog(ctx, {
        taskKey,
        provider: response.provider,
        model: response.model,
        usage: response.usage,
        latencyMs: response.latencyMs,
        status: "success",
        entity: input.entity,
      });
      return { ...response, mocked: false };
    } catch (error) {
      console.error(`AI task ${taskKey} failed on ${config.provider}, falling back to mock:`, error);
      await recordAiLog(ctx, {
        taskKey,
        provider: config.provider,
        model: config.model,
        usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
        latencyMs: 0,
        status: "error",
        entity: input.entity,
        error: error instanceof Error ? error.message : "unknown",
      });
      // fall through to mock
    }
  }

  // Mock path: deterministic, zero-cost.
  const usage: AiUsage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  await recordAiLog(ctx, {
    taskKey,
    provider: "mock",
    model: "mock-1",
    usage,
    latencyMs: 0,
    status: "success",
    entity: input.entity,
  });
  return { text: input.mock, provider: "mock", model: "mock-1", usage, latencyMs: 0, mocked: true };
}
