import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInitials } from "@/lib/format";
import { ScoreBadge, StageBadge, TagChip } from "@/modules/contacts/components/contact-badges";
import type { ContactListItem } from "@/modules/contacts/types";
import { Users } from "lucide-react";

export function ContactsTable({ contacts }: { contacts: ContactListItem[] }) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Sin contactos"
        description="No hay contactos que coincidan con tu búsqueda. Ajusta los filtros o crea uno nuevo."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Contacto</TableHead>
            <TableHead className="hidden md:table-cell">Etapa</TableHead>
            <TableHead className="hidden lg:table-cell">Presupuesto</TableHead>
            <TableHead className="hidden xl:table-cell">Agente</TableHead>
            <TableHead className="hidden sm:table-cell">Últ. contacto</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c) => (
            <TableRow key={c.id} className="cursor-pointer">
              <TableCell>
                <Link href={`/contacts/${c.id}`} className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-foreground">{c.name}</span>
                      {c.tags.slice(0, 2).map((t) => (
                        <TagChip key={t.id} name={t.name} color={t.color} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {c.typeLabel}
                      {c.email ? ` · ${c.email}` : ""}
                    </span>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <StageBadge stage={c.stage} />
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                {c.budgetLabel ?? "—"}
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                {c.assignedName ?? "Sin asignar"}
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                {c.lastContactLabel ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <ScoreBadge score={c.score} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
