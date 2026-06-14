import type { AiInsight } from "@/modules/dashboard/types";

const CONTACT_TYPE_LABELS: Record<string, string> = {
  buyer: "Comprador",
  seller: "Vendedor",
  investor: "Inversionista",
  renter: "Rentador",
  external_broker: "Broker",
  referrer: "Referidor",
  developer: "Desarrollador",
};

export function contactTypeLabel(type: string): string {
  return CONTACT_TYPE_LABELS[type] ?? type;
}

/** Rule-based dashboard insights. Generative AI insights arrive in Phase 9. */
export function buildInsights(input: {
  staleLeadsCount: number;
  needsAttentionCount: number;
  overdueCount: number;
  weightedForecast: number;
  forecastLabel: string;
  topSourceCount: number;
}): AiInsight[] {
  const insights: AiInsight[] = [];
  if (input.staleLeadsCount > 0) {
    insights.push({
      id: "stale",
      tone: "warning",
      text: `Tienes ${input.staleLeadsCount} lead${input.staleLeadsCount === 1 ? "" : "s"} sin seguimiento en más de 7 días. Recontáctalos hoy.`,
    });
  }
  if (input.needsAttentionCount > 0) {
    insights.push({
      id: "attention",
      tone: "warning",
      text: `${input.needsAttentionCount} conversación${input.needsAttentionCount === 1 ? "" : "es"} requiere atención inmediata.`,
    });
  }
  if (input.weightedForecast > 0) {
    insights.push({
      id: "forecast",
      tone: "success",
      text: `Tu forecast ponderado del pipeline activo es de ${input.forecastLabel}.`,
    });
  }
  if (input.overdueCount > 0) {
    insights.push({
      id: "overdue",
      tone: "warning",
      text: `${input.overdueCount} tarea${input.overdueCount === 1 ? "" : "s"} vencida${input.overdueCount === 1 ? "" : "s"} necesita${input.overdueCount === 1 ? "" : "n"} tu atención.`,
    });
  }
  insights.push({
    id: "ai-note",
    tone: "info",
    text: "Insights basados en reglas. La IA generativa multimodelo llega en la Fase 9.",
  });
  return insights.slice(0, 4);
}
