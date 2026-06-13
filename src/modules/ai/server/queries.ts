import "server-only";

import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { AI_TASK_LIST } from "@/lib/ai/tasks";
import type { AiProviderId } from "@/lib/ai/types";
import type { AiTaskConfigView, AiUsageSummary } from "@/modules/ai/types";

export async function listAiTaskConfigs(ctx: TenantContext): Promise<AiTaskConfigView[]> {
  const defaults = (): AiTaskConfigView[] =>
    AI_TASK_LIST.map((t) => ({
      taskKey: t.key,
      label: t.label,
      description: t.description,
      provider: t.defaultProvider,
      model: t.defaultModel,
      temperature: t.defaultTemperature,
      requiresApproval: t.requiresApprovalDefault,
      enabled: true,
      phase: t.phase,
    }));

  if (isDemoMode()) return defaults();
  try {
    const rows = await prisma.aiTaskConfig.findMany({ where: { organizationId: ctx.organization.id } });
    const byKey = new Map(rows.map((r) => [r.taskKey, r]));
    return AI_TASK_LIST.map((t) => {
      const row = byKey.get(t.key);
      return {
        taskKey: t.key,
        label: t.label,
        description: t.description,
        provider: (row?.provider as AiProviderId) ?? t.defaultProvider,
        model: row?.model ?? t.defaultModel,
        temperature: row?.temperature ?? t.defaultTemperature,
        requiresApproval: row?.requiresApproval ?? t.requiresApprovalDefault,
        enabled: row?.enabled ?? true,
        phase: t.phase,
      };
    });
  } catch (error) {
    console.error("listAiTaskConfigs failed, using defaults:", error);
    return defaults();
  }
}

export async function getAiUsageSummary(ctx: TenantContext): Promise<AiUsageSummary> {
  if (isDemoMode()) {
    return { totalRequests: 0, totalCostUsd: 0, byTask: [] };
  }
  try {
    const grouped = await prisma.aiLog.groupBy({
      by: ["taskKey"],
      where: { organizationId: ctx.organization.id },
      _count: { _all: true },
      _sum: { costUsd: true },
    });
    const byTask = grouped.map((g) => ({
      taskKey: g.taskKey,
      requests: g._count._all,
      costUsd: Number(g._sum.costUsd ?? 0),
    }));
    return {
      totalRequests: byTask.reduce((s, t) => s + t.requests, 0),
      totalCostUsd: byTask.reduce((s, t) => s + t.costUsd, 0),
      byTask,
    };
  } catch (error) {
    console.error("getAiUsageSummary failed:", error);
    return { totalRequests: 0, totalCostUsd: 0, byTask: [] };
  }
}
