import "server-only";

import { redirect } from "next/navigation";

import type { Permission } from "@/config/permissions";
import { isAuthEnabled } from "@/lib/auth/config";
import { getAuthUser } from "@/lib/auth/current-user";
import type { TenantContext } from "@/lib/auth/types";
import { applyViewAs, readViewAsRole } from "@/lib/auth/view-as";
import { isDemoMode } from "@/lib/db";
import { demoTenantContext } from "@/lib/demo/session";
import { resolveTenantForEmail, resolveTenantFromDb } from "@/modules/organizations/server/tenant";

/**
 * Resolves the *real* tenant context for the current request (ignoring any
 * "ver como" preview).
 *
 * - **Auth enabled** (Supabase configured, demo off): derives the tenant from the
 *   signed-in user's session, redirecting to `/login` when there is no valid
 *   session or membership. It never falls back to a demo/owner context here —
 *   that would grant access without a real membership.
 * - **Demo mode**: returns the seeded demo tenant so the app runs with zero config.
 * - **DB without auth**: legacy default-owner lookup, with a demo fallback if the
 *   database is unreachable (e.g. during a build).
 *
 * Tenancy is never derived from client input.
 */
export async function getRealTenantContext(): Promise<TenantContext> {
  if (isAuthEnabled()) {
    const authUser = await getAuthUser();
    if (!authUser) redirect("/login");

    let ctx: TenantContext | null = null;
    try {
      ctx = await resolveTenantForEmail(authUser.email);
    } catch (error) {
      console.error("Tenant resolution failed for authenticated user:", error);
      redirect("/login?error=unavailable");
    }
    if (!ctx) redirect("/login?error=no-access");
    return ctx;
  }

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

/**
 * The context used to render and gate the app. Same as the real context, plus a
 * read-only "ver como" role preview when the user has one active.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const real = await getRealTenantContext();
  return applyViewAs(real, await readViewAsRole());
}

export function hasPermission(ctx: TenantContext, permission: Permission): boolean {
  return ctx.permissions.includes(permission);
}

/**
 * Guard for server actions and services. Throws when the permission is missing,
 * and always throws while a read-only "ver como" preview is active so a preview
 * can never mutate data.
 */
export function requirePermission(ctx: TenantContext, permission: Permission): void {
  if (ctx.viewAs) {
    throw new Error("Vista previa de solo lectura: sal de la vista previa para hacer cambios.");
  }
  if (!hasPermission(ctx, permission)) {
    throw new Error(`Permiso denegado: ${permission}`);
  }
}
