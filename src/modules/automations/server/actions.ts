"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ACTIONS, AUTOMATION_TEMPLATES, TRIGGERS } from "@/config/automations";
import { getTenantContext, requirePermission } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { fail, ok, type ActionResult } from "@/lib/result";

const DEMO_ERROR = "Acción no disponible en modo demo. Configura la base de datos para guardar cambios.";

async function guard() {
  const ctx = await getTenantContext();
  requirePermission(ctx, "automations.manage");
  return ctx;
}

export async function createFromTemplate(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = z.object({ templateKey: z.string() }).safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  let ctx;
  try {
    ctx = await guard();
  } catch {
    return fail("No tienes permiso para crear automatizaciones.");
  }
  if (isDemoMode()) return fail(DEMO_ERROR);

  const template = AUTOMATION_TEMPLATES.find((t) => t.key === parsed.data.templateKey);
  if (!template) return fail("Plantilla no encontrada.");
  try {
    const automation = await prisma.automation.create({
      data: {
        organizationId: ctx.organization.id,
        name: template.name,
        status: "active",
        trigger: template.trigger as never,
        conditions: template.conditions as never,
        actions: template.actions as never,
        templateKey: template.key,
      },
    });
    await auditLog(ctx, "automation.create", { type: "automation", id: automation.id });
    revalidatePath("/automations");
    return ok({ id: automation.id });
  } catch (error) {
    console.error("createFromTemplate failed:", error);
    return fail("No se pudo crear la automatización.");
  }
}

const customSchema = z.object({
  name: z.string().trim().min(1).max(120),
  triggerType: z.enum(Object.keys(TRIGGERS) as [string, ...string[]]),
  actionTypes: z.array(z.enum(Object.keys(ACTIONS) as [string, ...string[]])).min(1, "Selecciona al menos una acción"),
});

export async function createCustomAutomation(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = customSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  let ctx;
  try {
    ctx = await guard();
  } catch {
    return fail("No tienes permiso para crear automatizaciones.");
  }
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    const automation = await prisma.automation.create({
      data: {
        organizationId: ctx.organization.id,
        name: parsed.data.name,
        status: "draft",
        trigger: { type: parsed.data.triggerType } as never,
        conditions: [] as never,
        actions: parsed.data.actionTypes.map((type) => ({ type })) as never,
      },
    });
    await auditLog(ctx, "automation.create", { type: "automation", id: automation.id });
    revalidatePath("/automations");
    return ok({ id: automation.id });
  } catch (error) {
    console.error("createCustomAutomation failed:", error);
    return fail("No se pudo crear la automatización.");
  }
}

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "active", "inactive"]),
});

export async function setAutomationStatus(input: unknown): Promise<ActionResult<void>> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  let ctx;
  try {
    ctx = await guard();
  } catch {
    return fail("No tienes permiso.");
  }
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    const existing = await prisma.automation.findFirst({
      where: { id: parsed.data.id, organizationId: ctx.organization.id },
      select: { id: true },
    });
    if (!existing) return fail("Automatización no encontrada.");
    await prisma.automation.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
    revalidatePath("/automations");
    revalidatePath(`/automations/${parsed.data.id}`);
    return ok(undefined);
  } catch (error) {
    console.error("setAutomationStatus failed:", error);
    return fail("No se pudo actualizar el estado.");
  }
}

/** Simulated execution: records a run with all action steps as successful. */
export async function runAutomationNow(input: unknown): Promise<ActionResult<void>> {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  let ctx;
  try {
    ctx = await guard();
  } catch {
    return fail("No tienes permiso.");
  }
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    const automation = await prisma.automation.findFirst({
      where: { id: parsed.data.id, organizationId: ctx.organization.id },
    });
    if (!automation) return fail("Automatización no encontrada.");
    const actions = (automation.actions ?? []) as { type: string }[];
    await prisma.automationRun.create({
      data: {
        organizationId: ctx.organization.id,
        automationId: automation.id,
        status: "success",
        steps: actions.map((a) => ({ type: a.type, status: "success" })) as never,
        finishedAt: new Date(),
      },
    });
    revalidatePath(`/automations/${parsed.data.id}`);
    return ok(undefined);
  } catch (error) {
    console.error("runAutomationNow failed:", error);
    return fail("No se pudo ejecutar la automatización.");
  }
}

export async function deleteAutomation(input: unknown): Promise<ActionResult<void>> {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  let ctx;
  try {
    ctx = await guard();
  } catch {
    return fail("No tienes permiso.");
  }
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    const existing = await prisma.automation.findFirst({
      where: { id: parsed.data.id, organizationId: ctx.organization.id },
      select: { id: true },
    });
    if (!existing) return fail("Automatización no encontrada.");
    await prisma.automation.delete({ where: { id: parsed.data.id } });
    await auditLog(ctx, "automation.delete", { type: "automation", id: parsed.data.id });
    revalidatePath("/automations");
    return ok(undefined);
  } catch (error) {
    console.error("deleteAutomation failed:", error);
    return fail("No se pudo eliminar la automatización.");
  }
}
