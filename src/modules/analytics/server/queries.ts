import "server-only";

import { visitStatusLabel } from "@/config/visits";
import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/format";
import { demoAnalytics } from "@/modules/analytics/demo";
import type { AnalyticsData } from "@/modules/analytics/types";

const QUALIFIED_PLUS = ["qualified", "searching", "visit_scheduled", "visit_done", "negotiation", "documentation", "closing", "won"];

export async function getAnalytics(ctx: TenantContext): Promise<AnalyticsData> {
  if (isDemoMode()) return demoAnalytics(ctx);
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });
  const organizationId = ctx.organization.id;
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  try {
    const [
      newLeads,
      totalContacts,
      qualifiedContacts,
      opps,
      stages,
      leadSources,
      leadsBySourceRaw,
      members,
      aggByAgent,
      properties,
      visitsByStatusRaw,
      activeAutomations,
      totalRuns,
    ] = await Promise.all([
      prisma.contact.count({ where: { organizationId, deletedAt: null, createdAt: { gte: since } } }),
      prisma.contact.count({ where: { organizationId, deletedAt: null } }),
      prisma.contact.count({ where: { organizationId, deletedAt: null, stage: { in: QUALIFIED_PLUS } } }),
      prisma.opportunity.findMany({
        where: { organizationId, deletedAt: null },
        select: { amount: true, commissionAmount: true, probability: true, stageId: true, assignedMembershipId: true, stage: { select: { isWon: true, isLost: true } } },
      }),
      prisma.pipelineStage.findMany({ where: { pipeline: { organizationId, isDefault: true } }, orderBy: { position: "asc" } }),
      prisma.leadSource.findMany({ where: { organizationId } }),
      prisma.contact.groupBy({ by: ["leadSourceId"], where: { organizationId, deletedAt: null, leadSourceId: { not: null } }, _count: { _all: true } }),
      prisma.membership.findMany({ where: { organizationId, status: "active" }, include: { user: true } }),
      prisma.opportunity.groupBy({ by: ["assignedMembershipId"], where: { organizationId, deletedAt: null, assignedMembershipId: { not: null } }, _count: { _all: true }, _sum: { amount: true } }),
      prisma.property.findMany({ where: { organizationId, deletedAt: null }, include: { _count: { select: { contacts: true, views: true } } }, take: 50 }),
      prisma.visit.groupBy({ by: ["status"], where: { organizationId }, _count: { _all: true } }),
      prisma.automation.count({ where: { organizationId, status: "active" } }),
      prisma.automationRun.count({ where: { organizationId } }),
    ]);

    let openOpps = 0;
    let pipelineValue = 0;
    let forecast = 0;
    let wonValue = 0;
    let commissions = 0;
    const stageCount = new Map<string, number>();
    for (const o of opps) {
      const amount = Number(o.amount);
      stageCount.set(o.stageId, (stageCount.get(o.stageId) ?? 0) + 1);
      if (o.stage.isWon) {
        wonValue += amount;
      } else if (!o.stage.isLost) {
        openOpps += 1;
        pipelineValue += amount;
        forecast += (amount * o.probability) / 100;
        commissions += o.commissionAmount != null ? Number(o.commissionAmount) : 0;
      }
    }

    const sourceName = new Map(leadSources.map((s) => [s.id, s.name]));
    const memberName = new Map(members.map((m) => [m.id, m.user.name]));

    return {
      currency,
      locale,
      kpis: {
        newLeads,
        qualifiedRate: totalContacts ? Math.round((qualifiedContacts / totalContacts) * 100) : 0,
        openOpps,
        pipelineValueLabel: cur(pipelineValue),
        forecastLabel: cur(forecast),
        wonValueLabel: cur(wonValue),
        commissionsLabel: cur(commissions),
        visitsTotal: visitsByStatusRaw.reduce((s, v) => s + v._count._all, 0),
      },
      leadsBySource: leadsBySourceRaw
        .map((r) => ({ label: r.leadSourceId ? sourceName.get(r.leadSourceId) ?? "—" : "—", value: r._count._all }))
        .sort((a, b) => b.value - a.value),
      conversionByStage: stages
        .filter((s) => !s.isLost)
        .map((s) => ({ label: s.name, value: stageCount.get(s.id) ?? 0 }))
        .filter((s) => s.value > 0),
      agents: aggByAgent
        .map((a) => ({ name: a.assignedMembershipId ? memberName.get(a.assignedMembershipId) ?? "—" : "—", opps: a._count._all, valueLabel: cur(Number(a._sum.amount ?? 0)) }))
        .sort((a, b) => b.opps - a.opps),
      properties: properties
        .map((p) => ({ label: p.title, value: p._count.contacts + p._count.views }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
      visitsByStatus: visitsByStatusRaw.map((v) => ({ label: visitStatusLabel(v.status), value: v._count._all })),
      automations: { active: activeAutomations, runs: totalRuns },
    };
  } catch (error) {
    console.error("getAnalytics failed, falling back to demo:", error);
    return demoAnalytics(ctx);
  }
}
