import { computeIntelligence, type IntelSignals, type Intelligence } from "@/lib/intelligence/engine";

function days(n: number): Date {
  return new Date(Date.now() - n * 24 * 3600 * 1000);
}

const DEMO_SIGNALS: Record<string, IntelSignals> = {
  "d4000000-0000-4000-8000-000000000005": { lastContactAt: days(0), stage: "negotiation", hasBudget: true, sourceKind: "referral", conversations: 1, unresponded: 0, visits: 0, visitsDone: 0, favorites: 0, urgency: "high", whatsapp: true },
  "d4000000-0000-4000-8000-000000000002": { lastContactAt: days(0), stage: "searching", hasBudget: true, sourceKind: "referral", conversations: 1, unresponded: 1, visits: 1, visitsDone: 0, favorites: 0, urgency: "high", whatsapp: true },
  "d4000000-0000-4000-8000-000000000001": { lastContactAt: days(1), stage: "qualified", hasBudget: true, sourceKind: "facebook", conversations: 1, unresponded: 0, visits: 0, visitsDone: 0, favorites: 1, urgency: "medium", whatsapp: true },
  "d4000000-0000-4000-8000-000000000004": { lastContactAt: days(8), stage: "new", hasBudget: false, sourceKind: "landing", conversations: 0, unresponded: 0, visits: 0, visitsDone: 0, favorites: 0, urgency: "low", whatsapp: true },
  "d4000000-0000-4000-8000-000000000009": { lastContactAt: days(0), stage: "visit_done", hasBudget: false, sourceKind: "portal", conversations: 0, unresponded: 0, visits: 1, visitsDone: 1, favorites: 0, urgency: "medium", whatsapp: true },
};

const DEFAULT_SIGNALS: IntelSignals = {
  lastContactAt: days(3),
  stage: "contacted",
  hasBudget: false,
  sourceKind: "other",
  conversations: 0,
  unresponded: 0,
  visits: 0,
  visitsDone: 0,
  favorites: 0,
  urgency: "medium",
  whatsapp: true,
};

export function demoIntelligence(contactId: string): Intelligence {
  return computeIntelligence(DEMO_SIGNALS[contactId] ?? DEFAULT_SIGNALS);
}
