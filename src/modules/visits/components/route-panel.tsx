import { MapPinned, Navigation, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlannedRoute } from "@/lib/integrations/maps";

export function RoutePanel({ route }: { route: PlannedRoute }) {
  if (route.legs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="size-4 text-muted-foreground" />
            Ruta del día
          </CardTitle>
          <CardDescription>Agenda visitas para ver la ruta sugerida.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <MapPinned className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sin visitas activas en la ruta.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasDistances = route.totalDistanceKm > 0;

  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Route className="size-4 text-violet-500" />
          Ruta sugerida
          <Badge variant="secondary">{route.legs.length} paradas</Badge>
        </CardTitle>
        <CardDescription>
          {hasDistances
            ? `${route.totalDistanceKm} km · ~${route.totalDurationMin} min de traslado`
            : "Orden recomendado por horario"}
          {route.estimated ? " · estimado" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <ol className="space-y-1">
          {route.legs.map((leg, i) => (
            <li key={leg.stop.id} className="flex items-start gap-3 rounded-lg px-1 py-1.5">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{leg.stop.label}</p>
                {leg.distanceKm != null ? (
                  <p className="text-xs text-muted-foreground">
                    {leg.distanceKm} km · ~{leg.durationMin} min desde la parada anterior
                  </p>
                ) : i > 0 ? (
                  <p className="text-xs text-muted-foreground">Traslado</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Inicio</p>
                )}
              </div>
            </li>
          ))}
        </ol>
        {route.directionsUrl ? (
          <Button asChild className="mt-3 w-full" variant="outline" size="sm">
            <a href={route.directionsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation />
              Abrir ruta en Google Maps
            </a>
          </Button>
        ) : null}
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Optimización por proximidad (mock). Integración con Google Maps en Fase 19.
        </p>
      </CardContent>
    </Card>
  );
}
