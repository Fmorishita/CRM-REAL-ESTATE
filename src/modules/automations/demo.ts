import { actionLabel, AUTOMATION_TEMPLATES, triggerLabel } from "@/config/automations";
import type { AutomationRunView, AutomationView } from "@/modules/automations/types";

function fromTemplate(key: string, id: string, status: AutomationView["status"], runCount: number, lastRun: string | null): AutomationView {
  const t = AUTOMATION_TEMPLATES.find((x) => x.key === key)!;
  return {
    id,
    name: t.name,
    status,
    trigger: t.trigger,
    triggerLabel: triggerLabel(t.trigger.type),
    conditions: t.conditions,
    actions: t.actions,
    templateKey: t.key,
    runCount,
    lastRunLabel: lastRun,
    createdAtLabel: "hace 5 días",
  };
}

const DEMO_AUTOMATIONS: AutomationView[] = [
  fromTemplate("new_facebook_lead", "au000000-0000-4000-8000-000000000001", "active", 42, "hace 2 horas"),
  fromTemplate("no_response_24h", "au000000-0000-4000-8000-000000000002", "active", 18, "hace 6 horas"),
  fromTemplate("post_visit", "au000000-0000-4000-8000-000000000003", "inactive", 7, "hace 3 días"),
];

export function demoAutomations(): AutomationView[] {
  return DEMO_AUTOMATIONS;
}

export function demoAutomation(id: string): AutomationView | null {
  return DEMO_AUTOMATIONS.find((a) => a.id === id) ?? null;
}

export function demoAutomationRuns(id: string): AutomationRunView[] {
  const automation = demoAutomation(id);
  if (!automation) return [];
  return [
    {
      id: `${id}-run-1`,
      status: "success",
      startedAtLabel: "hace 2 horas",
      steps: automation.actions.map((a) => ({ type: a.type, label: actionLabel(a.type), status: "success" })),
      error: null,
    },
    {
      id: `${id}-run-2`,
      status: "success",
      startedAtLabel: "hace 5 horas",
      steps: automation.actions.map((a) => ({ type: a.type, label: actionLabel(a.type), status: "success" })),
      error: null,
    },
    {
      id: `${id}-run-3`,
      status: "partial",
      startedAtLabel: "hace 1 día",
      steps: automation.actions.map((a, i) => ({ type: a.type, label: actionLabel(a.type), status: i === 0 ? "success" : "skipped" })),
      error: "Una acción se omitió por falta de canal configurado.",
    },
  ];
}
