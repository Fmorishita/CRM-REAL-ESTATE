import type { AutomationAction, AutomationCondition, AutomationTrigger } from "@/config/automations";

export interface AutomationView {
  id: string;
  name: string;
  status: "draft" | "active" | "inactive";
  trigger: AutomationTrigger;
  triggerLabel: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  templateKey: string | null;
  runCount: number;
  lastRunLabel: string | null;
  createdAtLabel: string;
}

export interface AutomationRunView {
  id: string;
  status: "success" | "failed" | "partial" | "skipped";
  startedAtLabel: string;
  steps: { type: string; label: string; status: string }[];
  error: string | null;
}
