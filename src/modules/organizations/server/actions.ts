"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auditLog } from "@/lib/audit";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { fail, ok, type ActionResult } from "@/lib/result";
import { INVITABLE_ROLES } from "@/modules/organizations/roles";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(INVITABLE_ROLES),
  name: z.string().trim().max(80).optional(),
});

/**
 * Invites a teammate by email with a role. Creates (or reuses) the user and an
 * `invited` membership in the caller's organization; the person becomes active
 * when they sign in via Supabase Auth with that email. Demo mode simulates the
 * invite without persisting.
 */
export async function inviteTeammate(input: unknown): Promise<ActionResult<{ email: string }>> {
  const ctx = await getTenantContext();
  if (!hasPermission(ctx, "users.manage")) {
    return fail("No tienes permiso para invitar miembros.");
  }

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return fail("Revisa el email y el rol.");

  const email = parsed.data.email.trim().toLowerCase();
  const role = parsed.data.role;
  const name = parsed.data.name?.trim() || (email.split("@")[0] ?? email);

  if (isDemoMode()) {
    // No persistence in demo mode; the form still validates and confirms.
    return ok({ email });
  }

  try {
    const roleRow = await prisma.role.findFirst({ where: { key: role, organizationId: null } });
    if (!roleRow) return fail("Ese rol no está disponible.");

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name },
    });

    const existing = await prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId: ctx.organization.id, userId: user.id } },
    });

    if (existing) {
      if (existing.status === "active") return fail("Esta persona ya es miembro activo.");
      await prisma.membership.update({
        where: { id: existing.id },
        data: { status: "invited", roleId: roleRow.id },
      });
    } else {
      await prisma.membership.create({
        data: {
          organizationId: ctx.organization.id,
          userId: user.id,
          roleId: roleRow.id,
          status: "invited",
        },
      });
    }

    await auditLog(ctx, "team.invite", { type: "membership", id: user.id, metadata: { email, role } });
    revalidatePath("/settings");
    return ok({ email });
  } catch (error) {
    console.error("inviteTeammate failed:", error);
    return fail("No se pudo enviar la invitación. Inténtalo más tarde.");
  }
}
