import { ArrowDown, Filter, Play, Zap } from "lucide-react";

import { actionLabel, conditionLabel } from "@/config/automations";
import type { AutomationView } from "@/modules/automations/types";

export function AutomationFlow({ automation }: { automation: AutomationView }) {
  return (
    <div className="space-y-2">
      {/* Trigger */}
      <FlowStep tone="bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20" icon={<Zap className="size-4" />} label="Cuando">
        <p className="text-sm font-medium text-foreground">{automation.triggerLabel}</p>
        {typeof automation.trigger.config?.days === "number" ? (
          <p className="text-xs text-muted-foreground">{automation.trigger.config.days} día(s)</p>
        ) : null}
      </FlowStep>

      {automation.conditions.length > 0 ? (
        <>
          <Connector />
          <FlowStep tone="bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20" icon={<Filter className="size-4" />} label="Si">
            <ul className="space-y-0.5">
              {automation.conditions.map((c, i) => (
                <li key={i} className="text-sm text-foreground">
                  {conditionLabel(c.field)} <span className="text-muted-foreground">{c.op}</span> {c.value}
                </li>
              ))}
            </ul>
          </FlowStep>
        </>
      ) : null}

      <Connector />
      <FlowStep tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20" icon={<Play className="size-4" />} label="Entonces">
        <ul className="space-y-1">
          {automation.actions.map((a, i) => (
            <li key={i} className="flex items-baseline gap-2 text-sm">
              <span className="font-medium text-foreground">{actionLabel(a.type)}</span>
              {a.label ? <span className="text-xs text-muted-foreground">{a.label}</span> : null}
            </li>
          ))}
        </ul>
      </FlowStep>
    </div>
  );
}

function FlowStep({
  tone,
  icon,
  label,
  children,
}: {
  tone: string;
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-3">
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ${tone}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex justify-center">
      <ArrowDown className="size-4 text-muted-foreground/50" />
    </div>
  );
}
