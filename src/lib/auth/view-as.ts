import "server-only";

import { cookies } from "next/headers";

import { ROLE_PERMISSIONS, ROLES, type Permission, type Role } from "@/config/permissions";
import type { TenantContext } from "@/lib/auth/types";

export { VIEW_AS_ROLES } from "@/lib/auth/view-as-roles";

export const VIEW_AS_COOKIE = "rp_view_as";

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Only users who manage the team can enter a preview. */
export function canUseViewAs(realPermissions: Permission[]): boolean {
  return realPermissions.includes("users.manage");
}

export async function readViewAsRole(): Promise<Role | null> {
  const raw = (await cookies()).get(VIEW_AS_COOKIE)?.value;
  if (!raw || !isRole(raw)) return null;
  return raw;
}

/**
 * Applies a read-only role preview on top of the real context when: a valid
 * view-as cookie is present, the real user is allowed to preview, and the target
 * role's permissions are a subset of the real ones (never an escalation).
 */
export function applyViewAs(real: TenantContext, targetRole: Role | null): TenantContext {
  if (!targetRole || targetRole === real.role) return real;
  if (!canUseViewAs(real.permissions)) return real;

  const targetPermissions = ROLE_PERMISSIONS[targetRole];
  // Guard against escalation: only preview roles whose permissions you already have.
  if (!targetPermissions.every((permission) => real.permissions.includes(permission))) {
    return real;
  }

  return {
    ...real,
    role: targetRole,
    permissions: targetPermissions,
    viewAs: { realRole: real.role, realPermissions: real.permissions },
  };
}
