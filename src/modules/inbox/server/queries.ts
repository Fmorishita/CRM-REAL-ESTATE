import "server-only";

import type { Prisma } from "@prisma/client";

import { OPEN_STATUSES } from "@/config/channels";
import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatRelativeTime, formatTime } from "@/lib/format";
import { parseFactValue } from "@/lib/leadops/qualification";
import { SERVICE_WINDOW_MS, isServiceWindowOpen } from "@/lib/leadops/rules";
import {
  DEFAULT_QUICK_REPLIES,
  DEMO_INBOX_OPTIONS,
  demoConversationDetail,
  demoFirstConversationId,
  demoInboxData,
} from "@/modules/inbox/demo";
import type {
  ChatMessage,
  ConversationDetail,
  ConversationListItem,
  InboxData,
  InboxFilters,
  InboxOptions,
  LeadFactState,
  LeadState,
} from "@/modules/inbox/types";

const listInclude = {
  contact: { include: { facts: { select: { key: true, value: true } } } },
  channelAccount: true,
  assignedMembership: { include: { user: true } },
  messages: { orderBy: { sentAt: "desc" }, take: 1 },
} satisfies Prisma.ConversationInclude;

function contactName(contact: { firstName: string; lastName: string } | null): string {
  return contact ? `${contact.firstName} ${contact.lastName}` : "Sin contacto";
}

function toListItem(
  c: Prisma.ConversationGetPayload<{ include: typeof listInclude }>,
  locale: string,
): ConversationListItem {
  const last = c.messages[0];
  return {
    id: c.id,
    channel: c.channelAccount.channel,
    contactId: c.contactId,
    contactName: contactName(c.contact),
    status: c.status,
    priority: c.priority,
    snippet: last?.body ?? c.aiSummary ?? "",
    lastMessageLabel: c.lastMessageAt ? formatRelativeTime(c.lastMessageAt, locale) : null,
    unreadCount: c.unreadCount,
    assignedName: c.assignedMembership?.user.name ?? null,
    ...(c.contact && ["whatsapp", "instagram", "facebook"].includes(c.channelAccount.channel)
      ? {
          attention: Boolean(c.contact.attentionAt),
          windowOpen: isServiceWindowOpen(c.contact.lastInboundAt),
          factsCount: c.contact.facts.length,
        }
      : {}),
  };
}

function leadWhere(lead: InboxFilters["lead"]): Prisma.ConversationWhereInput {
  const windowStart = new Date(Date.now() - SERVICE_WINDOW_MS);
  switch (lead) {
    case "attention":
      return { contact: { attentionAt: { not: null }, blockedAt: null } };
    case "window_open":
      return { contact: { lastInboundAt: { gte: windowStart }, blockedAt: null } };
    case "window_closed":
      return { contact: { waId: { not: null }, OR: [{ lastInboundAt: null }, { lastInboundAt: { lt: windowStart } }] } };
    case "hot":
      return {
        contact: {
          AND: [
            { facts: { some: { key: "timeline", value: { in: ["immediate", "1_3m"] } } } },
            { facts: { some: { key: "contact_preference", value: { in: ["in_person", "video_call"] } } } },
          ],
        },
      };
    default:
      return {};
  }
}

export async function getInboxData(ctx: TenantContext, filters: InboxFilters = {}): Promise<InboxData> {
  if (isDemoMode()) return demoInboxData(filters);
  try {
    const organizationId = ctx.organization.id;
    const where: Prisma.ConversationWhereInput = { organizationId };
    if (filters.channel) where.channelAccount = { channel: filters.channel as never };
    if (filters.status) where.status = filters.status as never;
    if (filters.assignedMembershipId) where.assignedMembershipId = filters.assignedMembershipId;
    if (filters.unassigned) where.assignedMembershipId = null;
    if (filters.lead) Object.assign(where, leadWhere(filters.lead));
    // Archived leads leave the default view (archive only hides; nothing is deleted).
    if (!filters.lead) where.OR = [{ contactId: null }, { contact: { archivedAt: null } }];

    const [rows, all, unassigned, needsAttention] = await Promise.all([
      prisma.conversation.findMany({ where, include: listInclude, orderBy: { lastMessageAt: "desc" }, take: 100 }),
      prisma.conversation.count({ where: { organizationId } }),
      prisma.conversation.count({ where: { organizationId, assignedMembershipId: null } }),
      prisma.conversation.count({ where: { organizationId, status: "needs_attention" } }),
    ]);

    return {
      conversations: rows.map((c) => toListItem(c, ctx.organization.defaultLocale)),
      counts: { all, unassigned, needsAttention },
    };
  } catch (error) {
    console.error("getInboxData failed:", error);
    throw error;
  }
}

export async function getConversation(ctx: TenantContext, id: string): Promise<ConversationDetail | null> {
  if (isDemoMode()) return demoConversationDetail(id);
  try {
    const locale = ctx.organization.defaultLocale;
    const timezone = ctx.organization.timezone;
    const c = await prisma.conversation.findFirst({
      where: { id, organizationId: ctx.organization.id },
      include: {
        contact: {
          include: {
            facts: true,
            attributions: { where: { isFirstTouch: true }, take: 1 },
          },
        },
        channelAccount: true,
        assignedMembership: { include: { user: true } },
        messages: { orderBy: { sentAt: "asc" }, take: 200, include: {} },
      },
    });
    if (!c) return null;

    // Resolve member authors for outbound messages.
    const memberIds = [...new Set(c.messages.map((m) => m.authorMembershipId).filter(Boolean) as string[])];
    const members = memberIds.length
      ? await prisma.membership.findMany({ where: { id: { in: memberIds } }, include: { user: true } })
      : [];
    const memberName = new Map(members.map((m) => [m.id, m.user.name]));

    const notes = await prisma.note.findMany({
      where: { organizationId: ctx.organization.id, entityType: "conversation", entityId: id },
      include: { membership: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });

    const messages: ChatMessage[] = c.messages.map((m) => ({
      id: m.id,
      direction: m.direction,
      authorType: m.authorType,
      authorName:
        m.authorType === "member"
          ? (m.authorMembershipId ? memberName.get(m.authorMembershipId) ?? null : null)
          : m.authorType === "contact"
            ? contactName(c.contact)
            : m.authorType === "ai"
              ? "IA"
              : "Sistema",
      body: m.body,
      timeLabel: formatTime(m.sentAt, locale, timezone),
      status: m.status,
      sentVia: m.sentVia,
      error: m.errorMessage,
    }));

    const ct = c.contact;
    const lead: LeadState | null =
      ct && (ct.waId || ["whatsapp", "instagram", "facebook"].includes(c.channelAccount.channel))
        ? {
            contactId: ct.id,
            botEnabled: ct.botEnabled,
            botChangedReason: ct.botChangedReason,
            reactEnabled: ct.reactEnabled,
            blocked: Boolean(ct.blockedAt),
            archived: Boolean(ct.archivedAt),
            attention: Boolean(ct.attentionAt),
            windowOpen: isServiceWindowOpen(ct.lastInboundAt),
            windowClosesAt:
              ct.lastInboundAt && isServiceWindowOpen(ct.lastInboundAt)
                ? new Date(ct.lastInboundAt.getTime() + SERVICE_WINDOW_MS).toISOString()
                : null,
            stars: ct.stars,
            subStage: ct.subStage,
            outcome: ct.outcome,
            facts: ct.facts.map(
              (f): LeadFactState => ({ key: f.key, values: parseFactValue(f.value), source: f.source }),
            ),
            origin: ct.attributions[0]?.channel ?? null,
            adName: ct.attributions[0]?.adName ?? ct.attributions[0]?.headline ?? null,
          }
        : null;

    return {
      id: c.id,
      channel: c.channelAccount.channel,
      contactId: c.contactId,
      contactName: contactName(c.contact),
      contactPhone: c.contact?.whatsapp ?? c.contact?.phone ?? null,
      status: c.status,
      priority: c.priority,
      assignedMembershipId: c.assignedMembershipId,
      assignedName: c.assignedMembership?.user.name ?? null,
      aiSummary: c.aiSummary,
      aiIntent: c.aiIntent,
      aiSentiment: c.aiSentiment,
      messages,
      internalNotes: notes.map((n) => ({
        id: n.id,
        body: n.body,
        authorName: n.membership?.user.name ?? null,
        atLabel: formatRelativeTime(n.createdAt, locale),
      })),
      lead,
    };
  } catch (error) {
    console.error("getConversation failed:", error);
    throw error;
  }
}

export async function getFirstConversationId(ctx: TenantContext, filters: InboxFilters = {}): Promise<string | null> {
  const data = await getInboxData(ctx, filters);
  return data.conversations[0]?.id ?? null;
}

export async function getInboxOptions(ctx: TenantContext): Promise<InboxOptions> {
  if (isDemoMode()) return DEMO_INBOX_OPTIONS;
  try {
    const organizationId = ctx.organization.id;
    const { defaultLocale: locale } = ctx.organization;
    const [members, quickReplies, properties] = await Promise.all([
      prisma.membership.findMany({ where: { organizationId, status: "active" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
      prisma.quickReply.findMany({ where: { organizationId }, orderBy: { title: "asc" } }),
      prisma.property.findMany({
        where: { organizationId, deletedAt: null, status: "available" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, title: true, price: true, currency: true },
      }),
    ]);
    return {
      members: members.map((m) => ({ id: m.id, name: m.user.name })),
      quickReplies: quickReplies.length
        ? quickReplies.map((q) => ({ id: q.id, title: q.title, body: q.body }))
        : DEFAULT_QUICK_REPLIES,
      properties: properties.map((p) => ({
        id: p.id,
        title: p.title,
        priceLabel: formatCurrency(Number(p.price), p.currency, locale, { maximumFractionDigits: 0 }),
      })),
    };
  } catch (error) {
    console.error("getInboxOptions failed:", error);
    throw error;
  }
}

export { demoFirstConversationId };
export { OPEN_STATUSES };
