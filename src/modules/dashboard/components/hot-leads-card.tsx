import Link from "next/link";
import { Flame, MapPin } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HotLead } from "@/modules/dashboard/types";

function scoreColor(score: number): string {
  if (score >= 85) return "text-red-600 dark:text-red-400";
  if (score >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

export function HotLeadsCard({ leads }: { leads: HotLead[] }) {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-4 text-red-500" />
          Hot Leads
        </CardTitle>
        <CardDescription>Tus prospectos con mayor probabilidad de cierre.</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/contacts">Ver todos</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <div className="px-2 pb-2">
        {leads.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="Aún no hay leads calientes"
            description="Cuando tus contactos acumulen score, aparecerán aquí priorizados."
            className="mx-4 mb-2 border-0 bg-transparent py-8"
          />
        ) : (
          <ul className="divide-y divide-border">
            {leads.map((lead) => (
              <li key={lead.id} className="flex items-center gap-3 px-3 py-3">
                <Avatar className="size-9">
                  <AvatarFallback className="text-xs">{getInitials(lead.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{lead.name}</p>
                    <Badge variant="secondary" className="shrink-0">
                      {lead.type}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {lead.budgetLabel ? <span>{lead.budgetLabel}</span> : null}
                    {lead.zone ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {lead.zone}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Próxima acción:</span>{" "}
                    {lead.recommendedAction}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className={cn("text-lg font-semibold tabular-nums", scoreColor(lead.score))}>
                    {lead.score}
                  </span>
                  {lead.lastContactLabel ? (
                    <span className="text-[11px] text-muted-foreground">{lead.lastContactLabel}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
