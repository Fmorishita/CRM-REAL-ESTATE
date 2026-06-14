import { Banknote, Target, TrendingUp, Trophy } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { formatNumber } from "@/lib/format";
import type { PipelineSummary } from "@/modules/pipeline/types";

export function PipelineStats({ summary, locale }: { summary: PipelineSummary; locale: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard
        label="Oportunidades abiertas"
        value={formatNumber(summary.openCount, locale)}
        icon={Target}
      />
      <StatCard label="Valor del pipeline" value={summary.totalValueLabel} icon={Banknote} />
      <StatCard
        label="Forecast ponderado"
        value={summary.weightedForecastLabel}
        icon={TrendingUp}
        hint="Σ valor × probabilidad"
      />
      <StatCard label="Cerrado ganado" value={summary.wonValueLabel} icon={Trophy} />
    </div>
  );
}
