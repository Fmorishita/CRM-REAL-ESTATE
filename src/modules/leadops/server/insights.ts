import "server-only";

import { prisma } from "@/lib/db/prisma";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v23.0";

interface InsightRow {
  date_start: string;
  ad_id: string;
  ad_name?: string;
  adset_id?: string;
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  account_currency?: string;
  actions?: { action_type: string; value: string }[];
}

/**
 * Pulls daily per-ad delivery and spend from the Marketing API and upserts it
 * into ad_insights_daily, so the CRM can compute cost per lead / qualified lead
 * against its own lead attribution. Read-only on Meta's side.
 */
export async function syncAdInsights(organizationId: string, days = 7): Promise<{ rows: number }> {
  const token = process.env.META_ADS_ACCESS_TOKEN?.trim();
  const account = process.env.META_AD_ACCOUNT_ID?.trim().replace(/^act_/, "");
  if (!token || !account) throw new Error("Insights not configured (META_ADS_ACCESS_TOKEN / META_AD_ACCOUNT_ID).");

  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const params = new URLSearchParams({
    level: "ad",
    time_increment: "1",
    time_range: JSON.stringify({ since: fmt(since), until: fmt(until) }),
    fields: "ad_id,ad_name,adset_id,campaign_id,campaign_name,spend,impressions,reach,clicks,account_currency,actions",
    limit: "500",
  });

  let url: string | null = `https://graph.facebook.com/${GRAPH_VERSION}/act_${account}/insights?${params}`;
  let rows = 0;
  while (url) {
    const res: Response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const json = (await res.json()) as { data?: InsightRow[]; paging?: { next?: string }; error?: { message: string } };
    if (!res.ok || json.error) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
    for (const r of json.data ?? []) {
      const started =
        Number(r.actions?.find((a) => a.action_type === "onsite_conversion.messaging_conversation_started_7d")?.value ?? 0);
      const data = {
        adAccountId: account,
        campaignId: r.campaign_id ?? null,
        campaignName: r.campaign_name ?? null,
        adsetId: r.adset_id ?? null,
        adName: r.ad_name ?? null,
        spend: r.spend ?? "0",
        currency: r.account_currency ?? "MXN",
        impressions: Number(r.impressions ?? 0),
        reach: Number(r.reach ?? 0),
        clicks: Number(r.clicks ?? 0),
        conversationsStarted: started,
        syncedAt: new Date(),
      };
      const date = new Date(`${r.date_start}T00:00:00Z`);
      await prisma.adInsightDaily.upsert({
        where: { organizationId_adId_date: { organizationId, adId: r.ad_id, date } },
        create: { organizationId, adId: r.ad_id, date, ...data },
        update: data,
      });
      // Backfill ad/campaign names onto attributions that only had the ad id.
      await prisma.leadAttribution.updateMany({
        where: { organizationId, adId: r.ad_id, adName: null },
        data: { adName: r.ad_name ?? null, campaignId: r.campaign_id ?? null, campaignName: r.campaign_name ?? null, adsetId: r.adset_id ?? null },
      });
      rows += 1;
    }
    url = json.paging?.next ?? null;
  }
  return { rows };
}
