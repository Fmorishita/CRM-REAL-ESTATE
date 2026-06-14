import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarClock } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { MODULES } from "@/config/modules";
import { ROUTE_STATUSES } from "@/config/visits";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { planMockRoute, type RouteStop } from "@/lib/integrations/maps";
import { RoutePanel } from "@/modules/visits/components/route-panel";
import { VisitCard } from "@/modules/visits/components/visit-card";
import { VisitFormDialog } from "@/modules/visits/components/visit-form-dialog";
import { VisitsToolbar } from "@/modules/visits/components/visits-toolbar";
import { getVisitFormOptions, listVisits } from "@/modules/visits/server/queries";

export const metadata: Metadata = { title: MODULES.visits.label };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function VisitsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const ctx = await getTenantContext();

  const date = pick(params, "date") ?? todayStr();
  const agentId = pick(params, "agent");

  const [visits, options] = await Promise.all([
    listVisits(ctx, { date, agentId }),
    getVisitFormOptions(ctx),
  ]);

  const canManage = hasPermission(ctx, "visits.manage");

  const routeVisits = visits.filter((v) => (ROUTE_STATUSES as readonly string[]).includes(v.status));
  const stops: RouteStop[] = routeVisits.map((v) => ({
    id: v.id,
    label: `${v.timeLabel} · ${v.contactName} — ${v.propertyTitle}`,
    lat: v.lat,
    lng: v.lng,
    query: v.locationLabel,
  }));
  const route = planMockRoute(stops);

  return (
    <div className="space-y-6">
      <PageHeader
        title={MODULES.visits.label}
        description="Tu agenda de visitas con ruta inteligente para el día en campo."
        actions={
          <div className="flex items-center gap-2">
            {isDemoMode() ? <Badge variant="secondary">Datos demo</Badge> : null}
            {canManage ? <VisitFormDialog options={options} defaultDate={date} /> : null}
          </div>
        }
      />

      <Suspense fallback={null}>
        <VisitsToolbar date={date} members={options.members} />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {visits.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Sin visitas este día"
              description="No hay visitas agendadas para la fecha seleccionada. Agenda una nueva o cambia de día."
            />
          ) : (
            visits.map((visit) => <VisitCard key={visit.id} visit={visit} canManage={canManage} />)
          )}
        </div>
        <div>
          <RoutePanel route={route} />
        </div>
      </div>
    </div>
  );
}
