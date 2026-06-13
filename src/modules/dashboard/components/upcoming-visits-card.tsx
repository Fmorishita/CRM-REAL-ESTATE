import Link from "next/link";
import { CalendarClock, MapPin, Navigation } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UpcomingVisit } from "@/modules/dashboard/types";

const STATUS_VARIANT: Record<string, "secondary" | "outline"> = {
  pending: "outline",
  confirmed: "secondary",
  en_route: "secondary",
  rescheduled: "outline",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  en_route: "En camino",
  rescheduled: "Reagendada",
};

function mapsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function UpcomingVisitsCard({ visits }: { visits: UpcomingVisit[] }) {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>Próximas visitas</CardTitle>
        <CardDescription>Tu agenda en campo con acceso directo a la ruta.</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/visits">Ver agenda</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <div className="px-2 pb-2">
        {visits.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Sin visitas próximas"
            description="Agenda visitas con tus clientes para verlas aquí con su ruta."
            className="mx-4 mb-2 border-0 bg-transparent py-8"
          />
        ) : (
          <ul className="divide-y divide-border">
            {visits.map((visit) => (
              <li key={visit.id} className="flex items-center gap-3 px-3 py-3">
                <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-border bg-muted/50 px-1 py-1.5 text-center">
                  <span className="text-[11px] font-medium text-muted-foreground">{visit.dayLabel}</span>
                  <span className="text-xs font-semibold text-foreground">{visit.timeLabel}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{visit.contactName}</p>
                    <Badge variant={STATUS_VARIANT[visit.status] ?? "outline"} className="shrink-0">
                      {STATUS_LABELS[visit.status] ?? visit.status}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{visit.propertyTitle}</p>
                  {visit.locationLabel ? (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      {visit.locationLabel}
                    </p>
                  ) : null}
                </div>
                {visit.mapsQuery ? (
                  <Button asChild variant="outline" size="icon-sm" className="shrink-0">
                    <a
                      href={mapsUrl(visit.mapsQuery)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Ver ruta en Google Maps"
                    >
                      <Navigation />
                    </a>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
