import type { Role } from "@/config/permissions";

/**
 * Roles offered for the "ver como" preview (client-safe list). You preview a
 * lower role to see what your team sees; owner/super_admin/client are excluded.
 */
export const VIEW_AS_ROLES: Role[] = [
  "admin",
  "broker",
  "team_leader",
  "agent",
  "assistant",
  "marketing",
  "viewer",
];
