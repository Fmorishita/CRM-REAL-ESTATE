import "server-only";

import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import type { AiProviderId, AiTaskKey, AiUsage } from "@/lib/ai/types";

/** Persists a usage record. Never throws — logging must not break the task. */
export async function recordAiLog(
  ctx: TenantContext,
  input: {
    taskKey: AiTaskKey;
    provider: AiProviderId;
    model: string;
    usage: AiUsage;
    latencyMs: number;
    status: "success" | "error";
    entity?: { type: string; id: string };
    error?: string;
  },
): Promise<void> {
  if (isDemoMode()) return;
  try {
    await prisma.aiLog.create({
      data: {
        organizationId: ctx.organization.id,
        taskKey: input.taskKey,
        provider: input.provider,
        model: input.model,
        membershipId: ctx.membership.id,
        entityType: input.entity?.type,
        entityId: input.entity?.id,
        inputTokens: input.usage.inputTokens,
        outputTokens: input.usage.outputTokens,
        costUsd: input.usage.costUsd,
        latencyMs: input.latencyMs,
        status: input.status,
        error: input.error,
      },
    });
  } catch (error) {
    console.error("recordAiLog failed:", error);
  }
}
