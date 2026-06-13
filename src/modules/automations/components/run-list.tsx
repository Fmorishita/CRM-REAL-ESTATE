import { AlertTriangle, Check, CircleDot, SkipForward } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AutomationRunView } from "@/modules/automations/types";

const RUN_STATUS: Record<string, { label: string; tone: string }> = {
  success: { label: "Éxito", tone: "text-emerald-600 dark:text-emerald-400" },
  failed: { label: "Falló", tone: "text-red-600 dark:text-red-400" },
  partial: { label: "Parcial", tone: "text-amber-600 dark:text-amber-400" },
  skipped: { label: "Omitida", tone: "text-muted-foreground" },
};

function stepIcon(status: string) {
  if (status === "success") return <Check className="size-3.5 text-emerald-500" />;
  if (status === "failed") return <AlertTriangle className="size-3.5 text-red-500" />;
  if (status === "skipped") return <SkipForward className="size-3.5 text-muted-foreground" />;
  return <CircleDot className="size-3.5 text-muted-foreground" />;
}

export function RunList({ runs }: { runs: AutomationRunView[] }) {
  if (runs.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sin ejecuciones todavía.</p>;
  }

  return (
    <ul className="space-y-3">
      {runs.map((run) => {
        const meta = RUN_STATUS[run.status] ?? RUN_STATUS.skipped!;
        return (
          <li key={run.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn(meta.tone)}>
                {meta.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{run.startedAtLabel}</span>
            </div>
            <ul className="mt-2 space-y-0.5">
              {run.steps.map((step, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {stepIcon(step.status)}
                  {step.label}
                </li>
              ))}
            </ul>
            {run.error ? <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">{run.error}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
