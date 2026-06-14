import "server-only";

import { createHmac } from "node:crypto";

import { hasEnv } from "@/lib/integrations/env";

/**
 * Outbound webhook dispatcher. Emits signed events to external automation tools
 * (Zapier, Make, n8n). Without WEBHOOK_SIGNING_SECRET the dispatcher stays in
 * mock mode and never calls out, so demo mode produces no external traffic.
 */
export interface WebhookEvent {
  event: string;
  organizationId: string;
  data: Record<string, unknown>;
}

export interface WebhookDispatchResult {
  ok: boolean;
  mode: "live" | "mock";
  status?: number;
  error?: string;
}

export function isWebhooksEnabled(): boolean {
  return hasEnv("WEBHOOK_SIGNING_SECRET");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function dispatchWebhook(url: string, event: WebhookEvent): Promise<WebhookDispatchResult> {
  const secret = process.env.WEBHOOK_SIGNING_SECRET?.trim();
  const payload = JSON.stringify({ ...event, sentAt: new Date().toISOString() });

  if (!secret) {
    return { ok: true, mode: "mock" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Realtor-Event": event.event,
        "X-Realtor-Signature": `sha256=${sign(payload, secret)}`,
      },
      body: payload,
    });
    return { ok: res.ok, mode: "live", status: res.status };
  } catch (error) {
    return { ok: false, mode: "live", error: error instanceof Error ? error.message : "dispatch failed" };
  }
}
