"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getTenantContext, requirePermission } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { fail, ok, type ActionResult } from "@/lib/result";
import { VISIT_STATUSES } from "@/config/visits";

const DEMO_ERROR = "Acción no disponible en modo demo. Configura la base de datos para guardar cambios.";

const createSchema = z.object({
  contactId: z.string().uuid(),
  propertyId: z.string().uuid(),
  assignedMembershipId: z.string().uuid().optional(),
  scheduledAt: z.coerce.date(),
  durationMin: z.number().int().min(15).max(480).default(60),
  notes: z.string().trim().max(2000).optional(),
});

export async function createVisit(input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "visits.manage");
  } catch {
    return fail("No tienes permiso para agendar visitas.");
  }
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail("Revisa los campos del formulario.", z.flattenError(parsed.error).fieldErrors);
  if (isDemoMode()) return fail(DEMO_ERROR);

  const data = parsed.data;
  try {
    const [contact, property] = await Promise.all([
      prisma.contact.findFirst({ where: { id: data.contactId, organizationId: ctx.organization.id, deletedAt: null }, select: { id: true } }),
      prisma.property.findFirst({ where: { id: data.propertyId, organizationId: ctx.organization.id, deletedAt: null }, select: { id: true } }),
    ]);
    if (!contact) return fail("Contacto inválido.");
    if (!property) return fail("Propiedad inválida.");

    const visit = await prisma.visit.create({
      data: {
        organizationId: ctx.organization.id,
        contactId: data.contactId,
        propertyId: data.propertyId,
        assignedMembershipId: data.assignedMembershipId ?? ctx.membership.id,
        scheduledAt: data.scheduledAt,
        durationMin: data.durationMin,
        status: "pending",
        notes: data.notes,
      },
    });
    await auditLog(ctx, "visit.create", { type: "visit", id: visit.id });
    revalidatePath("/visits");
    return ok({ id: visit.id });
  } catch (error) {
    console.error("createVisit failed:", error);
    return fail("No se pudo agendar la visita.");
  }
}

const statusSchema = z.object({
  visitId: z.string().uuid(),
  status: z.enum(VISIT_STATUSES),
});

export async function setVisitStatus(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "visits.manage");
  } catch {
    return fail("No tienes permiso.");
  }
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    const visit = await prisma.visit.findFirst({
      where: { id: parsed.data.visitId, organizationId: ctx.organization.id },
      select: { id: true },
    });
    if (!visit) return fail("Visita no encontrada.");
    await prisma.visit.update({ where: { id: parsed.data.visitId }, data: { status: parsed.data.status } });
    revalidatePath("/visits");
    return ok(undefined);
  } catch (error) {
    console.error("setVisitStatus failed:", error);
    return fail("No se pudo actualizar la visita.");
  }
}

const rescheduleSchema = z.object({
  visitId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
});

export async function rescheduleVisit(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "visits.manage");
  } catch {
    return fail("No tienes permiso.");
  }
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    const visit = await prisma.visit.findFirst({
      where: { id: parsed.data.visitId, organizationId: ctx.organization.id },
      select: { id: true },
    });
    if (!visit) return fail("Visita no encontrada.");
    await prisma.visit.update({
      where: { id: parsed.data.visitId },
      data: { scheduledAt: parsed.data.scheduledAt, status: "rescheduled" },
    });
    revalidatePath("/visits");
    return ok(undefined);
  } catch (error) {
    console.error("rescheduleVisit failed:", error);
    return fail("No se pudo reagendar la visita.");
  }
}

const feedbackSchema = z.object({
  visitId: z.string().uuid(),
  feedback: z.string().trim().min(1).max(2000),
  createFollowUp: z.boolean().default(false),
});

export async function addVisitFeedback(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "visits.manage");
  } catch {
    return fail("No tienes permiso.");
  }
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    const visit = await prisma.visit.findFirst({
      where: { id: parsed.data.visitId, organizationId: ctx.organization.id },
      include: { contact: true },
    });
    if (!visit) return fail("Visita no encontrada.");

    await prisma.visit.update({
      where: { id: parsed.data.visitId },
      data: { feedback: parsed.data.feedback, status: "done" },
    });

    if (parsed.data.createFollowUp) {
      await prisma.task.create({
        data: {
          organizationId: ctx.organization.id,
          title: `Seguimiento post-visita: ${visit.contact.firstName} ${visit.contact.lastName}`,
          description: parsed.data.feedback,
          dueAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
          priority: "high",
          assignedMembershipId: visit.assignedMembershipId ?? ctx.membership.id,
          entityType: "contact",
          entityId: visit.contactId,
        },
      });
    }
    await auditLog(ctx, "visit.feedback", { type: "visit", id: parsed.data.visitId });
    revalidatePath("/visits");
    return ok(undefined);
  } catch (error) {
    console.error("addVisitFeedback failed:", error);
    return fail("No se pudo guardar el feedback.");
  }
}
