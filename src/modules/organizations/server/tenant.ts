import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { Organization, TenantContext } from "@/lib/auth/types";
import type { Permission, Role } from "@/config/permissions";

function toOrganization(org: {
  id: string;
  name: string;
  slug: string;
  plan: string;
  country: string;
  defaultCurrency: string;
  defaultLocale: string;
  timezone: string;
}): Organization {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.plan as Organization["plan"],
    country: org.country,
    defaultCurrency: org.defaultCurrency,
    defaultLocale: org.defaultLocale,
    timezone: org.timezone,
  };
}

/**
 * Resolves the active tenant from the database.
 *
 * Until Supabase Auth lands, the "current user" is the first active owner
 * membership (Frank @ Morishita Realty Group). Auth will replace this lookup
 * with the signed-in user's session; everything downstream stays the same.
 */
export async function resolveTenantFromDb(): Promise<TenantContext> {
  const membership = await prisma.membership.findFirstOrThrow({
    where: { status: "active", role: { key: "owner" } },
    orderBy: { createdAt: "asc" },
    include: { organization: true, user: true, role: true },
  });

  const allMemberships = await prisma.membership.findMany({
    where: { userId: membership.userId },
    include: { organization: true },
  });

  return {
    organization: toOrganization(membership.organization),
    user: {
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      avatarUrl: membership.user.avatarUrl ?? undefined,
    },
    membership: {
      id: membership.id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: membership.role.key as Role,
      status: membership.status,
    },
    role: membership.role.key as Role,
    permissions: membership.role.permissions as Permission[],
    organizations: allMemberships.map((m) => toOrganization(m.organization)),
  };
}
