import type { Role } from "@/config/permissions";

/** Roles an admin can hand out via invitation (owner/super_admin/client excluded). */
export const INVITABLE_ROLES = [
  "admin",
  "broker",
  "team_leader",
  "agent",
  "assistant",
  "marketing",
  "viewer",
] as const satisfies readonly Role[];
