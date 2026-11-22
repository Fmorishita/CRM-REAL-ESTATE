import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  buildCapiEvent,
  capiEventId,
  isCapiConfigured,
  sendCapiEvent,
  type CapiTrigger,
} from "@/lib/leadops/capi";

/**
 * Records and (when configured) sends one CAPI event for a contact milestone.
 * Only leads that came from a click-to-WhatsApp ad carry a ctwa_clid; others
 * are skipped. Never throws — feedback to Meta must not break CRM actions.
 */
export async function reportMilestone(
  organizationId: string,
  contactId: string,
  trigger: CapiTrigger,
  opts: { value?: number; currency?: string } = {},
): Promise<void> {
  try {
    const eventId = capiEventId(trigger, contactId);
    const existing = await prisma.capiEvent.findUnique({
      where: { organizationId_eventId: { organizationId, eventId } },
    });
    if (existing && existing.status === "sent") return;

    const attribution = await prisma.leadAttribution.findFirst({
      where: { organizationId, contactId, isFirstTouch: true, ctwaClid: { not: null } },
    });
    const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() ?? "";
    const eventTime = new Date();

    if (!attribution?.ctwaClid) {
      await prisma.capiEvent.upsert({
        where: { organizationId_eventId: { organizationId, eventId } },
        create: {
          organizationId, contactId, trigger, eventId, eventTime,
          eventName: trigger, status: "skipped", payload: {}, error: "no_ctwa_clid",
        },
        update: {},
      });
      return;
    }

    const payload = buildCapiEvent(
      { trigger, contactId, ctwaClid: attribution.ctwaClid, eventTime, ...opts },
      wabaId,
    );
    const result = isCapiConfigured() ? await sendCapiEvent(payload) : { ok: false, error: "not_configured" };
    const status = result.ok ? "sent" : result.error === "not_configured" ? "skipped" : "failed";

    await prisma.capiEvent.upsert({
      where: { organizationId_eventId: { organizationId, eventId } },
      create: {
        organizationId, contactId, trigger, eventId, eventTime,
        eventName: String(payload.event_name), status, payload: payload as object,
        response: (result as { response?: object }).response ?? undefined,
        error: result.ok ? null : result.error, attempts: 1,
        sentAt: result.ok ? new Date() : null,
      },
      update: {
        status, payload: payload as object, attempts: { increment: 1 },
        response: (result as { response?: object }).response ?? undefined,
        error: result.ok ? null : result.error, sentAt: result.ok ? new Date() : null,
      },
    });
  } catch (error) {
    console.error("reportMilestone failed:", error);
  }
}
