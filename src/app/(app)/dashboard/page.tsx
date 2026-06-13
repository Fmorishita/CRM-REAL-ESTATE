import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { MODULES } from "@/config/modules";
import { getTenantContext } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { AiInsightsCard } from "@/modules/dashboard/components/ai-insights-card";
import { CommandCenterCard } from "@/modules/dashboard/components/command-center-card";
import { ConversationsCard } from "@/modules/dashboard/components/conversations-card";
import { DashboardStatsRow } from "@/modules/dashboard/components/dashboard-stats";
import { HotLeadsCard } from "@/modules/dashboard/components/hot-leads-card";
import { PipelineOverviewCard } from "@/modules/dashboard/components/pipeline-overview-card";
import { PropertyPerformanceCard } from "@/modules/dashboard/components/property-performance-card";
import { UpcomingVisitsCard } from "@/modules/dashboard/components/upcoming-visits-card";
import { getDashboardData } from "@/modules/dashboard/server/queries";

export const metadata: Metadata = { title: MODULES.dashboard.label };

export default async function DashboardPage() {
  const ctx = await getTenantContext();
  const data = await getDashboardData(ctx);
  const { defaultLocale: locale, timezone } = ctx.organization;

  const today = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  }).format(new Date());

  const firstName = ctx.user.name.split(" ")[0] ?? ctx.user.name;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${firstName}`}
        description={`${today} · ${ctx.organization.name}`}
        actions={isDemoMode() ? <Badge variant="secondary">Datos demo</Badge> : null}
      />

      <DashboardStatsRow stats={data.stats} currency={data.currency} locale={locale} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HotLeadsCard leads={data.hotLeads} />
        </div>
        <CommandCenterCard items={data.commandCenter} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PipelineOverviewCard pipeline={data.pipeline} currency={data.currency} locale={locale} />
        <ConversationsCard conversations={data.conversations} />
        <UpcomingVisitsCard visits={data.visits} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertyPerformanceCard properties={data.propertyPerformance} />
        </div>
        <AiInsightsCard insights={data.insights} />
      </div>
    </div>
  );
}
