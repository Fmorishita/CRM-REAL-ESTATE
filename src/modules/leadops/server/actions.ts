"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auditLog } from "@/lib/audit";
import { getTenantContext, requirePermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_FACT_KEYS } from "@/lib/leadops/rules";
import { fail, ok, type ActionResult } from "@/lib/result";
import { reportMilestone } from "@/modules/leadops/server/capi";

const DEMO = "Modo demo: los cambios no se guardan.";

const toggleSchema = z.object({
  contactId: z.string().uuid(),
  control: z.enum(["bot", "react", "archive", "block"]),
  enabled: z.boolean(),
  reason: z.string().trim().max(200).optional(),
});

/**
 * Bot, reactivators, archive and block are independent controls:
 * archive only hides; block stops every send (manual and automated).
 */
export async function setLeadControl(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "conversations.reply");
  } catch {
    return fail("No tienes permiso para gestionar este lead.");
  }
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO);
  const { contactId, control, enabled, reason } = parsed.data;
  const now = new Date();

  const data =
    control === "bot"
      ? { botEnabled: enabled, botChangedAt: now, botChangedReason: reason ?? "manual", botChangedByMembershipId: ctx.membership.id }
      : control === "react"
        ? { reactEnabled: enabled, reactChangedAt: now, reactChangedReason: reason ?? "manual" }
        : control === "archive"
          ? { archivedAt: enabled ? now : null }
          : { blockedAt: enabled ? now : null, blockedReason: enabled ? (reason ?? "manual") : null };

  const res = await prisma.contact.updateMany({ where: { id: contactId, organizationId: ctx.organization.id }, data });
  if (res.count === 0) return fail("Contacto no encontrado.");
  await auditLog(ctx, `lead.${control}.${enabled ? "on" : "off"}`, { type: "contact", id: contactId, metadata: { reason } });
  revalidatePath("/leads");
  revalidatePath("/inbox");
  return ok(undefined);
}

const manageSchema = z.object({
  contactId: z.string().uuid(),
  stars: z.number().int().min(0).max(5).nullable().optional(),
  subStage: z.string().trim().max(60).nullable().optional(),
  outcome: z.enum(["open", "won", "lost"]).optional(),
  outcomeReason: z.string().trim().max(200).nullable().optional(),
  qualified: z.boolean().optional(),
  dealValue: z.number().positive().optional(),
});

/** Human rating, commercial stage and outcome. Milestones are reported to Meta (CAPI). */
export async function updateLeadManagement(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "contacts.edit");
  } catch {
    return fail("No tienes permiso para editar leads.");
  }
  const parsed = manageSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO);
  const { contactId, qualified, dealValue, ...fields } = parsed.data;

  const contact = await prisma.contact.findFirst({ where: { id: contactId, organizationId: ctx.organization.id } });
  if (!contact) return fail("Contacto no encontrado.");

  await prisma.contact.update({ where: { id: contactId }, data: fields });
  await auditLog(ctx, "lead.manage", { type: "contact", id: contactId, metadata: { ...fields, qualified } });

  if (qualified) await reportMilestone(ctx.organization.id, contactId, "lead_qualified");
  if (fields.outcome === "won" && contact.outcome !== "won") {
    await reportMilestone(ctx.organization.id, contactId, "deal_won", {
      value: dealValue,
      currency: ctx.organization.defaultCurrency,
    });
  }
  revalidatePath("/leads");
  return ok(undefined);
}

const factSchema = z.object({
  contactId: z.string().uuid(),
  key: z.enum(DEFAULT_FACT_KEYS),
  value: z.string().trim().max(200),
});

/** Advisor correction of a captured data point. Source becomes "advisor" — never disguised as AI. */
export async function setContactFact(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "contacts.edit");
  } catch {
    return fail("No tienes permiso para editar leads.");
  }
  const parsed = factSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO);
  const { contactId, key, value } = parsed.data;
  const owned = await prisma.contact.count({ where: { id: contactId, organizationId: ctx.organization.id } });
  if (!owned) return fail("Contacto no encontrado.");

  if (value === "") {
    await prisma.contactFact.deleteMany({ where: { contactId, key } });
  } else {
    await prisma.contactFact.upsert({
      where: { contactId_key: { contactId, key } },
      create: { organizationId: ctx.organization.id, contactId, key, value, source: "advisor", capturedByMembershipId: ctx.membership.id },
      update: { value, source: "advisor", capturedByMembershipId: ctx.membership.id, capturedAt: new Date() },
    });
  }
  await auditLog(ctx, "lead.fact", { type: "contact", id: contactId, metadata: { key } });
  if (key === "visit_intent" && value) await reportMilestone(ctx.organization.id, contactId, "visit_scheduled");
  revalidatePath("/leads");
  return ok(undefined);
}

const reassignSchema = z.object({ contactId: z.string().uuid(), membershipId: z.string().uuid().nullable() });

export async function reassignLead(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "pipeline.manage");
  } catch {
    return fail("No tienes permiso para reasignar leads.");
  }
  const parsed = reassignSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO);
  const { contactId, membershipId } = parsed.data;

  const contact = await prisma.contact.findFirst({ where: { id: contactId, organizationId: ctx.organization.id } });
  if (!contact) return fail("Contacto no encontrado.");
  if (membershipId) {
    const member = await prisma.membership.count({ where: { id: membershipId, organizationId: ctx.organization.id, status: "active" } });
    if (!member) return fail("Asesor no válido.");
  }
  await prisma.$transaction([
    prisma.contact.update({ where: { id: contactId }, data: { assignedMembershipId: membershipId } }),
    prisma.conversation.updateMany({ where: { contactId, organizationId: ctx.organization.id }, data: { assignedMembershipId: membershipId } }),
    prisma.assignmentLog.create({
      data: {
        organizationId: ctx.organization.id,
        contactId,
        fromMembershipId: contact.assignedMembershipId,
        toMembershipId: membershipId,
        reason: "manual",
        actorMembershipId: ctx.membership.id,
      },
    }),
  ]);
  await auditLog(ctx, "lead.reassign", { type: "contact", id: contactId, metadata: { to: membershipId } });
  revalidatePath("/leads");
  return ok(undefined);
}
