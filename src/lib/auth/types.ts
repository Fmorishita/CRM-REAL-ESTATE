import type { Permission, Role } from "@/config/permissions";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  country: string;
  defaultCurrency: string;
  defaultLocale: string;
  timezone: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  status: "active" | "invited" | "suspended";
}

/**
 * Everything a request needs to act on behalf of a user inside one tenant.
 * Always resolved server-side from the session — never from client input.
 */
export interface TenantContext {
  organization: Organization;
  user: SessionUser;
  membership: Membership;
  role: Role;
  permissions: Permission[];
  /** Other organizations the user belongs to (for the tenant switcher). */
  organizations: Organization[];
}
