"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getTenantContext, requirePermission } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { fail, ok, type ActionResult } from "@/lib/result";
import { slugify } from "@/lib/slug";
import { createPropertySchema, updatePropertySchema } from "@/modules/properties/schemas";

const DEMO_ERROR = "Acción no disponible en modo demo. Configura la base de datos para guardar cambios.";

/** Ensures the slug is unique within the tenant by appending a counter if needed. */
async function uniqueSlug(organizationId: string, base: string, excludeId?: string): Promise<string> {
  const root = base || "propiedad";
  let candidate = root;
  let n = 1;
  // Bounded loop; collisions are rare.
  while (n < 50) {
    const existing = await prisma.property.findFirst({
      where: { organizationId, slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}

export async function createProperty(input: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "properties.manage");
  } catch {
    return fail("No tienes permiso para crear propiedades.");
  }

  const raw = (input ?? {}) as Record<string, unknown>;
  const withSlug = { ...raw, slug: raw.slug || slugify(String(raw.title ?? "")) };
  const parsed = createPropertySchema.safeParse(withSlug);
  if (!parsed.success) {
    return fail("Revisa los campos del formulario.", z.flattenError(parsed.error).fieldErrors);
  }
  if (isDemoMode()) return fail(DEMO_ERROR);

  const data = parsed.data;
  try {
    const slug = await uniqueSlug(ctx.organization.id, data.slug);
    const property = await prisma.property.create({
      data: {
        organizationId: ctx.organization.id,
        title: data.title,
        slug,
        description: data.description,
        propertyType: data.propertyType,
        operation: data.operation,
        status: data.status,
        price: data.price,
        currency: data.currency,
        zone: data.zone,
        city: data.city,
        state: data.state,
        country: data.country,
        lat: data.lat,
        lng: data.lng,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        parking: data.parking,
        lotSizeM2: data.lotSizeM2,
        builtM2: data.builtM2,
        amenities: data.amenities,
        commissionPct: data.commissionPct,
        assignedMembershipId: data.assignedMembershipId,
      },
    });
    await auditLog(ctx, "property.create", { type: "property", id: property.id });
    revalidatePath("/properties");
    return ok({ id: property.id, slug: property.slug });
  } catch (error) {
    console.error("createProperty failed:", error);
    return fail("No se pudo crear la propiedad.");
  }
}

export async function updateProperty(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "properties.manage");
  } catch {
    return fail("No tienes permiso para editar propiedades.");
  }
  const parsed = updatePropertySchema.safeParse(input);
  if (!parsed.success) {
    return fail("Revisa los campos del formulario.", z.flattenError(parsed.error).fieldErrors);
  }
  if (isDemoMode()) return fail(DEMO_ERROR);

  const data = parsed.data;
  try {
    const existing = await prisma.property.findFirst({
      where: { id, organizationId: ctx.organization.id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return fail("Propiedad no encontrada.");

    await prisma.property.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        operation: data.operation,
        status: data.status,
        price: data.price,
        currency: data.currency,
        zone: data.zone,
        city: data.city,
        state: data.state,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        parking: data.parking,
        lotSizeM2: data.lotSizeM2,
        builtM2: data.builtM2,
        amenities: data.amenities,
        commissionPct: data.commissionPct,
        assignedMembershipId: data.assignedMembershipId,
      },
    });
    await auditLog(ctx, "property.update", { type: "property", id });
    revalidatePath("/properties");
    revalidatePath(`/properties/${id}`);
    return ok({ id });
  } catch (error) {
    console.error("updateProperty failed:", error);
    return fail("No se pudo actualizar la propiedad.");
  }
}
