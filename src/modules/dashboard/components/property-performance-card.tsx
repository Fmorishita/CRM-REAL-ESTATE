import Link from "next/link";
import { Building2, Eye } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropertyInterest } from "@/modules/dashboard/types";

const TYPE_LABELS: Record<string, string> = {
  house: "Casa",
  apartment: "Departamento",
  land: "Terreno",
  office: "Oficina",
  retail: "Local",
  warehouse: "Bodega",
  development: "Desarrollo",
  presale: "Preventa",
  vacation_rental: "Renta vacacional",
  rental: "Renta",
};

export function PropertyPerformanceCard({ properties }: { properties: PropertyInterest[] }) {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>Propiedades con más demanda</CardTitle>
        <CardDescription>Tus listings con mayor interés de clientes.</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/properties">Ver propiedades</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <div className="px-2 pb-2">
        {properties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Sin propiedades aún"
            description="Publica propiedades para ver aquí su desempeño y demanda."
            className="mx-4 mb-2 border-0 bg-transparent py-8"
          />
        ) : (
          <ul className="divide-y divide-border">
            {properties.map((property) => (
              <li key={property.id} className="flex items-center gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{property.title}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="shrink-0">
                      {TYPE_LABELS[property.type] ?? property.type}
                    </Badge>
                    <span>{property.priceLabel}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="size-3.5" />
                  <span className="tabular-nums">{property.interest}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
