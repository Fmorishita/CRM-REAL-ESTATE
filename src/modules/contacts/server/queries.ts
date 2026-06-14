import "server-only";

import type { Prisma } from "@prisma/client";

import { contactTypeLabel } from "@/config/stages";
import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatDayMonth, formatRelativeTime } from "@/lib/format";
import { demoContactDetail, demoContactList, DEMO_FORM_OPTIONS } from "@/modules/contacts/demo";
import type {
  ContactDetail,
  ContactFilters,
  ContactFormOptions,
  ContactListItem,
  ContactListResult,
  TimelineEntry,
} from "@/modules/contacts/types";

const RELATION_LABELS: Record<string, string> = {
  favorite: "Favorita",
  viewed: "Vista",
  recommended: "Recomendada",
  visited: "Visitada",
  offered: "Con oferta",
};

function buildWhere(organizationId: string, filters: ContactFilters): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = { organizationId, deletedAt: null };
  if (filters.type) where.type = filters.type as Prisma.ContactWhereInput["type"];
  if (filters.stage) where.stage = filters.stage;
  if (filters.assignedMembershipId) where.assignedMembershipId = filters.assignedMembershipId;
  if (filters.tag) where.tags = { some: { tag: { name: filters.tag } } };
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { whatsapp: { contains: q } },
    ];
  }
  return where;
}

function budgetLabel(
  min: Prisma.Decimal | null,
  max: Prisma.Decimal | null,
  currency: string,
  locale: string,
): string | null {
  const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });
  if (min != null && max != null) return `${cur(Number(min))} – ${cur(Number(max))}`;
  if (max != null) return `Hasta ${cur(Number(max))}`;
  if (min != null) return `Desde ${cur(Number(min))}`;
  return null;
}

const listInclude = {
  preference: true,
  assignedMembership: { include: { user: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.ContactInclude;

function toListItem(
  c: Prisma.ContactGetPayload<{ include: typeof listInclude }>,
  currency: string,
  locale: string,
): ContactListItem {
  return {
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    type: c.type,
    typeLabel: contactTypeLabel(c.type),
    email: c.email,
    phone: c.phone,
    whatsapp: c.whatsapp,
    stage: c.stage,
    score: c.score,
    assignedName: c.assignedMembership?.user.name ?? null,
    lastContactLabel: c.lastContactAt ? formatRelativeTime(c.lastContactAt, locale) : null,
    budgetLabel: budgetLabel(c.preference?.budgetMin ?? null, c.preference?.budgetMax ?? null, currency, locale),
    zone: c.preference?.zones[0] ?? null,
    tags: c.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
  };
}

export async function listContacts(ctx: TenantContext, filters: ContactFilters = {}): Promise<ContactListResult> {
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  if (isDemoMode()) {
    let items = demoContactList(ctx);
    items = applyDemoFilters(items, filters);
    return { items, total: items.length };
  }
  try {
    const where = buildWhere(ctx.organization.id, filters);
    const [rows, total] = await Promise.all([
      prisma.contact.findMany({ where, include: listInclude, orderBy: { score: "desc" }, take: 200 }),
      prisma.contact.count({ where }),
    ]);
    return { items: rows.map((c) => toListItem(c, currency, locale)), total };
  } catch (error) {
    console.error("listContacts failed, falling back to demo data:", error);
    const items = applyDemoFilters(demoContactList(ctx), filters);
    return { items, total: items.length };
  }
}

function applyDemoFilters(items: ContactListItem[], filters: ContactFilters): ContactListItem[] {
  return items.filter((c) => {
    if (filters.type && c.type !== filters.type) return false;
    if (filters.stage && c.stage !== filters.stage) return false;
    if (filters.tag && !c.tags.some((t) => t.name === filters.tag)) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${c.name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export async function getContact(ctx: TenantContext, id: string): Promise<ContactDetail | null> {
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  if (isDemoMode()) return demoContactDetail(ctx, id);
  try {
    const c = await prisma.contact.findFirst({
      where: { id, organizationId: ctx.organization.id, deletedAt: null },
      include: {
        ...listInclude,
        opportunities: { include: { property: true }, orderBy: { updatedAt: "desc" } },
        visits: { include: { property: true }, orderBy: { scheduledAt: "desc" }, take: 10 },
        conversations: { include: { channelAccount: true }, orderBy: { lastMessageAt: "desc" }, take: 10 },
        properties: { include: { property: true } },
      },
    });
    if (!c) return null;

    const notes = await prisma.note.findMany({
      where: { organizationId: ctx.organization.id, entityType: "contact", entityId: id },
      include: { membership: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });

    const base = toListItem(c, currency, locale);
    const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });

    const timeline: TimelineEntry[] = [];
    timeline.push({
      id: `created-${c.id}`,
      kind: "created",
      title: "Contacto creado",
      at: c.createdAt.toISOString(),
      atLabel: formatRelativeTime(c.createdAt, locale),
    });
    for (const note of notes) {
      timeline.push({
        id: `note-${note.id}`,
        kind: "note",
        title: "Nota agregada",
        detail: note.body,
        at: note.createdAt.toISOString(),
        atLabel: formatRelativeTime(note.createdAt, locale),
      });
    }
    for (const opp of c.opportunities) {
      timeline.push({
        id: `opp-${opp.id}`,
        kind: "opportunity",
        title: `Oportunidad · ${cur(Number(opp.amount))}`,
        detail: opp.title,
        at: opp.createdAt.toISOString(),
        atLabel: formatRelativeTime(opp.createdAt, locale),
      });
    }
    for (const visit of c.visits) {
      timeline.push({
        id: `visit-${visit.id}`,
        kind: "visit",
        title: `Visita · ${visit.property.title}`,
        detail: visit.notes ?? undefined,
        at: visit.scheduledAt.toISOString(),
        atLabel: formatDayMonth(visit.scheduledAt, locale),
      });
    }
    for (const conv of c.conversations) {
      timeline.push({
        id: `conv-${conv.id}`,
        kind: "conversation",
        title: `Conversación · ${conv.channelAccount.channel}`,
        detail: conv.aiSummary ?? undefined,
        at: (conv.lastMessageAt ?? conv.createdAt).toISOString(),
        atLabel: formatRelativeTime(conv.lastMessageAt ?? conv.createdAt, locale),
      });
    }
    timeline.sort((a, b) => b.at.localeCompare(a.at));

    return {
      ...base,
      createdAtLabel: formatRelativeTime(c.createdAt, locale),
      nextFollowUpLabel: c.nextFollowUpAt ? formatRelativeTime(c.nextFollowUpAt, locale) : null,
      closeProbability: c.closeProbability,
      preference: c.preference
        ? {
            budgetLabel: budgetLabel(c.preference.budgetMin, c.preference.budgetMax, currency, locale),
            zones: c.preference.zones,
            propertyTypes: c.preference.propertyTypes,
            bedroomsMin: c.preference.bedroomsMin,
            bathroomsMin: c.preference.bathroomsMin,
            amenities: c.preference.amenities,
            purchaseReason: c.preference.purchaseReason,
            urgency: c.preference.urgency,
          }
        : null,
      notes: notes.map((n) => ({
        id: n.id,
        body: n.body,
        authorName: n.membership?.user.name ?? null,
        atLabel: formatRelativeTime(n.createdAt, locale),
      })),
      timeline,
      properties: c.properties.map((cp) => ({
        id: cp.propertyId,
        title: cp.property.title,
        relation: cp.relation,
        relationLabel: RELATION_LABELS[cp.relation] ?? cp.relation,
        priceLabel: cur(Number(cp.property.price)),
      })),
      openOpportunities: c.opportunities.filter((o) => o.closedAt == null).length,
    };
  } catch (error) {
    console.error("getContact failed, falling back to demo data:", error);
    return demoContactDetail(ctx, id);
  }
}

export async function getContactFormOptions(ctx: TenantContext): Promise<ContactFormOptions> {
  if (isDemoMode()) return DEMO_FORM_OPTIONS;
  try {
    const [leadSources, members, tags] = await Promise.all([
      prisma.leadSource.findMany({ where: { organizationId: ctx.organization.id }, orderBy: { name: "asc" } }),
      prisma.membership.findMany({
        where: { organizationId: ctx.organization.id, status: "active" },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.tag.findMany({ where: { organizationId: ctx.organization.id }, orderBy: { name: "asc" } }),
    ]);
    return {
      leadSources: leadSources.map((l) => ({ id: l.id, name: l.name })),
      members: members.map((m) => ({ id: m.id, name: m.user.name })),
      tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    };
  } catch (error) {
    console.error("getContactFormOptions failed, falling back to demo data:", error);
    return DEMO_FORM_OPTIONS;
  }
}
