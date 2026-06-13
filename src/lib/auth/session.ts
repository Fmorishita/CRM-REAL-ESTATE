import "server-only";

import type { Permission } from "@/config/permissions";
import type { TenantContext } from "@/lib/auth/types";
import { demoTenantContext } from "@/lib/demo/session";

/**
 * Resolves the tenant context for the current request.
 *
 * Phase 1: always returns the seeded demo tenant.
 * Phase 2 will resolve the Supabase session and active membership here;
 * callers won't change. Tenancy is never derived from client input.
 */
export async function getTenantContext(): Promise<TenantContext> {
  return demoTenantContext();
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
