export interface OpportunityCard {
  id: string;
  title: string;
  stageId: string;
  contactId: string;
  contactName: string;
  propertyTitle: string | null;
  amount: number;
  amountLabel: string;
  commissionLabel: string | null;
  probability: number;
  assignedName: string | null;
  closeDateLabel: string | null;
  aiRisk: "low" | "medium" | "high" | null;
}

export interface PipelineColumn {
  id: string;
  key: string;
  name: string;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  totalValueLabel: string;
  cards: OpportunityCard[];
}

export interface PipelineSummary {
  openCount: number;
  totalValueLabel: string;
  weightedForecastLabel: string;
  wonValueLabel: string;
}

export interface PipelineBoard {
  columns: PipelineColumn[];
  summary: PipelineSummary;
  currency: string;
  locale: string;
}

export interface OpportunityRow {
  id: string;
  title: string;
  contactName: string;
  contactId: string;
  propertyTitle: string | null;
  stageName: string;
  stageKey: string;
  amountLabel: string;
  commissionLabel: string | null;
  probability: number;
  assignedName: string | null;
  closeDateLabel: string | null;
}

export interface OpportunityFilters {
  assignedMembershipId?: string;
}

export interface OpportunityFormOptions {
  pipelineId: string;
  stages: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  properties: { id: string; title: string }[];
  members: { id: string; name: string }[];
  defaultCurrency: string;
}
