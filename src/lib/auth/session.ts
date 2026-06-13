import "server-only";

import type { Permission } from "@/config/permissions";
import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { demoTenantContext } from "@/lib/demo/session";
import { resolveTenantFromDb } from "@/modules/organizations/server/tenant";

/**
 * Resolves the tenant context for the current request.
 *
 * Reads from the database unless demo mode is on. If the lookup fails (e.g. the
 * database is unreachable during a build or before seeding), it falls back to the
 * seeded demo tenant so the app never hard-crashes. Supabase Auth will later
 * replace the "default owner" lookup with the signed-in user's session.
 * Tenancy is never derived from client input.
 */
export async function getTenantContext(): Promise<TenantContext> {
  if (isDemoMode()) {
    return demoTenantContext();
  }
  try {
    return await resolveTenantFromDb();
  } catch (error) {
    console.error("Tenant resolution failed, falling back to demo data:", error);
    return demoTenantContext();
  }
}

export function hasPermission(ctx: TenantContext, permission: Permission): boolean {
  return ctx.permissions.includes(permission);
}

/** Guard for server actions and services. Throws when the permission is missing. */
export function requirePermission(ctx: TenantContext, permission: Permission): void {
  if (!hasPermission(ctx, permission)) {
    throw new Error(`Permiso denegado: ${permission}`);
  }
}
