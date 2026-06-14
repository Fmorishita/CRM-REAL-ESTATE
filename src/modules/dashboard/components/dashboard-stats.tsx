import { CalendarClock, Columns3, Inbox, UserPlus } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DashboardStats } from "@/modules/dashboard/types";

interface Props {
  stats: DashboardStats;
  currency: string;
  locale: string;
}

export function DashboardStatsRow({ stats, currency, locale }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Leads nuevos hoy"
        value={formatNumber(stats.newLeads, locale)}
        icon={UserPlus}
        hint="Contactos creados hoy"
      />
      <StatCard
        label="Conversaciones sin responder"
        value={formatNumber(stats.pendingConversations, locale)}
        icon={Inbox}
        hint="WhatsApp, email y web chat"
      />
      <StatCard
        label="Visitas esta semana"
        value={formatNumber(stats.upcomingVisits, locale)}
        icon={CalendarClock}
        hint="Próximos 7 días"
      />
      <StatCard
        label="Pipeline activo"
        value={formatCurrency(stats.pipelineValue, currency, locale, { notation: "compact" })}
        icon={Columns3}
        hint={`Forecast ${formatCurrency(stats.weightedForecast, currency, locale, { notation: "compact" })}`}
      />
    </div>
  );
}
