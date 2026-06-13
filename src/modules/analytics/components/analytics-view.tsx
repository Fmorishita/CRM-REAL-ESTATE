import { Banknote, Building2, Target, TrendingUp, UserCheck, UserPlus, Workflow, CalendarClock } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/format";
import { BarList, Donut, Funnel } from "@/modules/analytics/components/charts";
import type { AnalyticsData } from "@/modules/analytics/types";

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const n = (v: number) => formatNumber(v, data.locale);

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="sales">Ventas</TabsTrigger>
        <TabsTrigger value="agents">Agentes</TabsTrigger>
        <TabsTrigger value="properties">Propiedades</TabsTrigger>
        <TabsTrigger value="sources">Fuentes</TabsTrigger>
      </TabsList>

      {/* Overview */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="Leads nuevos (30 d)" value={n(data.kpis.newLeads)} icon={UserPlus} />
          <StatCard label="Tasa de calificación" value={`${data.kpis.qualifiedRate}%`} icon={UserCheck} />
          <StatCard label="Pipeline activo" value={data.kpis.pipelineValueLabel} icon={Banknote} />
          <StatCard label="Forecast ponderado" value={data.kpis.forecastLabel} icon={TrendingUp} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Conversión por etapa" icon={Target}>
            <Funnel items={data.conversionByStage} />
          </ChartCard>
          <ChartCard title="Leads por fuente" icon={UserPlus}>
            <Donut items={data.leadsBySource} />
          </ChartCard>
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="Oportunidades abiertas" value={n(data.kpis.openOpps)} icon={Target} />
          <StatCard label="Comisión estimada" value={data.kpis.commissionsLabel} icon={Banknote} />
          <StatCard label="Visitas" value={n(data.kpis.visitsTotal)} icon={CalendarClock} />
          <StatCard label="Cerrado ganado" value={data.kpis.wonValueLabel} icon={TrendingUp} />
        </div>
      </TabsContent>

      {/* Sales */}
      <TabsContent value="sales" className="space-y-4">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="Pipeline activo" value={data.kpis.pipelineValueLabel} icon={Banknote} />
          <StatCard label="Forecast ponderado" value={data.kpis.forecastLabel} icon={TrendingUp} />
          <StatCard label="Comisión estimada" value={data.kpis.commissionsLabel} icon={Banknote} />
          <StatCard label="Cerrado ganado" value={data.kpis.wonValueLabel} icon={TrendingUp} />
        </div>
        <ChartCard title="Conversión por etapa" icon={Target}>
          <Funnel items={data.conversionByStage} />
        </ChartCard>
        <ChartCard title="Visitas por estado" icon={CalendarClock}>
          <BarList items={data.visitsByStatus} accent="bg-emerald-500/80" />
        </ChartCard>
      </TabsContent>

      {/* Agents */}
      <TabsContent value="agents" className="space-y-4">
        <ChartCard title="Oportunidades por agente" icon={UserCheck}>
          <BarList items={data.agents.map((a) => ({ label: a.name, value: a.opps, valueLabel: `${a.opps} · ${a.valueLabel}` }))} />
        </ChartCard>
      </TabsContent>

      {/* Properties */}
      <TabsContent value="properties" className="space-y-4">
        <ChartCard title="Propiedades con más demanda" icon={Building2}>
          <BarList items={data.properties} accent="bg-violet-500/80" />
        </ChartCard>
      </TabsContent>

      {/* Sources */}
      <TabsContent value="sources" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Distribución de fuentes" icon={UserPlus}>
            <Donut items={data.leadsBySource} />
          </ChartCard>
          <ChartCard title="Leads por fuente" icon={UserPlus}>
            <BarList items={data.leadsBySource} accent="bg-sky-500/80" />
          </ChartCard>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Automatizaciones activas" value={n(data.automations.active)} icon={Workflow} />
          <StatCard label="Ejecuciones de automatización" value={n(data.automations.runs)} icon={Workflow} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function ChartCard({ title, icon: Icon, children }: { title: string; icon: typeof Target; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
