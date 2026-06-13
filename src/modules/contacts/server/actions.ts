"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getTenantContext, requirePermission } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { fail, ok, type ActionResult } from "@/lib/result";
import { createContactSchema, updateContactSchema } from "@/modules/contacts/schemas";

const DEMO_ERROR = "Acción no disponible en modo demo. Configura la base de datos para guardar cambios.";

export async function createContact(input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "contacts.create");
  } catch {
    return fail("No tienes permiso para crear contactos.");
  }

  const parsed = createContactSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Revisa los campos del formulario.", z.flattenError(parsed.error).fieldErrors);
  }
  if (isDemoMode()) return fail(DEMO_ERROR);

  const { preference, ...data } = parsed.data;
  try {
    const contact = await prisma.contact.create({
      data: {
        organizationId: ctx.organization.id,
        type: data.type,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        leadSourceId: data.leadSourceId,
        stage: data.stage,
        assignedMembershipId: data.assignedMembershipId,
        lastContactAt: new Date(),
        preference: preference
          ? {
              create: {
                budgetMin: preference.budgetMin,
                budgetMax: preference.budgetMax,
                currency: preference.currency,
                zones: preference.zones,
                propertyTypes: preference.propertyTypes,
                bedroomsMin: preference.bedroomsMin,
                bathroomsMin: preference.bathroomsMin,
                amenities: preference.amenities,
                purchaseReason: preference.purchaseReason,
                urgency: preference.urgency,
              },
            }
          : undefined,
      },
    });
    await auditLog(ctx, "contact.create", { type: "contact", id: contact.id });
    revalidatePath("/contacts");
    return ok({ id: contact.id });
  } catch (error) {
    console.error("createContact failed:", error);
    return fail("No se pudo crear el contacto.");
  }
}

export async function updateContact(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "contacts.edit");
  } catch {
    return fail("No tienes permiso para editar contactos.");
  }

  const parsed = updateContactSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Revisa los campos del formulario.", z.flattenError(parsed.error).fieldErrors);
  }
  if (isDemoMode()) return fail(DEMO_ERROR);

  const data = parsed.data;
  try {
    const existing = await prisma.contact.findFirst({
      where: { id, organizationId: ctx.organization.id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return fail("Contacto no encontrado.");

    await prisma.contact.update({
      where: { id },
      data: {
        type: data.type,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        leadSourceId: data.leadSourceId,
        stage: data.stage,
        assignedMembershipId: data.assignedMembershipId,
      },
    });
    await auditLog(ctx, "contact.update", { type: "contact", id });
    revalidatePath("/contacts");
    revalidatePath(`/contacts/${id}`);
    return ok({ id });
  } catch (error) {
    console.error("updateContact failed:", error);
    return fail("No se pudo actualizar el contacto.");
  }
}

const noteSchema = z.object({
  contactId: z.string().uuid(),
  body: z.string().trim().min(1, "La nota no puede estar vacía").max(2000),
});

export async function addContactNote(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "contacts.edit");
  } catch {
    return fail("No tienes permiso para agregar notas.");
  }
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Nota inválida.");
  }
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    await prisma.note.create({
      data: {
        organizationId: ctx.organization.id,
        entityType: "contact",
        entityId: parsed.data.contactId,
        membershipId: ctx.membership.id,
        body: parsed.data.body,
      },
    });
    revalidatePath(`/contacts/${parsed.data.contactId}`);
    return ok(undefined);
  } catch (error) {
    console.error("addContactNote failed:", error);
    return fail("No se pudo guardar la nota.");
  }
}

const moveStageSchema = z.object({
  contactId: z.string().uuid(),
  stage: z.string().min(1),
});

export async function moveContactStage(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "contacts.edit");
  } catch {
    return fail("No tienes permiso para mover contactos.");
  }
  const parsed = moveStageSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    const existing = await prisma.contact.findFirst({
      where: { id: parsed.data.contactId, organizationId: ctx.organization.id },
      select: { id: true },
    });
    if (!existing) return fail("Contacto no encontrado.");
    await prisma.contact.update({ where: { id: parsed.data.contactId }, data: { stage: parsed.data.stage } });
    await auditLog(ctx, "contact.stage_change", {
      type: "contact",
      id: parsed.data.contactId,
      metadata: { stage: parsed.data.stage },
    });
    revalidatePath("/contacts");
    return ok(undefined);
  } catch (error) {
    console.error("moveContactStage failed:", error);
    return fail("No se pudo mover el contacto.");
  }
}
