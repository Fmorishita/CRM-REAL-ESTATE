import "server-only";

import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { SERVICE_WINDOW_MS } from "@/lib/leadops/rules";

export interface LeadPulse {
  today: number;
  week: number;
  attention: number;
  windowOpen: number;
  unassigned: number;
}

/** Five cheap counts for the dashboard header (one round trip, in parallel). */
export async function getLeadPulse(ctx: TenantContext): Promise<LeadPulse> {
  if (isDemoMode()) return { today: 3, week: 14, attention: 2, windowOpen: 4, unassigned: 1 };
  const organizationId = ctx.organization.id;
  const now = Date.now();
  const startOfDay = new Date(new Date().toLocaleString("en-US", { timeZone: ctx.organization.timezone }));
  startOfDay.setHours(0, 0, 0, 0);
  const offset = new Date().getTime() - new Date(new Date().toLocaleString("en-US", { timeZone: ctx.organization.timezone })).getTime();
  const dayStart = new Date(startOfDay.getTime() + offset);
  const isLead = { organizationId, deletedAt: null, attributions: { some: {} } };
  const [today, week, attention, windowOpen, unassigned] = await Promise.all([
    prisma.contact.count({ where: { ...isLead, createdAt: { gte: dayStart } } }),
    prisma.contact.count({ where: { ...isLead, createdAt: { gte: new Date(now - 7 * 86_400_000) } } }),
    prisma.contact.count({ where: { organizationId, deletedAt: null, attentionAt: { not: null }, blockedAt: null } }),
    prisma.contact.count({ where: { organizationId, deletedAt: null, lastInboundAt: { gte: new Date(now - SERVICE_WINDOW_MS) }, blockedAt: null } }),
    prisma.contact.count({ where: { ...isLead, assignedMembershipId: null, archivedAt: null } }),
  ]);
  return { today, week, attention, windowOpen, unassigned };
}
