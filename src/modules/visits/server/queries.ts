import "server-only";

import type { Prisma } from "@prisma/client";

import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatDayMonth, formatTime } from "@/lib/format";
import { DEMO_VISIT_FORM_OPTIONS, demoVisits } from "@/modules/visits/demo";
import type { VisitFilters, VisitFormOptions, VisitView } from "@/modules/visits/types";

const include = {
  contact: true,
  property: true,
  assignedMembership: { include: { user: true } },
} satisfies Prisma.VisitInclude;

function dayBounds(date?: string): { gte: Date; lt: Date } {
  const base = date ? new Date(`${date}T00:00:00`) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { gte: start, lt: end };
}

function toView(
  ctx: TenantContext,
  v: Prisma.VisitGetPayload<{ include: typeof include }>,
): VisitView {
  const locale = ctx.organization.defaultLocale;
  const tz = ctx.organization.timezone;
  const locationParts = [v.property.zone, v.property.city].filter(Boolean) as string[];
  return {
    id: v.id,
    contactId: v.contactId,
    contactName: `${v.contact.firstName} ${v.contact.lastName}`,
    propertyId: v.propertyId,
    propertyTitle: v.property.title,
    agentName: v.assignedMembership?.user.name ?? null,
    scheduledAtIso: v.scheduledAt.toISOString(),
    dayLabel: formatDayMonth(v.scheduledAt, locale, tz),
    timeLabel: formatTime(v.scheduledAt, locale, tz),
    durationMin: v.durationMin,
    status: v.status,
    notes: v.notes,
    feedback: v.feedback,
    locationLabel: locationParts.length ? locationParts.join(", ") : null,
    lat: v.property.lat,
    lng: v.property.lng,
    mapsQuery:
      v.property.lat != null && v.property.lng != null
        ? `${v.property.lat},${v.property.lng}`
        : [v.property.title, ...locationParts].join(" ") || null,
  };
}

export async function listVisits(ctx: TenantContext, filters: VisitFilters = {}): Promise<VisitView[]> {
  if (isDemoMode()) return demoVisits(ctx, filters);
  try {
    const bounds = dayBounds(filters.date);
    const where: Prisma.VisitWhereInput = {
      organizationId: ctx.organization.id,
      scheduledAt: { gte: bounds.gte, lt: bounds.lt },
    };
    if (filters.agentId) where.assignedMembershipId = filters.agentId;
    const rows = await prisma.visit.findMany({ where, include, orderBy: { scheduledAt: "asc" } });
    return rows.map((v) => toView(ctx, v));
  } catch (error) {
    console.error("listVisits failed, falling back to demo:", error);
    return demoVisits(ctx, filters);
  }
}

export async function getVisitFormOptions(ctx: TenantContext): Promise<VisitFormOptions> {
  if (isDemoMode()) return DEMO_VISIT_FORM_OPTIONS;
  try {
    const organizationId = ctx.organization.id;
    const [contacts, properties, members] = await Promise.all([
      prisma.contact.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { firstName: "asc" },
        take: 500,
        select: { id: true, firstName: true, lastName: true },
      }),
      prisma.property.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { title: "asc" },
        take: 500,
        select: { id: true, title: true },
      }),
      prisma.membership.findMany({ where: { organizationId, status: "active" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    ]);
    return {
      contacts: contacts.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` })),
      properties: properties.map((p) => ({ id: p.id, title: p.title })),
      members: members.map((m) => ({ id: m.id, name: m.user.name })),
    };
  } catch (error) {
    console.error("getVisitFormOptions failed, falling back to demo:", error);
    return DEMO_VISIT_FORM_OPTIONS;
  }
}
