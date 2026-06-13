export interface NamedValue {
  label: string;
  value: number;
  valueLabel?: string;
}

export interface AnalyticsData {
  currency: string;
  locale: string;
  kpis: {
    newLeads: number;
    qualifiedRate: number;
    openOpps: number;
    pipelineValueLabel: string;
    forecastLabel: string;
    wonValueLabel: string;
    commissionsLabel: string;
    visitsTotal: number;
  };
  leadsBySource: NamedValue[];
  conversionByStage: NamedValue[];
  agents: { name: string; opps: number; valueLabel: string }[];
  properties: NamedValue[];
  visitsByStatus: NamedValue[];
  automations: { active: number; runs: number };
}
