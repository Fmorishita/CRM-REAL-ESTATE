import { ROLE_PERMISSIONS } from "@/config/permissions";
import type { Membership, Organization, SessionUser, TenantContext } from "@/lib/auth/types";

/**
 * Demo tenant used until Supabase Auth lands in Phase 2.
 * Mirrors the shape the real session resolver will return.
 */

export const DEMO_ORGANIZATIONS: Organization[] = [
  {
    id: "org_morishita",
    name: "Morishita Realty Group",
    slug: "morishita-realty",
    plan: "pro",
    country: "MX",
    defaultCurrency: "MXN",
    defaultLocale: "es-MX",
    timezone: "America/Tijuana",
  },
  {
    id: "org_bajaliving",
    name: "Baja Living Premium",
    slug: "baja-living",
    plan: "starter",
    country: "MX",
    defaultCurrency: "USD",
    defaultLocale: "es-MX",
    timezone: "America/Tijuana",
  },
];

export const DEMO_USER: SessionUser = {
  id: "user_frank",
  name: "Frank Morishita",
  email: "frank@morishitarealty.mx",
};

const DEMO_MEMBERSHIP: Membership = {
  id: "mem_frank_morishita",
  organizationId: "org_morishita",
  userId: DEMO_USER.id,
  role: "owner",
  status: "active",
};

export interface DemoTeamMember {
  id: string;
  name: string;
  email: string;
  role: Membership["role"];
  status: Membership["status"];
}

export const DEMO_TEAM: DemoTeamMember[] = [
  { id: "mem_frank_morishita", name: "Frank Morishita", email: "frank@morishitarealty.mx", role: "owner", status: "active" },
  { id: "mem_sofia", name: "Sofía Hernández", email: "sofia@morishitarealty.mx", role: "team_leader", status: "active" },
  { id: "mem_carlos", name: "Carlos Mendoza", email: "carlos@morishitarealty.mx", role: "agent", status: "active" },
  { id: "mem_mariana", name: "Mariana Lopez", email: "mariana@morishitarealty.mx", role: "agent", status: "active" },
  { id: "mem_diego", name: "Diego Ramírez", email: "diego@morishitarealty.mx", role: "marketing", status: "active" },
  { id: "mem_lucia", name: "Lucía Treviño", email: "lucia@morishitarealty.mx", role: "assistant", status: "invited" },
];

export function demoTenantContext(): TenantContext {
  const organization = DEMO_ORGANIZATIONS[0];
  if (!organization) {
    throw new Error("Demo data misconfigured: no organizations defined");
  }
  return {
    organization,
    user: DEMO_USER,
    membership: DEMO_MEMBERSHIP,
    role: DEMO_MEMBERSHIP.role,
    permissions: ROLE_PERMISSIONS[DEMO_MEMBERSHIP.role],
    organizations: DEMO_ORGANIZATIONS,
  };
}
