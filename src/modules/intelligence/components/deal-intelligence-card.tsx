import { ArrowRight, Brain, Check, Clock, MessageCircle, TrendingUp, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Intelligence } from "@/lib/intelligence/engine";

const RISK_TONE: Record<string, string> = {
  low: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-red-600 dark:text-red-400",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const tone = value >= 75 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function DealIntelligenceCard({ intelligence }: { intelligence: Intelligence }) {
  const intel = intelligence;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="size-4 text-violet-500" />
          Deal Intelligence
          <Badge variant="secondary">IA</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <ScoreBar label="Lead score" value={intel.leadScore} />
          <ScoreBar label="Deal score" value={intel.dealScore} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Probabilidad de cierre</span>
          <span className="text-sm font-semibold text-foreground">{intel.closeProbability}%</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Riesgo de abandono</span>
          <Badge variant="outline" className={cn(RISK_TONE[intel.risk])}>
            {intel.riskLabel}
          </Badge>
        </div>

        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
          <p className="flex items-start gap-2 text-sm text-foreground">
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-violet-500" />
            <span>
              <span className="font-medium">Próxima mejor acción:</span> {intel.nextBestAction}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-3 pl-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3" />
              {intel.bestChannel}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {intel.bestTime}
            </span>
          </div>
        </div>

        {intel.factors.length > 0 ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <TrendingUp className="size-3" />
              Factores
            </p>
            <ul className="space-y-0.5">
              {intel.factors.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs">
                  {f.impact === "positive" ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : f.impact === "negative" ? (
                    <X className="size-3 text-red-500" />
                  ) : (
                    <span className="size-3 text-center text-muted-foreground">·</span>
                  )}
                  <span className="text-muted-foreground">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
