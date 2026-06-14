import Link from "next/link";
import { Columns3 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StageBadge } from "@/modules/contacts/components/contact-badges";
import type { OpportunityRow } from "@/modules/pipeline/types";

export function PipelineTable({ rows }: { rows: OpportunityRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Columns3}
        title="Sin oportunidades"
        description="Crea tu primera oportunidad para empezar a darle seguimiento a tus cierres."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Oportunidad</TableHead>
            <TableHead className="hidden md:table-cell">Etapa</TableHead>
            <TableHead className="hidden lg:table-cell">Propiedad</TableHead>
            <TableHead className="hidden xl:table-cell">Agente</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Prob.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link href={`/contacts/${row.contactId}`} className="block">
                  <span className="font-medium text-foreground">{row.contactName}</span>
                  <span className="block text-xs text-muted-foreground">{row.title}</span>
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <StageBadge stage={row.stageKey} />
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                {row.propertyTitle ?? "—"}
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                {row.assignedName ?? "Sin asignar"}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums text-foreground">
                {row.amountLabel}
              </TableCell>
              <TableCell className="hidden text-right text-sm text-muted-foreground tabular-nums sm:table-cell">
                {row.probability}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
