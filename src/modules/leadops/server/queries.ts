import "server-only";

import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import {
  QUALIFICATION_QUESTIONS,
  isQualified,
  leadTemperature,
  wantsMeeting,
  type LeadTemperature,
} from "@/lib/leadops/qualification";
import { highestFact, isServiceWindowOpen } from "@/lib/leadops/rules";
import { buildDemoLeadOps } from "@/modules/leadops/demo";

export interface LeadRow {
  id: string;
  name: string;
  whatsappName: string | null;
  phone: string | null;
  origin: string;
  adName: string | null;
  adId: string | null;
  /** key → canonical value ("own_use,investment"). */
  facts: Record<string, string>;
  factsCompleted: number;
  temperature: LeadTemperature;
  qualified: boolean;
  stars: number | null;
  subStage: string | null;
  outcome: string;
  assignee: string | null;
  botEnabled: boolean;
  reactEnabled: boolean;
  windowOpen: boolean;
  attention: boolean;
  blocked: boolean;
  archived: boolean;
  conversationId: string | null;
  lastInboundAt: Date | null;
  createdAt: Date;
}

export interface AdPerformanceRow {
  adId: string;
  adName: string;
  leads: number;
  qualified: number;
  hot: number;
  meetings: number;
  won: number;
  spend: number | null;
  currency: string;
  costPerLead: number | null;
  costPerQualified: number | null;
  avgFacts: number;
}

export interface AnswerDistribution {
  key: string;
  label: string;
  answered: number;
  options: { value: string; label: string; count: number }[];
}

export interface LeadOpsData {
  leads: LeadRow[];
  ads: AdPerformanceRow[];
  funnel: number[];
  answers: AnswerDistribution[];
  capi: { sent: number; skipped: number; failed: number };
  totals: {
    leads: number;
    fromAds: number;
    qualified: number;
    hot: number;
    windowOpen: number;
    attention: number;
    unassigned: number;
    spend: number | null;
    currency: string;
  };
  configured: { webhook: boolean; capi: boolean; insights: boolean; webForm: boolean };
}

function configured() {
  return {
    webhook: Boolean(process.env.META_APP_SECRET && process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN),
    capi: Boolean(process.env.META_DATASET_ID && process.env.META_CAPI_ACCESS_TOKEN),
    insights: Boolean(process.env.META_ADS_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID),
    webForm: Boolean(process.env.WEB_LEADS_SECRET),
  };
}

/** Pure aggregation, shared by the live query and the demo dataset. */
export function aggregateLeadOps(
  leads: LeadRow[],
  spendByAd: { adId: string; adName: string | null; spend: number; currency: string }[],
  capi: LeadOpsData["capi"],
  currency: string,
): Omit<LeadOpsData, "configured"> {
  const funnel = [0, 0, 0, 0, 0, 0];
  const answers: AnswerDistribution[] = QUALIFICATION_QUESTIONS.map((q) => ({
    key: q.key,
    label: q.label,
    answered: 0,
    options: q.options.map((o) => ({ value: o.value, label: o.label, count: 0 })),
  }));
  for (const l of leads) {
    funnel[highestFact(Object.keys(l.facts))]! += 1;
    for (const a of answers) {
      const v = l.facts[a.key];
      if (!v) continue;
      a.answered += 1;
      for (const part of v.split(",")) {
        const o = a.options.find((x) => x.value === part);
        if (o) o.count += 1;
      }
    }
  }

  // Per-ad results (first-click attribution: one ad per lead) joined with spend.
  const byAd = new Map<string, AdPerformanceRow>();
  const empty = (adId: string, adName: string): AdPerformanceRow => ({
    adId, adName, leads: 0, qualified: 0, hot: 0, meetings: 0, won: 0,
    spend: null, currency, costPerLead: null, costPerQualified: null, avgFacts: 0,
  });
  for (const l of leads) {
    if (l.origin !== "ctwa_ad") continue;
    const key = l.adId ?? `sin-id:${l.adName ?? "anuncio"}`;
    const row = byAd.get(key) ?? empty(key, l.adName ?? key);
    row.leads += 1;
    row.avgFacts += l.factsCompleted;
    if (l.qualified) row.qualified += 1;
    if (l.temperature === "hot") row.hot += 1;
    if (wantsMeeting(l.facts)) row.meetings += 1;
    if (l.outcome === "won") row.won += 1;
    byAd.set(key, row);
  }
  let totalSpend: number | null = null;
  for (const ins of spendByAd) {
    const row = byAd.get(ins.adId) ?? empty(ins.adId, ins.adName ?? ins.adId);
    row.spend = ins.spend;
    row.currency = ins.currency;
    if (ins.adName) row.adName = ins.adName;
    byAd.set(ins.adId, row);
    totalSpend = (totalSpend ?? 0) + ins.spend;
  }
  const ads = [...byAd.values()]
    .map((r) => ({
      ...r,
      avgFacts: r.leads ? r.avgFacts / r.leads : 0,
      costPerLead: r.spend !== null && r.leads ? r.spend / r.leads : null,
      costPerQualified: r.spend !== null && r.qualified ? r.spend / r.qualified : null,
    }))
    .sort((a, b) => b.leads - a.leads || (b.spend ?? 0) - (a.spend ?? 0));

  return {
    leads,
    ads,
    funnel,
    answers,
    capi,
    totals: {
      leads: leads.length,
      fromAds: leads.filter((l) => l.origin === "ctwa_ad").length,
      qualified: leads.filter((l) => l.qualified).length,
      hot: leads.filter((l) => l.temperature === "hot").length,
      windowOpen: leads.filter((l) => l.windowOpen).length,
      attention: leads.filter((l) => l.attention && !l.blocked).length,
      unassigned: leads.filter((l) => !l.assignee).length,
      spend: totalSpend,
      currency: spendByAd[0]?.currency ?? currency,
    },
  };
}

export async function getLeadOpsData(ctx: TenantContext, opts: { since?: Date } = {}): Promise<LeadOpsData> {
  if (isDemoMode()) {
    const demo = buildDemoLeadOps();
    return { ...aggregateLeadOps(demo.leads, demo.spend, demo.capi, "MXN"), configured: configured() };
  }
  const organizationId = ctx.organization.id;
  const since = opts.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const contacts = await prisma.contact.findMany({
    where: {
      organizationId,
      deletedAt: null,
      createdAt: { gte: since },
      OR: [{ waId: { not: null } }, { attributions: { some: { channel: "web_form" } } }],
    },
    include: {
      facts: { select: { key: true, value: true } },
      attributions: { where: { isFirstTouch: true }, take: 1 },
      assignedMembership: { include: { user: { select: { name: true } } } },
      conversations: { select: { id: true }, orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } }, take: 1 },
    },
    orderBy: [{ lastInboundAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take: 500,
  });

  const now = new Date();
  const leads: LeadRow[] = contacts.map((c) => {
    const facts = Object.fromEntries(c.facts.map((f) => [f.key, f.value]));
    const answered = QUALIFICATION_QUESTIONS.filter((q) => facts[q.key]).length;
    const a = c.attributions[0];
    const declared = `${c.firstName} ${c.lastName}`.trim();
    return {
      id: c.id,
      name: declared || c.whatsappName || c.phone || "Sin nombre",
      whatsappName: c.whatsappName,
      phone: c.phone,
      origin: a?.channel ?? "desconocido",
      adName: a?.adName ?? a?.headline ?? null,
      adId: a?.adId ?? null,
      facts,
      factsCompleted: answered,
      temperature: leadTemperature(facts),
      qualified: isQualified({ answered, stars: c.stars }),
      stars: c.stars,
      subStage: c.subStage,
      outcome: c.outcome,
      assignee: c.assignedMembership?.user.name ?? null,
      botEnabled: c.botEnabled,
      reactEnabled: c.reactEnabled,
      windowOpen: isServiceWindowOpen(c.lastInboundAt, now),
      attention: Boolean(c.attentionAt),
      blocked: Boolean(c.blockedAt),
      archived: Boolean(c.archivedAt),
      conversationId: c.conversations[0]?.id ?? null,
      lastInboundAt: c.lastInboundAt,
      createdAt: c.createdAt,
    };
  });

  const [insights, capiRows] = await Promise.all([
    prisma.adInsightDaily.groupBy({
      by: ["adId", "currency"],
      where: { organizationId, date: { gte: since } },
      _sum: { spend: true },
      _max: { adName: true },
    }),
    prisma.capiEvent.groupBy({
      by: ["status"],
      where: { organizationId, createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);
  const capi = { sent: 0, skipped: 0, failed: 0 };
  for (const r of capiRows) if (r.status in capi) capi[r.status as keyof typeof capi] = r._count._all;

  return {
    ...aggregateLeadOps(
      leads,
      insights.map((i) => ({ adId: i.adId, adName: i._max.adName, spend: Number(i._sum.spend ?? 0), currency: i.currency })),
      capi,
      ctx.organization.defaultCurrency,
    ),
    configured: configured(),
  };
}
