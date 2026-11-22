import "server-only";

import { prisma } from "@/lib/db/prisma";

/**
 * Organization that receives inbound leads (WhatsApp webhook, website form).
 * LEADOPS_ORGANIZATION_SLUG picks it explicitly; without it, a single-tenant
 * deployment uses its only organization. With several and no slug, nothing is
 * guessed and the lead is ignored (logged on the webhook event).
 */
export async function resolveLeadOrganizationId(): Promise<string | null> {
  const slug = process.env.LEADOPS_ORGANIZATION_SLUG?.trim();
  if (slug) {
    const org = await prisma.organization.findUnique({ where: { slug }, select: { id: true } });
    return org?.id ?? null;
  }
  const orgs = await prisma.organization.findMany({ select: { id: true }, take: 2, orderBy: { createdAt: "asc" } });
  return orgs.length === 1 ? orgs[0]!.id : null;
}
