import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { socialEventKey, type SocialMessageEvent } from "@/lib/leadops/meta-messaging";
import { extractFactsFromText } from "@/lib/leadops/qualification";
import { fetchSocialProfile } from "@/lib/social/meta";
import { persistRemoteMedia } from "@/lib/media/storage";
import { applyFacts } from "@/modules/leadops/server/facts";
import { chooseAssignee } from "@/modules/leadops/server/ingest";
import { resolveLeadOrganizationId } from "@/modules/leadops/server/organization";

/**
 * Instagram Direct + Facebook Messenger → the same lead model as WhatsApp:
 * one contact per sender, one conversation per channel, assignment, ad
 * attribution and keyword capture of the 5 answers. Idempotent per message id.
 */

type Route = { id: string; organizationId: string };

async function resolveSocialChannel(e: SocialMessageEvent): Promise<Route | null> {
  const channel = e.network;
  const existing = await prisma.channelAccount.findUnique({
    where: { channel_externalId: { channel, externalId: e.accountId } },
    select: { id: true, organizationId: true },
  });
  if (existing) return existing;
  const expected = channel === "facebook" ? process.env.META_PAGE_ID?.trim() : process.env.META_IG_USER_ID?.trim();
  if (!expected || expected !== e.accountId) return null;
  const organizationId = await resolveLeadOrganizationId();
  if (!organizationId) return null;
  return prisma.channelAccount.create({
    data: {
      organizationId,
      channel,
      name: channel === "facebook" ? "Facebook Messenger" : "Instagram Direct",
      status: "connected",
      externalId: e.accountId,
    },
    select: { id: true, organizationId: true },
  });
}

/** Meta's attachment links expire within hours: keep our own copy of each file. */
async function persistAttachments(organizationId: string, items: SocialMessageEvent["media"]) {
  const out = await Promise.all(
    items.map(async (m) => {
      if (!m.url) return null;
      const kind = (["image", "video", "audio"] as const).find((k) => k === m.type) ?? "document";
      const stored = await persistRemoteMedia(organizationId, { url: m.url, type: kind });
      return stored ?? { type: kind, url: m.url };
    }),
  );
  return out.filter((m): m is NonNullable<typeof m> => m !== null);
}

/** A contact still carrying the placeholder name because the profile lookup had failed. */
export function hasPlaceholderName(firstName: string, lastName: string): boolean {
  return !lastName && /^Contacto de (Instagram|Messenger)$/.test(firstName);
}

/** Returns a warning (kept on the webhook event) when the profile could not be read. */
async function handleInbound(e: SocialMessageEvent, route: Route): Promise<string | null> {
  let warning: string | null = null;
  const { organizationId } = route;
  let conversation = await prisma.conversation.findFirst({
    where: { organizationId, channelAccountId: route.id, externalId: e.userId },
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });
  let contact = conversation?.contact ?? null;
  const isNew = !contact;

  if (!contact) {
    const lookup = await fetchSocialProfile(e.network, e.userId);
    if (!lookup.profile) warning = `perfil: ${lookup.error}`;
    const profile = lookup.profile;
    contact = await prisma.contact.create({
      data: {
        organizationId,
        firstName: profile?.firstName || (e.network === "instagram" ? "Contacto de Instagram" : "Contacto de Messenger"),
        lastName: profile?.lastName ?? "",
        stage: "new",
        firstContactAt: e.timestamp,
        whatsappName: profile?.username ? `@${profile.username}` : null,
      },
    });
  } else if (hasPlaceholderName(contact.firstName, contact.lastName)) {
    // Retry on every message until Meta gives us a name.
    const lookup = await fetchSocialProfile(e.network, e.userId);
    if (lookup.profile) {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          firstName: lookup.profile.firstName,
          lastName: lookup.profile.lastName,
          whatsappName: lookup.profile.username ? `@${lookup.profile.username}` : contact.whatsappName,
        },
      });
    } else {
      warning = `perfil: ${lookup.error}`;
    }
  }

  // Attribution: every ad touch is kept; the first touch is credited.
  const hasFirstTouch = await prisma.leadAttribution.count({ where: { contactId: contact.id, isFirstTouch: true } });
  if (e.referral?.adId || (e.referral && e.referral.source === "ADS")) {
    await prisma.leadAttribution.create({
      data: {
        organizationId,
        contactId: contact.id,
        channel: e.network === "instagram" ? "instagram_ad" : "messenger_ad",
        platform: e.network,
        adId: e.referral.adId,
        sourceType: e.referral.source,
        headline: e.referral.headline,
        isFirstTouch: hasFirstTouch === 0,
        occurredAt: e.timestamp,
        raw: e.referral.raw as Prisma.InputJsonValue,
      },
    });
  } else if (isNew) {
    await prisma.leadAttribution.create({
      data: {
        organizationId,
        contactId: contact.id,
        channel: e.network === "instagram" ? "organic_instagram" : "organic_messenger",
        platform: e.network,
        isFirstTouch: true,
        occurredAt: e.timestamp,
      },
    });
  }

  if (!contact.assignedMembershipId) {
    const { membershipId, reason } = await chooseAssignee(organizationId);
    if (membershipId) {
      contact = await prisma.contact.update({ where: { id: contact.id }, data: { assignedMembershipId: membershipId } });
      await prisma.assignmentLog.create({ data: { organizationId, contactId: contact.id, toMembershipId: membershipId, reason } });
    }
  }

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        organizationId,
        channelAccountId: route.id,
        contactId: contact.id,
        externalId: e.userId,
        status: "new",
        assignedMembershipId: contact.assignedMembershipId,
      },
      include: { contact: true },
    });
  }

  const storedMedia = await persistAttachments(organizationId, e.media);

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
        media: storedMedia.length ? (storedMedia as unknown as Prisma.InputJsonValue) : undefined,
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

  const facts = extractFactsFromText(e.text);
  if (Object.keys(facts).length > 0) await applyFacts(organizationId, contact.id, facts, "system");
  return warning;
}

/** Reply typed in Meta Business Suite / the phone app: mirrored as human, bot off. */
async function handleEcho(e: SocialMessageEvent, route: Route): Promise<boolean> {
  const conversation = await prisma.conversation.findFirst({
    where: { organizationId: route.organizationId, channelAccountId: route.id, externalId: e.userId },
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });
  if (!conversation) return false;
  const contact = conversation.contact;
  const echoMedia = await persistAttachments(route.organizationId, e.media);
  await prisma.$transaction([
    prisma.message.create({
      data: {
        organizationId: route.organizationId,
        conversationId: conversation.id,
        direction: "outbound",
        authorType: "member",
        body: e.text,
        externalId: e.messageId,
        status: "sent",
        sentAt: e.timestamp,
        sentVia: "meta_inbox",
        media: echoMedia.length ? (echoMedia as unknown as Prisma.InputJsonValue) : undefined,
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: e.timestamp, unreadCount: 0, status: conversation.status === "new" ? "open" : conversation.status },
    }),
    ...(contact
      ? [
          prisma.contact.update({
            where: { id: contact.id },
            data: {
              lastOutboundAt: e.timestamp,
              firstMemberReplyAt: contact.firstMemberReplyAt ?? e.timestamp,
              attentionAt: null,
              ...(contact.botEnabled ? { botEnabled: false, botChangedAt: e.timestamp, botChangedReason: "human_reply_meta" } : {}),
            },
          }),
        ]
      : []),
  ]);
  return true;
}

export async function ingestSocialEvent(e: SocialMessageEvent): Promise<"processed" | "duplicate" | "ignored" | "failed"> {
  const key = socialEventKey(e);
  let stored;
  try {
    stored = await prisma.webhookEvent.create({
      data: { provider: "meta", eventKey: key, eventType: e.isEcho ? "echo" : "message", payload: e as unknown as Prisma.InputJsonValue },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const prior = await prisma.webhookEvent.findUnique({ where: { provider_eventKey: { provider: "meta", eventKey: key } } });
      if (prior?.status === "processed" || prior?.status === "ignored") return "duplicate";
      stored = prior;
    } else {
      throw error;
    }
  }
  if (!stored) return "failed";

  const route = await resolveSocialChannel(e);
  const finish = (status: "processed" | "ignored" | "failed", extra: Prisma.WebhookEventUpdateInput = {}) =>
    prisma.webhookEvent.update({
      where: { id: stored.id },
      data: { status, organizationId: route?.organizationId, processedAt: new Date(), attempts: { increment: 1 }, ...extra },
    });

  if (!route) {
    await finish("ignored", { error: "unknown_account_id" });
    return "ignored";
  }
  // Messages this CRM sent are already stored under the same id: skip their echo.
  const already = await prisma.message.count({ where: { organizationId: route.organizationId, externalId: e.messageId } });
  if (already) {
    await finish("ignored", { error: "already_recorded" });
    return "duplicate";
  }
  try {
    let warning: string | null = null;
    let handled = true;
    if (e.isEcho) handled = await handleEcho(e, route);
    else warning = await handleInbound(e, route);
    await finish(handled ? "processed" : "ignored", warning ? { error: warning } : {});
    return handled ? "processed" : "ignored";
  } catch (error) {
    console.error("ingestSocialEvent failed:", error);
    await finish("failed", { error: error instanceof Error ? error.message : String(error) });
    return "failed";
  }
}
