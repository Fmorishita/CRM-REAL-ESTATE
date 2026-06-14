"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getTenantContext, requirePermission } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { fail, ok, type ActionResult } from "@/lib/result";
import { AI_TASK_KEYS } from "@/lib/ai/types";

const updateSchema = z.object({
  taskKey: z.enum(AI_TASK_KEYS),
  provider: z.enum(["mock", "anthropic", "openai", "gemini", "grok", "deepseek"]),
  model: z.string().min(1),
  temperature: z.number().min(0).max(1),
  requiresApproval: z.boolean(),
  enabled: z.boolean(),
});

export async function updateAiTaskConfig(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "ai.configure");
  } catch {
    return fail("No tienes permiso para configurar la IA.");
  }
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) {
    return fail("Acción no disponible en modo demo. Configura la base de datos para guardar cambios.");
  }
  const data = parsed.data;
  try {
    await prisma.aiTaskConfig.upsert({
      where: { organizationId_taskKey: { organizationId: ctx.organization.id, taskKey: data.taskKey } },
      create: {
        organizationId: ctx.organization.id,
        taskKey: data.taskKey,
        provider: data.provider,
        model: data.model,
        temperature: data.temperature,
        requiresApproval: data.requiresApproval,
        enabled: data.enabled,
      },
      update: {
        provider: data.provider,
        model: data.model,
        temperature: data.temperature,
        requiresApproval: data.requiresApproval,
        enabled: data.enabled,
      },
    });
    await auditLog(ctx, "ai.configure", { type: "ai_task_config", id: data.taskKey });
    revalidatePath("/settings/ai");
    return ok(undefined);
  } catch (error) {
    console.error("updateAiTaskConfig failed:", error);
    return fail("No se pudo guardar la configuración.");
  }
}
