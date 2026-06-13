import "server-only";

import type { Prisma } from "@prisma/client";

import { OPEN_STATUSES } from "@/config/channels";
import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatRelativeTime, formatTime } from "@/lib/format";
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
} from "@/modules/inbox/types";

const listInclude = {
  contact: true,
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
  };
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
    console.error("getInboxData failed, falling back to demo data:", error);
    return demoInboxData(filters);
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
        contact: true,
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
    }));

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
    };
  } catch (error) {
    console.error("getConversation failed, falling back to demo data:", error);
    return demoConversationDetail(id);
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
    console.error("getInboxOptions failed, falling back to demo data:", error);
    return DEMO_INBOX_OPTIONS;
  }
}

export { demoFirstConversationId };
export { OPEN_STATUSES };
