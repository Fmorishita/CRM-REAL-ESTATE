import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { PipelineOverview } from "@/modules/dashboard/types";

interface Props {
  pipeline: PipelineOverview;
  currency: string;
  locale: string;
}

export function PipelineOverviewCard({ pipeline, currency, locale }: Props) {
  const maxValue = Math.max(1, ...pipeline.stages.map((s) => s.value));
  const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });

  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>Pipeline Overview</CardTitle>
        <CardDescription>
          {formatNumber(pipeline.openCount, locale)} oportunidades abiertas · forecast{" "}
          {cur(pipeline.weightedForecast)}
        </CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/pipeline">Ver pipeline</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {pipeline.openCount === 0 ? (
          <EmptyState
            title="Sin oportunidades abiertas"
            description="Crea oportunidades en el pipeline para ver aquí su valor y forecast."
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <div className="space-y-3">
            {pipeline.stages
              .filter((stage) => stage.count > 0)
              .map((stage) => (
                <div key={stage.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {stage.name}
                      <span className="ml-1.5 text-xs">({stage.count})</span>
                    </span>
                    <span className="font-medium tabular-nums text-foreground">{cur(stage.value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${Math.max(4, (stage.value / maxValue) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="font-medium text-foreground">Valor total</span>
              <span className="font-semibold tabular-nums text-foreground">{cur(pipeline.totalValue)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
