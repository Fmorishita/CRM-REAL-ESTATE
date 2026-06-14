import type { AiProviderId, AiTaskKey } from "@/lib/ai/types";

export interface AiTaskConfigView {
  taskKey: AiTaskKey;
  label: string;
  description: string;
  provider: AiProviderId;
  model: string;
  temperature: number;
  requiresApproval: boolean;
  enabled: boolean;
  phase: number;
}

export interface AiUsageSummary {
  totalRequests: number;
  totalCostUsd: number;
  byTask: { taskKey: string; requests: number; costUsd: number }[];
}
