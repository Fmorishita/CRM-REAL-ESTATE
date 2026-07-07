"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { ROLE_PERMISSIONS, type Role } from "@/config/permissions";
import { getRealTenantContext } from "@/lib/auth/session";
import { canUseViewAs, VIEW_AS_COOKIE, VIEW_AS_ROLES } from "@/lib/auth/view-as";
import { fail, ok, type ActionResult } from "@/lib/result";

/**
 * Starts a read-only "ver como" preview of a lower role. Authorized against the
 * *real* context (never the previewed one) and only allows roles whose
 * permissions the real user already has, so it can't be used to escalate.
 */
export async function enterViewAs(role: string): Promise<ActionResult<void>> {
  const real = await getRealTenantContext();
  if (!canUseViewAs(real.permissions)) {
    return fail("No tienes permiso para usar la vista previa.");
  }
  if (!VIEW_AS_ROLES.includes(role as Role)) {
    return fail("Rol no válido para vista previa.");
  }
  const target = role as Role;
  if (target === real.role) {
    return fail("Ese ya es tu rol.");
  }
  const targetPermissions = ROLE_PERMISSIONS[target];
  if (!targetPermissions.every((permission) => real.permissions.includes(permission))) {
    return fail("Solo puedes previsualizar roles con menos permisos que el tuyo.");
  }

  (await cookies()).set(VIEW_AS_COOKIE, target, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  revalidatePath("/", "layout");
  return ok(undefined);
}

export async function exitViewAs(): Promise<ActionResult<void>> {
  (await cookies()).delete(VIEW_AS_COOKIE);
  revalidatePath("/", "layout");
  return ok(undefined);
}
