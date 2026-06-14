"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getTenantContext } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { fail, ok, type ActionResult } from "@/lib/result";

const DEMO_ERROR = "Acción no disponible en modo demo. Configura la base de datos para guardar cambios.";

const taskSchema = z.object({ title: z.string().trim().min(1, "Escribe la tarea").max(200) });

/** Quick personal task assigned to the current user, due tomorrow. */
export async function createQuickTask(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    await prisma.task.create({
      data: {
        organizationId: ctx.organization.id,
        title: parsed.data.title,
        priority: "medium",
        dueAt: new Date(Date.now() + 24 * 3600 * 1000),
        assignedMembershipId: ctx.membership.id,
      },
    });
    revalidatePath("/visits");
    return ok(undefined);
  } catch (error) {
    console.error("createQuickTask failed:", error);
    return fail("No se pudo crear la tarea.");
  }
}

const noteSchema = z.object({ body: z.string().trim().min(1, "Escribe la nota").max(2000) });

/** Quick personal note scoped to the agent (general scratch note). */
export async function createQuickNote(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    await prisma.note.create({
      data: {
        organizationId: ctx.organization.id,
        entityType: "general",
        entityId: ctx.membership.id,
        membershipId: ctx.membership.id,
        body: parsed.data.body,
      },
    });
    return ok(undefined);
  } catch (error) {
    console.error("createQuickNote failed:", error);
    return fail("No se pudo guardar la nota.");
  }
}
