import type { Metadata } from "next";
import { CalendarClock, Columns3, Inbox, Sparkles, UserPlus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES } from "@/config/modules";
import { getTenantContext } from "@/lib/auth/session";
import { DEMO_DASHBOARD_METRICS } from "@/lib/demo/dashboard";
import { formatCurrency, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: MODULES.dashboard.label };

export default async function DashboardPage() {
  const ctx = await getTenantContext();
  const { defaultCurrency: currency, defaultLocale: locale, timezone } = ctx.organization;
  const metrics = DEMO_DASHBOARD_METRICS;

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
        actions={<Badge variant="secondary">Datos demo · Fase 3</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Leads nuevos hoy"
          value={formatNumber(metrics.newLeadsToday, locale)}
          icon={UserPlus}
          trend={{ value: `+${metrics.newLeadsTrendPct}%`, direction: "up" }}
          hint="vs. promedio de los últimos 7 días"
        />
        <StatCard
          label="Conversaciones sin responder"
          value={formatNumber(metrics.pendingConversations, locale)}
          icon={Inbox}
          hint="WhatsApp, email y web chat"
        />
        <StatCard
          label="Visitas esta semana"
          value={formatNumber(metrics.visitsThisWeek, locale)}
          icon={CalendarClock}
          hint="3 pendientes de confirmar"
        />
        <StatCard
          label="Pipeline activo"
          value={formatCurrency(metrics.pipelineValue, currency, locale, { notation: "compact" })}
          icon={Columns3}
          hint={`${formatNumber(metrics.openOpportunities, locale)} oportunidades abiertas`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today Command Center</CardTitle>
            <CardDescription>
              Qué hacer hoy: prioridades, próximas mejores acciones y leads en riesgo.
            </CardDescription>
          </CardHeader>
          <EmptyState
            className="mx-6 mb-6 py-10"
            title="Disponible en Fase 3"
            description="Aquí verás tus prioridades del día generadas a partir de tus leads, visitas y conversaciones."
          />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Hallazgos de la IA sobre tus leads, fuentes y propiedades.
            </CardDescription>
          </CardHeader>
          <EmptyState
            className="mx-6 mb-6 py-10"
            title="Disponible en Fase 3"
            description={'Ejemplo: "Tienes 12 leads sin seguimiento en 7 días" o "Los leads de Facebook convierten 28% mejor".'}
          />
        </Card>
      </div>
    </div>
  );
}
