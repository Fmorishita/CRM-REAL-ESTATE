import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { extractFactsFromText } from "@/lib/leadops/qualification";
import {
  eventKey,
  type EchoEvent,
  type InboundMessageEvent,
  type StatusEvent,
  type WhatsAppEvent,
} from "@/lib/leadops/whatsapp-webhook";
import { pickAssignee } from "@/lib/leadops/rules";
import { phoneVariants } from "@/lib/leadops/web-form";
import { reportMilestone } from "@/modules/leadops/server/capi";
import { applyFacts } from "@/modules/leadops/server/facts";
import { resolveLeadOrganizationId } from "@/modules/leadops/server/organization";

/**
 * Turns verified WhatsApp webhook events into CRM state:
 * contact (one per WhatsApp identity) → first-touch attribution → assignment →
 * conversation + message → CAPI "lead created". Each event is stored first in
 * webhook_events with a unique key, so Meta retries never duplicate anything.
 */

type ChannelRoute = { id: string; organizationId: string };

async function resolveChannel(phoneNumberId: string): Promise<ChannelRoute | null> {
  const account = await prisma.channelAccount.findUnique({
    where: { channel_externalId: { channel: "whatsapp", externalId: phoneNumberId } },
    select: { id: true, organizationId: true },
  });
  if (account) return account;

  // Bootstrap: the configured number + org slug create the channel row on first use.
  const envNumber = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!envNumber || envNumber !== phoneNumberId) return null;
  const organizationId = await resolveLeadOrganizationId();
  if (!organizationId) return null;
  return prisma.channelAccount.create({
    data: { organizationId, channel: "whatsapp", name: "WhatsApp Business", status: "connected", externalId: phoneNumberId },
    select: { id: true, organizationId: true },
  });
}

export async function chooseAssignee(organizationId: string): Promise<{ membershipId: string | null; reason: "auto_equitable" | "auto_weighted" }> {
  const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { settings: true } });
  const settings = (org?.settings ?? {}) as { leadDistribution?: string };
  const mode = settings.leadDistribution === "weighted" ? "weighted" : "equitable";

  const members = await prisma.membership.findMany({
    where: { organizationId, status: "active", assignable: true },
    select: { id: true, leadWeight: true },
  });
  if (members.length === 0) return { membershipId: null, reason: mode === "weighted" ? "auto_weighted" : "auto_equitable" };

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const ids = members.map((m) => m.id);
  const [counts, lasts] = await Promise.all([
    prisma.assignmentLog.groupBy({
      by: ["toMembershipId"],
      where: { organizationId, toMembershipId: { in: ids }, createdAt: { gte: monthStart } },
      _count: { _all: true },
    }),
    prisma.assignmentLog.groupBy({
      by: ["toMembershipId"],
      where: { organizationId, toMembershipId: { in: ids } },
      _max: { createdAt: true },
    }),
  ]);
  const membershipId = pickAssignee(
    members.map((m) => ({
      membershipId: m.id,
      weight: m.leadWeight,
      assignedThisPeriod: counts.find((c) => c.toMembershipId === m.id)?._count._all ?? 0,
      lastAssignedAt: lasts.find((c) => c.toMembershipId === m.id)?._max.createdAt ?? null,
    })),
    mode,
  );
  return { membershipId, reason: mode === "weighted" ? "auto_weighted" : "auto_equitable" };
}

async function handleMessage(e: InboundMessageEvent, route: ChannelRoute): Promise<void> {
  const { organizationId } = route;
  const waId = e.waId ?? (e.bsuid ? `bsuid:${e.bsuid}` : null);
  if (!waId) throw new Error("inbound message without sender identity");

  let contact = await prisma.contact.findUnique({ where: { organizationId_waId: { organizationId, waId } } });
  if (!contact && e.waId) {
    // Same person who first left the website form (10-digit / 52 / 521 spellings):
    // join that contact instead of creating a duplicate, and adopt WhatsApp's id.
    const variants = phoneVariants(e.waId);
    const match = await prisma.contact.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        OR: [{ waId: { in: variants } }, { phone: { in: variants } }, { whatsapp: { in: variants } }],
      },
      orderBy: { createdAt: "asc" },
    });
    if (match) {
      contact = await prisma.contact.update({
        where: { id: match.id },
        data: { waId, whatsapp: e.waId, whatsappName: e.profileName ?? match.whatsappName, bsuid: match.bsuid ?? e.bsuid },
      });
    }
  }
  const isNew = !contact;

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        organizationId,
        firstName: e.profileName ?? (e.waId ? `+${e.waId}` : "Contacto WhatsApp"),
        lastName: "",
        whatsapp: e.waId,
        phone: e.waId,
        waId,
        bsuid: e.bsuid,
        whatsappName: e.profileName,
        stage: "new",
        firstContactAt: e.timestamp,
      },
    });
  } else if ((e.profileName && e.profileName !== contact.whatsappName) || (e.bsuid && !contact.bsuid)) {
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: { whatsappName: e.profileName ?? contact.whatsappName, bsuid: contact.bsuid ?? e.bsuid },
    });
  }

  // Attribution: keep every ad touch; the first one is credited (first-click rule).
  const hasFirstTouch = await prisma.leadAttribution.count({ where: { contactId: contact.id, isFirstTouch: true } });
  if (e.referral) {
    await prisma.leadAttribution.create({
      data: {
        organizationId,
        contactId: contact.id,
        channel: "ctwa_ad",
        platform: e.referral.sourceUrl?.includes("instagram") ? "instagram" : "facebook",
        adId: e.referral.sourceType === "ad" ? e.referral.sourceId : null,
        sourceType: e.referral.sourceType,
        sourceUrl: e.referral.sourceUrl,
        headline: e.referral.headline,
        body: e.referral.body,
        mediaType: e.referral.mediaType,
        mediaUrl: e.referral.mediaUrl,
        ctwaClid: e.referral.ctwaClid,
        isFirstTouch: hasFirstTouch === 0,
        occurredAt: e.timestamp,
        raw: e.referral.raw as Prisma.InputJsonValue,
      },
    });
  } else if (isNew) {
    await prisma.leadAttribution.create({
      data: { organizationId, contactId: contact.id, channel: "organic_whatsapp", platform: "whatsapp", isFirstTouch: true, occurredAt: e.timestamp },
    });
  }

  if (!contact.assignedMembershipId) {
    const { membershipId, reason } = await chooseAssignee(organizationId);
    if (membershipId) {
      contact = await prisma.contact.update({ where: { id: contact.id }, data: { assignedMembershipId: membershipId } });
      await prisma.assignmentLog.create({
        data: { organizationId, contactId: contact.id, toMembershipId: membershipId, reason },
      });
    }
  }

  let conversation = await prisma.conversation.findFirst({
    where: { organizationId, contactId: contact.id, channelAccountId: route.id },
    orderBy: { createdAt: "desc" },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        organizationId,
        channelAccountId: route.id,
        contactId: contact.id,
        externalId: waId,
        status: "new",
        assignedMembershipId: contact.assignedMembershipId,
      },
    });
  }

  await prisma.$transaction([
    prisma.message.create({
      data: {
        organizationId,
        conversationId: conversation.id,
        direction: "inbound",
        authorType: "contact",
        body: e.text,
        externalId: e.messageId,
        status: "delivered",
        sentAt: e.timestamp,
        media: e.type === "text" ? undefined : ({ type: e.type } as Prisma.InputJsonValue),
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: e.timestamp,
        unreadCount: { increment: 1 },
        status: conversation.status === "closed" ? "open" : conversation.status,
      },
    }),
    prisma.contact.update({
      where: { id: contact.id },
      data: { lastInboundAt: e.timestamp, lastContactAt: e.timestamp, firstContactAt: contact.firstContactAt ?? e.timestamp },
    }),
  ]);

  // Idempotent per contact: also covers a form lead who later clicks a WhatsApp ad.
  if (isNew || e.referral?.ctwaClid) await reportMilestone(organizationId, contact.id, "lead_created");

  // Free, deterministic capture of explicit answers ("3 recámaras", "de contado"…).
  // Advisor corrections always win; ambiguous text is left for a human or the AI.
  if (e.type === "text" || e.type === "button" || e.type === "interactive") {
    const facts = extractFactsFromText(e.text);
    if (Object.keys(facts).length > 0) await applyFacts(organizationId, contact.id, facts, "system");
  }
}

/**
 * Coexistence echo: the advisor answered from the WhatsApp Business app on the
 * phone. Mirrored as a human outbound message and the bot switches off. Echoes
 * for chats that are not leads in the CRM (personal chats on the business phone)
 * are ignored on purpose, so they never become contacts.
 */
async function handleEcho(e: EchoEvent, route: ChannelRoute): Promise<boolean> {
  const { organizationId } = route;
  const contact = await prisma.contact.findUnique({ where: { organizationId_waId: { organizationId, waId: e.to } } });
  if (!contact) return false;
  const conversation = await prisma.conversation.findFirst({
    where: { organizationId, contactId: contact.id, channelAccountId: route.id },
    orderBy: { createdAt: "desc" },
  });
  if (!conversation) return false;

  await prisma.$transaction([
    prisma.message.create({
      data: {
        organizationId,
        conversationId: conversation.id,
        direction: "outbound",
        authorType: "member",
        body: e.text,
        externalId: e.messageId,
        status: "sent",
        sentAt: e.timestamp,
        sentVia: "whatsapp_business_app",
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: e.timestamp,
        unreadCount: 0,
        status: conversation.status === "new" || conversation.status === "needs_attention" ? "open" : conversation.status,
      },
    }),
    prisma.contact.update({
      where: { id: contact.id },
      data: {
        lastOutboundAt: e.timestamp,
        firstMemberReplyAt: contact.firstMemberReplyAt ?? e.timestamp,
        attentionAt: null,
        ...(contact.botEnabled
          ? { botEnabled: false, botChangedAt: e.timestamp, botChangedReason: "human_reply_phone" }
          : {}),
      },
    }),
  ]);
  return true;
}

async function handleStatus(e: StatusEvent, route: ChannelRoute): Promise<void> {
  const map: Record<string, "sent" | "delivered" | "read" | "failed"> = {
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
  };
  const status = map[e.status];
  if (!status) return;
  await prisma.message.updateMany({
    where: { organizationId: route.organizationId, externalId: e.messageId },
    data: { status, statusAt: e.timestamp, errorCode: e.errorCode, errorMessage: e.errorMessage },
  });
}

export async function ingestWhatsAppEvent(e: WhatsAppEvent): Promise<"processed" | "duplicate" | "ignored" | "failed"> {
  const key = eventKey(e);
  let stored;
  try {
    stored = await prisma.webhookEvent.create({
      data: { provider: "whatsapp", eventKey: key, eventType: e.kind, payload: e as unknown as Prisma.InputJsonValue },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const prior = await prisma.webhookEvent.findUnique({ where: { provider_eventKey: { provider: "whatsapp", eventKey: key } } });
      if (prior?.status === "processed" || prior?.status === "ignored") return "duplicate";
      stored = prior;
    } else {
      throw error;
    }
  }
  if (!stored) return "failed";

  const route = await resolveChannel(e.phoneNumberId);
  if (!route) {
    await prisma.webhookEvent.update({ where: { id: stored.id }, data: { status: "ignored", error: "unknown_phone_number_id" } });
    return "ignored";
  }

  try {
    let handled = true;
    if (e.kind === "message") await handleMessage(e, route);
    else if (e.kind === "echo") handled = await handleEcho(e, route);
    else await handleStatus(e, route);
    await prisma.webhookEvent.update({
      where: { id: stored.id },
      data: { status: handled ? "processed" : "ignored", organizationId: route.organizationId, processedAt: new Date(), attempts: { increment: 1 } },
    });
    return handled ? "processed" : "ignored";
  } catch (error) {
    console.error("ingestWhatsAppEvent failed:", error);
    await prisma.webhookEvent.update({
      where: { id: stored.id },
      data: { status: "failed", organizationId: route.organizationId, error: error instanceof Error ? error.message : String(error), attempts: { increment: 1 } },
    });
    return "failed";
  }
}
