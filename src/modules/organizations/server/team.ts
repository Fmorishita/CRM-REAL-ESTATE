import "server-only";

import { prisma } from "@/lib/db/prisma";
import { isDemoMode } from "@/lib/db";
import { DEMO_TEAM, type DemoTeamMember } from "@/lib/demo/session";
import type { Role } from "@/config/permissions";

/** Team roster for the settings screen. Reads from the DB, falls back to demo data. */
export async function listTeam(organizationId: string): Promise<DemoTeamMember[]> {
  if (isDemoMode()) return DEMO_TEAM;
  try {
    const memberships = await prisma.membership.findMany({
      where: { organizationId },
      include: { user: true, role: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((m) => ({
      id: m.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role.key as Role,
      status: m.status,
    }));
  } catch (error) {
    console.error("listTeam failed, falling back to demo data:", error);
    return DEMO_TEAM;
  }
}
