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

/**
 * On sign-in, accept any pending invitations for this email: link the Supabase
 * auth id to the app user and flip `invited` memberships to `active`. Safe to call
 * repeatedly; a no-op when there is nothing pending.
 */
export async function activateInvitedMemberships(email: string, authId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return;
  if (!user.authId) {
    await prisma.user.update({ where: { id: user.id }, data: { authId } });
  }
  await prisma.membership.updateMany({
    where: { userId: user.id, status: "invited" },
    data: { status: "active" },
  });
}

/**
 * Resolves the tenant context for an authenticated user, matched by email. The
 * active organization is the user's first active membership unless a preferred
 * org id (e.g. from a tenant switcher cookie) is supplied and still valid.
 * Returns null when the email maps to no active membership — the caller then
 * denies access instead of falling back to any demo/owner context.
 */
export async function resolveTenantForEmail(
  email: string,
  preferredOrgId?: string,
): Promise<TenantContext | null> {
  const memberships = await prisma.membership.findMany({
    where: { status: "active", user: { email } },
    include: { organization: true, user: true, role: true },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) return null;

  const active =
    (preferredOrgId ? memberships.find((m) => m.organizationId === preferredOrgId) : undefined) ??
    memberships[0]!;

  return {
    organization: toOrganization(active.organization),
    user: {
      id: active.user.id,
      name: active.user.name,
      email: active.user.email,
      avatarUrl: active.user.avatarUrl ?? undefined,
    },
    membership: {
      id: active.id,
      organizationId: active.organizationId,
      userId: active.userId,
      role: active.role.key as Role,
      status: active.status,
    },
    role: active.role.key as Role,
    permissions: active.role.permissions as Permission[],
    organizations: memberships.map((m) => toOrganization(m.organization)),
  };
}
