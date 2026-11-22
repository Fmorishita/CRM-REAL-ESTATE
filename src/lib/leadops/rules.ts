import { QUALIFICATION_KEYS, QUALIFICATION_QUESTIONS } from "@/lib/leadops/qualification";

/**
 * Pure lead-operations rules shared by the inbox, webhook and automations.
 * Kept free of I/O so they are unit-tested and identical everywhere.
 */

export const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** The 24h customer-service window runs from the customer's LAST inbound message. */
export function isServiceWindowOpen(lastInboundAt: Date | null | undefined, now: Date = new Date()): boolean {
  if (!lastInboundAt) return false;
  return now.getTime() - lastInboundAt.getTime() < SERVICE_WINDOW_MS;
}

export interface SendGuardInput {
  blockedAt: Date | null;
  lastInboundAt: Date | null;
  /** True when sending an approved template, which is allowed outside the window. */
  isTemplate: boolean;
}

export type SendGuardResult = { allowed: true } | { allowed: false; reason: "blocked" | "window_closed" };

/** Checked by the UI, the server action AND any deferred job right before sending. */
export function canSendToContact(input: SendGuardInput, now: Date = new Date()): SendGuardResult {
  if (input.blockedAt) return { allowed: false, reason: "blocked" };
  if (!input.isTemplate && !isServiceWindowOpen(input.lastInboundAt, now)) {
    return { allowed: false, reason: "window_closed" };
  }
  return { allowed: true };
}

export interface AssigneeCandidate {
  membershipId: string;
  /** Target share for weighted mode (0–100). */
  weight: number;
  /** Leads assigned to this member in the current period. */
  assignedThisPeriod: number;
  /** When this member last received a lead (equitable rotation). */
  lastAssignedAt: Date | null;
}

/**
 * Picks who receives a new lead.
 * - equitable: round-robin — the member who received a lead longest ago (never first).
 * - weighted: the member furthest below their target share this period.
 * Ties break by membershipId so the result is deterministic.
 */
export function pickAssignee(
  candidates: AssigneeCandidate[],
  mode: "equitable" | "weighted",
): string | null {
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => a.membershipId.localeCompare(b.membershipId));

  if (mode === "weighted") {
    const totalWeight = sorted.reduce((s, c) => s + Math.max(0, c.weight), 0);
    if (totalWeight > 0) {
      const total = sorted.reduce((s, c) => s + c.assignedThisPeriod, 0) + 1;
      let best: AssigneeCandidate | null = null;
      let bestDeficit = -Infinity;
      for (const c of sorted) {
        const target = (Math.max(0, c.weight) / totalWeight) * total;
        const deficit = target - c.assignedThisPeriod;
        if (deficit > bestDeficit) {
          bestDeficit = deficit;
          best = c;
        }
      }
      return best?.membershipId ?? null;
    }
  }

  let best = sorted[0]!;
  for (const c of sorted) {
    const a = c.lastAssignedAt?.getTime() ?? -1;
    const b = best.lastAssignedAt?.getTime() ?? -1;
    if (a < b) best = c;
  }
  return best.membershipId;
}

/** The five pre-qualification answers ("casas"), in form order. */
export const DEFAULT_FACT_KEYS = QUALIFICATION_KEYS;
export type FactKey = (typeof QUALIFICATION_KEYS)[number];

export const FACT_LABELS = Object.fromEntries(QUALIFICATION_QUESTIONS.map((q) => [q.key, q.label])) as Record<FactKey, string>;

/** Counts captured data points. Independent flags, not a sequential funnel. */
export function factsCompleted(keys: Iterable<string>): number {
  const set = new Set(keys);
  return DEFAULT_FACT_KEYS.filter((k) => set.has(k)).length;
}

/** Highest data point reached, for the "max milestone" distribution (each lead counted once). */
export function highestFact(keys: Iterable<string>): number {
  const set = new Set(keys);
  let max = 0;
  DEFAULT_FACT_KEYS.forEach((k, i) => {
    if (set.has(k)) max = i + 1;
  });
  return max;
}

/** Digits only, for WhatsApp ids / E.164 comparisons. */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

/** Display format: "526463000000" → "+52 646 300 0000" (Mexico, with or without the mobile 1). */
export function formatPhone(digits: string | null | undefined): string {
  if (!digits) return "";
  const d = digits.replace(/\D/g, "");
  const local = d.length === 13 && d.startsWith("521") ? d.slice(3) : d.length === 12 && d.startsWith("52") ? d.slice(2) : null;
  if (local) return `+52 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  return d.length > 10 ? `+${d}` : d;
}
