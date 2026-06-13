import "server-only";

import {
  actionLabel,
  triggerLabel,
  type AutomationAction,
  type AutomationCondition,
  type AutomationTrigger,
} from "@/config/automations";
import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatRelativeTime } from "@/lib/format";
import { demoAutomation, demoAutomationRuns, demoAutomations } from "@/modules/automations/demo";
import type { AutomationRunView, AutomationView } from "@/modules/automations/types";

function toView(
  a: {
    id: string;
    name: string;
    status: string;
    trigger: unknown;
    conditions: unknown;
    actions: unknown;
    templateKey: string | null;
    createdAt: Date;
    _count?: { runs: number };
    runs?: { startedAt: Date }[];
  },
  locale: string,
): AutomationView {
  const trigger = (a.trigger ?? { type: "lead_created" }) as AutomationTrigger;
  const conditions = (a.conditions ?? []) as AutomationCondition[];
  const actions = (a.actions ?? []) as AutomationAction[];
  const lastRun = a.runs?.[0]?.startedAt;
  return {
    id: a.id,
    name: a.name,
    status: a.status as AutomationView["status"],
    trigger,
    triggerLabel: triggerLabel(trigger.type),
    conditions,
    actions,
    templateKey: a.templateKey,
    runCount: a._count?.runs ?? 0,
    lastRunLabel: lastRun ? formatRelativeTime(lastRun, locale) : null,
    createdAtLabel: formatRelativeTime(a.createdAt, locale),
  };
}

export async function listAutomations(ctx: TenantContext): Promise<AutomationView[]> {
  if (isDemoMode()) return demoAutomations();
  try {
    const rows = await prisma.automation.findMany({
      where: { organizationId: ctx.organization.id },
      include: { _count: { select: { runs: true } }, runs: { orderBy: { startedAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => toView(r, ctx.organization.defaultLocale));
  } catch (error) {
    console.error("listAutomations failed, falling back to demo:", error);
    return demoAutomations();
  }
}

export async function getAutomation(ctx: TenantContext, id: string): Promise<AutomationView | null> {
  if (isDemoMode()) return demoAutomation(id);
  try {
    const a = await prisma.automation.findFirst({
      where: { id, organizationId: ctx.organization.id },
      include: { _count: { select: { runs: true } }, runs: { orderBy: { startedAt: "desc" }, take: 1 } },
    });
    if (!a) return null;
    return toView(a, ctx.organization.defaultLocale);
  } catch (error) {
    console.error("getAutomation failed, falling back to demo:", error);
    return demoAutomation(id);
  }
}

export async function listAutomationRuns(ctx: TenantContext, automationId: string): Promise<AutomationRunView[]> {
  if (isDemoMode()) return demoAutomationRuns(automationId);
  try {
    const runs = await prisma.automationRun.findMany({
      where: { organizationId: ctx.organization.id, automationId },
      orderBy: { startedAt: "desc" },
      take: 20,
    });
    return runs.map((r) => ({
      id: r.id,
      status: r.status,
      startedAtLabel: formatRelativeTime(r.startedAt, ctx.organization.defaultLocale),
      steps: ((r.steps ?? []) as { type: string; status: string }[]).map((s) => ({
        type: s.type,
        label: actionLabel(s.type),
        status: s.status,
      })),
      error: r.error,
    }));
  } catch (error) {
    console.error("listAutomationRuns failed, falling back to demo:", error);
    return demoAutomationRuns(automationId);
  }
}
