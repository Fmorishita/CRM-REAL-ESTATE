/** Demo metrics for the dashboard shell. Replaced by real tenant queries in Phase 3. */

export interface DemoDashboardMetrics {
  newLeadsToday: number;
  newLeadsTrendPct: number;
  pendingConversations: number;
  visitsThisWeek: number;
  openOpportunities: number;
  pipelineValue: number;
}

export const DEMO_DASHBOARD_METRICS: DemoDashboardMetrics = {
  newLeadsToday: 12,
  newLeadsTrendPct: 8,
  pendingConversations: 7,
  visitsThisWeek: 9,
  openOpportunities: 24,
  pipelineValue: 48_250_000,
};
