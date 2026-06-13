"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getTenantContext, requirePermission } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { fail, ok, type ActionResult } from "@/lib/result";
import { createOpportunitySchema, moveOpportunitySchema } from "@/modules/pipeline/schemas";

const DEMO_ERROR = "Acción no disponible en modo demo. Configura la base de datos para guardar cambios.";

export async function createOpportunity(input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "pipeline.manage");
  } catch {
    return fail("No tienes permiso para crear oportunidades.");
  }
  const parsed = createOpportunitySchema.safeParse(input);
  if (!parsed.success) {
    return fail("Revisa los campos del formulario.", z.flattenError(parsed.error).fieldErrors);
  }
  if (isDemoMode()) return fail(DEMO_ERROR);

  const data = parsed.data;
  try {
    // Verify the stage and contact belong to this tenant.
    const [stage, contact] = await Promise.all([
      prisma.pipelineStage.findFirst({
        where: { id: data.stageId, pipeline: { organizationId: ctx.organization.id } },
      }),
      prisma.contact.findFirst({
        where: { id: data.contactId, organizationId: ctx.organization.id, deletedAt: null },
        select: { id: true },
      }),
    ]);
    if (!stage) return fail("Etapa inválida.");
    if (!contact) return fail("Contacto inválido.");

    const opportunity = await prisma.opportunity.create({
      data: {
        organizationId: ctx.organization.id,
        pipelineId: data.pipelineId,
        stageId: data.stageId,
        contactId: data.contactId,
        propertyId: data.propertyId,
        title: data.title,
        amount: data.amount,
        currency: data.currency,
        commissionAmount: data.commissionAmount,
        probability: data.probability || stage.probability,
        expectedCloseDate: data.expectedCloseDate,
        assignedMembershipId: data.assignedMembershipId,
      },
    });
    await auditLog(ctx, "opportunity.create", { type: "opportunity", id: opportunity.id });
    revalidatePath("/pipeline");
    return ok({ id: opportunity.id });
  } catch (error) {
    console.error("createOpportunity failed:", error);
    return fail("No se pudo crear la oportunidad.");
  }
}

export async function moveOpportunity(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "pipeline.manage");
  } catch {
    return fail("No tienes permiso para mover oportunidades.");
  }
  const parsed = moveOpportunitySchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO_ERROR);

  try {
    const [opp, stage] = await Promise.all([
      prisma.opportunity.findFirst({
        where: { id: parsed.data.opportunityId, organizationId: ctx.organization.id },
        select: { id: true },
      }),
      prisma.pipelineStage.findFirst({
        where: { id: parsed.data.stageId, pipeline: { organizationId: ctx.organization.id } },
        select: { id: true, probability: true, isWon: true, isLost: true },
      }),
    ]);
    if (!opp) return fail("Oportunidad no encontrada.");
    if (!stage) return fail("Etapa inválida.");

    await prisma.opportunity.update({
      where: { id: parsed.data.opportunityId },
      data: {
        stageId: stage.id,
        probability: stage.probability,
        closedAt: stage.isWon || stage.isLost ? new Date() : null,
      },
    });
    await auditLog(ctx, "opportunity.move", {
      type: "opportunity",
      id: parsed.data.opportunityId,
      metadata: { stageId: stage.id },
    });
    revalidatePath("/pipeline");
    return ok(undefined);
  } catch (error) {
    console.error("moveOpportunity failed:", error);
    return fail("No se pudo mover la oportunidad.");
  }
}
