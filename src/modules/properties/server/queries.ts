import "server-only";

import type { Prisma } from "@prisma/client";

import { operationLabel, propertyTypeLabel } from "@/config/properties";
import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatDayMonth, formatRelativeTime } from "@/lib/format";
import {
  DEMO_PROPERTY_FORM_OPTIONS,
  demoPropertyDetail,
  demoPropertyList,
} from "@/modules/properties/demo";
import type {
  PropertyDetail,
  PropertyFilters,
  PropertyFormOptions,
  PropertyListItem,
  PropertyListResult,
} from "@/modules/properties/types";

const RELATION_LABELS: Record<string, string> = {
  favorite: "Favorita",
  viewed: "Vista",
  recommended: "Recomendada",
  visited: "Visitada",
  offered: "Con oferta",
};

const listInclude = {
  media: { orderBy: { position: "asc" }, take: 1 },
  _count: { select: { contacts: true, views: true } },
} satisfies Prisma.PropertyInclude;

function priceLabel(amount: number, currency: string, locale: string): string {
  return formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 });
}

function toListItem(
  p: Prisma.PropertyGetPayload<{ include: typeof listInclude }>,
  currency: string,
  locale: string,
): PropertyListItem {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    type: p.propertyType,
    typeLabel: propertyTypeLabel(p.propertyType),
    operation: p.operation,
    operationLabel: operationLabel(p.operation),
    status: p.status,
    priceLabel: priceLabel(Number(p.price), currency, locale),
    zone: p.zone,
    city: p.city,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    builtM2: p.builtM2,
    coverUrl: p.media[0]?.url ?? null,
    interest: p._count.contacts + p._count.views,
  };
}

function buildWhere(organizationId: string, filters: PropertyFilters): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = { organizationId, deletedAt: null };
  if (filters.type) where.propertyType = filters.type as Prisma.PropertyWhereInput["propertyType"];
  if (filters.status) where.status = filters.status as Prisma.PropertyWhereInput["status"];
  if (filters.operation) where.operation = filters.operation as Prisma.PropertyWhereInput["operation"];
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { zone: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listProperties(
  ctx: TenantContext,
  filters: PropertyFilters = {},
): Promise<PropertyListResult> {
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  if (isDemoMode()) {
    const items = applyDemoFilters(demoPropertyList(ctx), filters);
    return { items, total: items.length };
  }
  try {
    const where = buildWhere(ctx.organization.id, filters);
    const [rows, total] = await Promise.all([
      prisma.property.findMany({ where, include: listInclude, orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.property.count({ where }),
    ]);
    return { items: rows.map((p) => toListItem(p, currency, locale)), total };
  } catch (error) {
    console.error("listProperties failed, falling back to demo data:", error);
    const items = applyDemoFilters(demoPropertyList(ctx), filters);
    return { items, total: items.length };
  }
}

function applyDemoFilters(items: PropertyListItem[], filters: PropertyFilters): PropertyListItem[] {
  return items.filter((p) => {
    if (filters.type && p.type !== filters.type) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.operation && p.operation !== filters.operation) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${p.title} ${p.zone ?? ""} ${p.city ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export async function getProperty(ctx: TenantContext, idOrSlug: string): Promise<PropertyDetail | null> {
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  if (isDemoMode()) return demoPropertyDetail(ctx, idOrSlug);
  try {
    const p = await prisma.property.findFirst({
      where: {
        organizationId: ctx.organization.id,
        deletedAt: null,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        media: { orderBy: { position: "asc" } },
        _count: { select: { contacts: true, views: true } },
        assignedMembership: { include: { user: true } },
        contacts: { include: { contact: true }, take: 20 },
      },
    });
    if (!p) return null;

    const base = toListItem({ ...p, media: p.media.slice(0, 1) }, currency, locale);
    return {
      ...base,
      description: p.description,
      amenities: p.amenities,
      media: p.media.map((m) => ({ id: m.id, url: m.url, alt: m.alt, kind: m.kind })),
      lat: p.lat,
      lng: p.lng,
      state: p.state,
      country: p.country,
      parking: p.parking,
      lotSizeM2: p.lotSizeM2,
      commissionPct: p.commissionPct,
      developerName: p.developerName,
      deliveryDateLabel: p.deliveryDate ? formatDayMonth(p.deliveryDate, locale) : null,
      assignedName: p.assignedMembership?.user.name ?? null,
      createdAtLabel: formatRelativeTime(p.createdAt, locale),
      interestedLeads: p.contacts.map((cp) => ({
        contactId: cp.contactId,
        name: `${cp.contact.firstName} ${cp.contact.lastName}`,
        relation: cp.relation,
        relationLabel: RELATION_LABELS[cp.relation] ?? cp.relation,
      })),
    };
  } catch (error) {
    console.error("getProperty failed, falling back to demo data:", error);
    return demoPropertyDetail(ctx, idOrSlug);
  }
}

export async function getPropertyFormOptions(ctx: TenantContext): Promise<PropertyFormOptions> {
  if (isDemoMode()) return DEMO_PROPERTY_FORM_OPTIONS;
  try {
    const members = await prisma.membership.findMany({
      where: { organizationId: ctx.organization.id, status: "active" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
    return { members: members.map((m) => ({ id: m.id, name: m.user.name })) };
  } catch (error) {
    console.error("getPropertyFormOptions failed, falling back to demo data:", error);
    return DEMO_PROPERTY_FORM_OPTIONS;
  }
}
