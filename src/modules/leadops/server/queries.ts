import "server-only";

import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_FACT_KEYS, highestFact, isServiceWindowOpen } from "@/lib/leadops/rules";

export interface LeadRow {
  id: string;
  name: string;
  whatsappName: string | null;
  phone: string | null;
  origin: string;
  adName: string | null;
  adId: string | null;
  facts: string[];
  factsCompleted: number;
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
  lastInboundAt: Date | null;
  createdAt: Date;
}

export interface AdPerformanceRow {
  adId: string;
  adName: string;
  leads: number;
  qualified: number;
  visits: number;
  won: number;
  spend: number | null;
  currency: string;
  costPerLead: number | null;
  costPerQualified: number | null;
  avgFacts: number;
}

export interface LeadOpsData {
  leads: LeadRow[];
  ads: AdPerformanceRow[];
  funnel: number[];
  capi: { sent: number; skipped: number; failed: number };
  totals: { leads: number; fromAds: number; windowOpen: number; attention: number; unassigned: number };
  configured: { webhook: boolean; capi: boolean; insights: boolean };
}

function configured() {
  return {
    webhook: Boolean(process.env.META_APP_SECRET && process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN),
    capi: Boolean(process.env.META_DATASET_ID && process.env.META_CAPI_ACCESS_TOKEN),
    insights: Boolean(process.env.META_ADS_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID),
  };
}

const EMPTY: Omit<LeadOpsData, "configured"> = {
  leads: [],
  ads: [],
  funnel: [0, 0, 0, 0, 0, 0],
  capi: { sent: 0, skipped: 0, failed: 0 },
  totals: { leads: 0, fromAds: 0, windowOpen: 0, attention: 0, unassigned: 0 },
};

export async function getLeadOpsData(ctx: TenantContext, opts: { since?: Date } = {}): Promise<LeadOpsData> {
  if (isDemoMode()) return { ...EMPTY, configured: configured() };
  const organizationId = ctx.organization.id;
  const since = opts.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const contacts = await prisma.contact.findMany({
    where: { organizationId, deletedAt: null, createdAt: { gte: since }, waId: { not: null } },
    include: {
      facts: { select: { key: true } },
      attributions: { where: { isFirstTouch: true }, take: 1 },
      assignedMembership: { include: { user: { select: { name: true } } } },
    },
    orderBy: { lastInboundAt: { sort: "desc", nulls: "last" } },
    take: 500,
  });

  const now = new Date();
  const funnel = [0, 0, 0, 0, 0, 0];
  const leads: LeadRow[] = contacts.map((c) => {
    const keys = c.facts.map((f) => f.key);
    funnel[highestFact(keys)]! += 1;
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
      facts: keys,
      factsCompleted: DEFAULT_FACT_KEYS.filter((k) => keys.includes(k)).length,
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
      lastInboundAt: c.lastInboundAt,
      createdAt: c.createdAt,
    };
  });

  // Per-ad results joined with spend (first-click attribution: one ad per lead).
  const byAd = new Map<string, AdPerformanceRow>();
  for (const c of contacts) {
    const a = c.attributions[0];
    if (!a || a.channel !== "ctwa_ad") continue;
    const key = a.adId ?? `sin-id:${a.headline ?? "anuncio"}`;
    const row =
      byAd.get(key) ??
      { adId: key, adName: a.adName ?? a.headline ?? key, leads: 0, qualified: 0, visits: 0, won: 0, spend: null, currency: ctx.organization.defaultCurrency, costPerLead: null, costPerQualified: null, avgFacts: 0 };
    const keys = c.facts.map((f) => f.key);
    row.leads += 1;
    row.avgFacts += DEFAULT_FACT_KEYS.filter((k) => keys.includes(k)).length;
    if ((c.stars ?? 0) >= 3 || keys.length >= 4) row.qualified += 1;
    if (keys.includes("visit_intent")) row.visits += 1;
    if (c.outcome === "won") row.won += 1;
    byAd.set(key, row);
  }
  const insights = await prisma.adInsightDaily.groupBy({
    by: ["adId", "currency"],
    where: { organizationId, date: { gte: since } },
    _sum: { spend: true },
    _max: { adName: true },
  });
  for (const ins of insights) {
    const row = byAd.get(ins.adId) ?? {
      adId: ins.adId, adName: ins._max.adName ?? ins.adId, leads: 0, qualified: 0, visits: 0, won: 0,
      spend: null, currency: ins.currency, costPerLead: null, costPerQualified: null, avgFacts: 0,
    };
    row.spend = Number(ins._sum.spend ?? 0);
    row.currency = ins.currency;
    if (ins._max.adName) row.adName = ins._max.adName;
    byAd.set(ins.adId, row);
  }
  const ads = [...byAd.values()].map((r) => ({
    ...r,
    avgFacts: r.leads ? r.avgFacts / r.leads : 0,
    costPerLead: r.spend !== null && r.leads ? r.spend / r.leads : null,
    costPerQualified: r.spend !== null && r.qualified ? r.spend / r.qualified : null,
  }));

  const capiRows = await prisma.capiEvent.groupBy({
    by: ["status"],
    where: { organizationId, createdAt: { gte: since } },
    _count: { _all: true },
  });
  const capi = { sent: 0, skipped: 0, failed: 0 };
  for (const r of capiRows) if (r.status in capi) capi[r.status as keyof typeof capi] = r._count._all;

  return {
    leads,
    ads: ads.sort((a, b) => b.leads - a.leads),
    funnel,
    capi,
    totals: {
      leads: leads.length,
      fromAds: leads.filter((l) => l.origin === "ctwa_ad").length,
      windowOpen: leads.filter((l) => l.windowOpen).length,
      attention: leads.filter((l) => l.attention).length,
      unassigned: leads.filter((l) => !l.assignee).length,
    },
    configured: configured(),
  };
}
