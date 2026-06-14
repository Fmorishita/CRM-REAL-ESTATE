import { AlertTriangle, CheckCircle2, Info, Sparkles, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AiInsight } from "@/modules/dashboard/types";

const TONE_META: Record<AiInsight["tone"], { icon: LucideIcon; className: string }> = {
  warning: { icon: AlertTriangle, className: "text-amber-600 dark:text-amber-400" },
  success: { icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
  info: { icon: Info, className: "text-blue-600 dark:text-blue-400" },
};

export function AiInsightsCard({ insights }: { insights: AiInsight[] }) {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-500" />
          AI Insights
        </CardTitle>
        <CardDescription>Hallazgos sobre tus leads, conversaciones y pipeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {insights.map((insight) => {
            const meta = TONE_META[insight.tone];
            const Icon = meta.icon;
            return (
              <li key={insight.id} className="flex items-start gap-2.5">
                <Icon className={cn("mt-0.5 size-4 shrink-0", meta.className)} />
                <p className="text-sm text-foreground">{insight.text}</p>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
