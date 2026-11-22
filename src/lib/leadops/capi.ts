import "server-only";

/**
 * Conversions API for business messaging (click-to-WhatsApp). Sends CRM
 * milestones back to Meta so campaigns can optimize for real leads, not just
 * conversations. Live only when META_DATASET_ID + META_CAPI_ACCESS_TOKEN +
 * WHATSAPP_BUSINESS_ACCOUNT_ID are set; otherwise events are recorded as
 * `skipped`. Credentials are never invented.
 */

const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v23.0";

/** CRM milestone → Meta event name. Kept as data so it is reviewable. */
export const CAPI_TRIGGERS = {
  lead_created: "LeadSubmitted",
  lead_qualified: "QualifiedLead",
  visit_scheduled: "Schedule",
  deal_won: "Purchase",
} as const;
export type CapiTrigger = keyof typeof CAPI_TRIGGERS;

export function isCapiConfigured(): boolean {
  return Boolean(
    process.env.META_DATASET_ID?.trim() &&
      process.env.META_CAPI_ACCESS_TOKEN?.trim() &&
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim(),
  );
}

export interface CapiEventInput {
  trigger: CapiTrigger;
  contactId: string;
  ctwaClid: string;
  eventTime: Date;
  value?: number;
  currency?: string;
}

/** Deterministic id: one event per contact per milestone (Meta dedups on event_id). */
export function capiEventId(trigger: CapiTrigger, contactId: string): string {
  return `${trigger}:${contactId}`;
}

export function buildCapiEvent(input: CapiEventInput, wabaId: string): Record<string, unknown> {
  const event: Record<string, unknown> = {
    event_name: CAPI_TRIGGERS[input.trigger],
    event_time: Math.floor(input.eventTime.getTime() / 1000),
    event_id: capiEventId(input.trigger, input.contactId),
    action_source: "business_messaging",
    messaging_channel: "whatsapp",
    user_data: {
      whatsapp_business_account_id: wabaId,
      ctwa_clid: input.ctwaClid,
    },
  };
  if (input.value !== undefined) {
    event.custom_data = { value: input.value, currency: input.currency ?? "MXN" };
  }
  return event;
}

export interface CapiSendResult {
  ok: boolean;
  response?: unknown;
  error?: string;
}

export async function sendCapiEvent(event: Record<string, unknown>): Promise<CapiSendResult> {
  if (!isCapiConfigured()) return { ok: false, error: "not_configured" };
  const datasetId = process.env.META_DATASET_ID!.trim();
  const token = process.env.META_CAPI_ACCESS_TOKEN!.trim();
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${datasetId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: [event], ...(testCode ? { test_event_code: testCode } : {}) }),
      cache: "no-store",
    });
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, response: json, error: `HTTP ${res.status}` };
    return { ok: true, response: json };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "network_error" };
  }
}
