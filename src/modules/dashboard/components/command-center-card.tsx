import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, UserPlus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CommandItem, CommandKind } from "@/modules/dashboard/types";

const KIND_META: Record<CommandKind, { icon: typeof Clock; className: string }> = {
  overdue_task: { icon: AlertTriangle, className: "text-red-600 dark:text-red-400" },
  today_task: { icon: Clock, className: "text-amber-600 dark:text-amber-400" },
  stale_leads: { icon: UserPlus, className: "text-blue-600 dark:text-blue-400" },
  next_action: { icon: ArrowRight, className: "text-emerald-600 dark:text-emerald-400" },
};

export function CommandCenterCard({ items }: { items: CommandItem[] }) {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>Today Command Center</CardTitle>
        <CardDescription>Tus prioridades de hoy para mover oportunidades.</CardDescription>
      </CardHeader>
      <div className="px-2 pb-2">
        {items.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Todo al día"
            description="No tienes tareas vencidas ni leads sin seguimiento. ¡Buen trabajo!"
            className="mx-4 mb-2 border-0 bg-transparent py-8"
          />
        ) : (
          <ul className="space-y-1">
            {items.map((item) => {
              const meta = KIND_META[item.kind];
              const Icon = meta.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <Icon className={cn("size-4 shrink-0", meta.className)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      {item.hint ? (
                        <p className="truncate text-xs text-muted-foreground">{item.hint}</p>
                      ) : null}
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
