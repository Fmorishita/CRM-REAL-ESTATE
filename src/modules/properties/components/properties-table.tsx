import Link from "next/link";
import { Building2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/modules/properties/components/property-badges";
import type { PropertyListItem } from "@/modules/properties/types";

export function PropertiesTable({ properties }: { properties: PropertyListItem[] }) {
  if (properties.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Sin propiedades"
        description="No hay propiedades que coincidan con tu búsqueda."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Propiedad</TableHead>
            <TableHead className="hidden md:table-cell">Tipo</TableHead>
            <TableHead className="hidden lg:table-cell">Ubicación</TableHead>
            <TableHead className="hidden sm:table-cell">Estado</TableHead>
            <TableHead className="text-right">Precio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link href={`/properties/${p.id}`} className="block">
                  <span className="font-medium text-foreground">{p.title}</span>
                  <span className="block text-xs text-muted-foreground">{p.operationLabel}</span>
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="secondary">{p.typeLabel}</Badge>
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                {[p.zone, p.city].filter(Boolean).join(", ") || "—"}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <StatusBadge status={p.status} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums text-foreground">{p.priceLabel}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
