import type { TenantContext } from "@/lib/auth/types";
import { formatCurrency } from "@/lib/format";
import type { AnalyticsData } from "@/modules/analytics/types";

export function demoAnalytics(ctx: TenantContext): AnalyticsData {
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });

  return {
    currency,
    locale,
    kpis: {
      newLeads: 10,
      qualifiedRate: 60,
      openOpps: 6,
      pipelineValueLabel: cur(45050000),
      forecastLabel: cur(25900000),
      wonValueLabel: cur(0),
      commissionsLabel: cur(1559500),
      visitsTotal: 4,
    },
    leadsBySource: [
      { label: "Facebook Lead Ads", value: 3 },
      { label: "Referido", value: 2 },
      { label: "Inmuebles24", value: 2 },
      { label: "Landing Page", value: 2 },
      { label: "Google Ads", value: 1 },
    ],
    conversionByStage: [
      { label: "Calificado", value: 1 },
      { label: "Buscando propiedad", value: 2 },
      { label: "Visita agendada", value: 1 },
      { label: "Visita realizada", value: 1 },
      { label: "Oferta / negociación", value: 1 },
    ],
    agents: [
      { name: "Carlos Mendoza", opps: 3, valueLabel: cur(22500000) },
      { name: "Mariana López", opps: 3, valueLabel: cur(22550000) },
    ],
    properties: [
      { label: "Preventa Torre Altitude Tijuana", value: 4 },
      { label: "Casa frente al mar en Ensenada", value: 3 },
      { label: "Departamento en Polanco CDMX", value: 3 },
      { label: "Desarrollo Cumbres Monterrey", value: 2 },
      { label: "Terreno en Valle de Guadalupe", value: 1 },
    ],
    visitsByStatus: [
      { label: "Confirmada", value: 2 },
      { label: "Pendiente", value: 1 },
      { label: "Realizada", value: 1 },
    ],
    automations: { active: 2, runs: 67 },
  };
}
