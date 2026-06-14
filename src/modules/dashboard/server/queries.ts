import "server-only";

import { prisma } from "@/lib/db/prisma";
import { isDemoMode } from "@/lib/db";
import type { TenantContext } from "@/lib/auth/types";
import { formatCurrency, formatDayMonth, formatRelativeTime, formatTime } from "@/lib/format";
import { demoDashboardData } from "@/modules/dashboard/demo";
import { buildInsights, contactTypeLabel } from "@/modules/dashboard/insights";
import type {
  CommandItem,
  DashboardData,
  HotLead,
  PendingConversation,
  PipelineOverview,
  PropertyInterest,
  UpcomingVisit,
} from "@/modules/dashboard/types";

const PENDING_STATUSES = ["new", "open", "needs_attention", "waiting_customer"] as const;
const ACTIVE_VISIT_STATUSES = ["pending", "confirmed", "en_route", "rescheduled"] as const;

export async function getDashboardData(ctx: TenantContext): Promise<DashboardData> {
  if (isDemoMode()) return demoDashboardData(ctx);
  try {
    return await queryDashboard(ctx);
  } catch (error) {
    console.error("getDashboardData failed, falling back to demo data:", error);
    return demoDashboardData(ctx);
  }
}

async function queryDashboard(ctx: TenantContext): Promise<DashboardData> {
  const organizationId = ctx.organization.id;
  const { defaultCurrency: currency, defaultLocale: locale, timezone } = ctx.organization;
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const weekAhead = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });

  const [
    newLeads,
    pendingConversations,
    upcomingVisitsCount,
    openOpps,
    stages,
    hotContacts,
    pendingConvs,
    visits,
    overdueTasks,
    todayTasks,
    staleLeadsCount,
    properties,
    needsAttentionCount,
    topLeadSource,
  ] = await Promise.all([
    prisma.contact.count({ where: { organizationId, deletedAt: null, createdAt: { gte: startOfToday } } }),
    prisma.conversation.count({ where: { organizationId, status: { in: [...PENDING_STATUSES] } } }),
    prisma.visit.count({
      where: { organizationId, scheduledAt: { gte: now, lte: weekAhead }, status: { in: [...ACTIVE_VISIT_STATUSES] } },
    }),
    prisma.opportunity.findMany({
      where: { organizationId, stage: { isWon: false, isLost: false } },
      select: { amount: true, probability: true, stageId: true },
    }),
    prisma.pipelineStage.findMany({
      where: { pipeline: { organizationId, isDefault: true } },
      orderBy: { position: "asc" },
      select: { id: true, name: true, isWon: true, isLost: true },
    }),
    prisma.contact.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { score: "desc" },
      take: 5,
      include: { preference: true, opportunities: { take: 1, orderBy: { updatedAt: "desc" } } },
    }),
    prisma.conversation.findMany({
      where: { organizationId, status: { in: [...PENDING_STATUSES] } },
      orderBy: [{ priority: "desc" }, { lastMessageAt: "desc" }],
      take: 6,
      include: { contact: true, channelAccount: true, messages: { take: 1, orderBy: { sentAt: "desc" } } },
    }),
    prisma.visit.findMany({
      where: { organizationId, scheduledAt: { gte: now }, status: { in: [...ACTIVE_VISIT_STATUSES] } },
      orderBy: { scheduledAt: "asc" },
      take: 6,
      include: { contact: true, property: true },
    }),
    prisma.task.findMany({
      where: { organizationId, completedAt: null, dueAt: { lt: startOfToday } },
      orderBy: { dueAt: "asc" },
      take: 4,
    }),
    prisma.task.findMany({
      where: { organizationId, completedAt: null, dueAt: { gte: startOfToday, lte: now } },
      orderBy: { dueAt: "asc" },
      take: 4,
    }),
    prisma.contact.count({
      where: {
        organizationId,
        deletedAt: null,
        OR: [{ lastContactAt: null }, { lastContactAt: { lt: sevenDaysAgo } }],
      },
    }),
    prisma.property.findMany({
      where: { organizationId, deletedAt: null },
      take: 8,
      include: { _count: { select: { contacts: true, views: true } } },
    }),
    prisma.conversation.count({ where: { organizationId, status: "needs_attention" } }),
    prisma.contact.groupBy({
      by: ["leadSourceId"],
      where: { organizationId, deletedAt: null, leadSourceId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { leadSourceId: "desc" } },
      take: 1,
    }),
  ]);

  // Pipeline aggregation in JS (weighted forecast needs amount * probability).
  const byStage = new Map<string, { count: number; value: number }>();
  let totalValue = 0;
  let weightedForecast = 0;
  for (const opp of openOpps) {
    const amount = Number(opp.amount);
    totalValue += amount;
    weightedForecast += (amount * opp.probability) / 100;
    const entry = byStage.get(opp.stageId) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += amount;
    byStage.set(opp.stageId, entry);
  }
  const pipeline: PipelineOverview = {
    stages: stages
      .filter((s) => !s.isWon && !s.isLost)
      .map((s) => ({ id: s.id, name: s.name, count: byStage.get(s.id)?.count ?? 0, value: byStage.get(s.id)?.value ?? 0 })),
    totalValue,
    weightedForecast,
    openCount: openOpps.length,
  };

  const hotLeads: HotLead[] = hotContacts.map((c) => {
    const pref = c.preference;
    const min = pref?.budgetMin != null ? Number(pref.budgetMin) : null;
    const max = pref?.budgetMax != null ? Number(pref.budgetMax) : null;
    let budgetLabel: string | null = null;
    if (min != null && max != null) budgetLabel = `${cur(min)} – ${cur(max)}`;
    else if (max != null) budgetLabel = `Hasta ${cur(max)}`;
    return {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      type: contactTypeLabel(c.type),
      score: c.score,
      budgetLabel,
      zone: pref?.zones[0] ?? null,
      lastContactLabel: c.lastContactAt ? formatRelativeTime(c.lastContactAt, locale) : null,
      recommendedAction:
        c.opportunities[0]?.aiNextAction ?? "Dar seguimiento y enviar propiedades recomendadas",
    };
  });

  const conversations: PendingConversation[] = pendingConvs.map((conv) => ({
    id: conv.id,
    contactName: conv.contact ? `${conv.contact.firstName} ${conv.contact.lastName}` : "Sin asignar",
    channel: conv.channelAccount.channel,
    status: conv.status,
    snippet: conv.messages[0]?.body ?? conv.aiSummary ?? "",
    lastMessageLabel: conv.lastMessageAt ? formatRelativeTime(conv.lastMessageAt, locale) : null,
    unreadCount: conv.unreadCount,
    priority: conv.priority,
  }));

  const upcomingVisits: UpcomingVisit[] = visits.map((v) => {
    const locationParts = [v.property.zone, v.property.city].filter(Boolean) as string[];
    return {
      id: v.id,
      contactName: `${v.contact.firstName} ${v.contact.lastName}`,
      propertyTitle: v.property.title,
      dayLabel: formatDayMonth(v.scheduledAt, locale, timezone),
      timeLabel: formatTime(v.scheduledAt, locale, timezone),
      status: v.status,
      locationLabel: locationParts.length ? locationParts.join(", ") : null,
      mapsQuery:
        v.property.lat != null && v.property.lng != null
          ? `${v.property.lat},${v.property.lng}`
          : [v.property.title, ...locationParts].join(" ") || null,
    };
  });

  const commandCenter: CommandItem[] = [
    ...overdueTasks.map<CommandItem>((t) => ({
      id: `task-${t.id}`,
      kind: "overdue_task",
      title: t.title,
      hint: "Tarea vencida",
      priority: "high",
      href: "/visits",
    })),
    ...todayTasks.map<CommandItem>((t) => ({
      id: `task-${t.id}`,
      kind: "today_task",
      title: t.title,
      hint: "Vence hoy",
      priority: t.priority === "high" ? "high" : "medium",
      href: "/visits",
    })),
  ];
  if (staleLeadsCount > 0) {
    commandCenter.push({
      id: "stale-leads",
      kind: "stale_leads",
      title: `${staleLeadsCount} leads sin seguimiento en más de 7 días`,
      hint: "Recontactar para no perderlos",
      priority: "medium",
      href: "/contacts",
    });
  }

  const propertyPerformance: PropertyInterest[] = properties
    .map<PropertyInterest>((p) => ({
      id: p.id,
      title: p.title,
      type: p.propertyType,
      status: p.status,
      priceLabel: cur(Number(p.price)),
      interest: p._count.contacts + p._count.views,
    }))
    .sort((a, b) => b.interest - a.interest)
    .slice(0, 5);

  const insights = buildInsights({
    staleLeadsCount,
    needsAttentionCount,
    overdueCount: overdueTasks.length,
    weightedForecast,
    forecastLabel: cur(weightedForecast),
    topSourceCount: topLeadSource[0]?._count._all ?? 0,
  });

  return {
    currency,
    locale,
    timezone,
    stats: {
      newLeads,
      pendingConversations,
      upcomingVisits: upcomingVisitsCount,
      pipelineValue: totalValue,
      weightedForecast,
    },
    commandCenter: commandCenter.slice(0, 6),
    hotLeads,
    pipeline,
    conversations,
    visits: upcomingVisits,
    propertyPerformance,
    insights,
  };
}
