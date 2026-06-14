"use server";

import { z } from "zod";

import { getTenantContext, requirePermission } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/result";
import { confirmCreateTask, handleCopilotMessage } from "@/modules/copilot/server/copilot";
import type { CopilotResponse } from "@/modules/copilot/types";

const sendSchema = z.object({ message: z.string().trim().min(1).max(1000) });

export async function copilotSend(input: unknown): Promise<ActionResult<CopilotResponse>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "copilot.use");
  } catch {
    return fail("No tienes permiso para usar el copiloto.");
  }
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return fail("Mensaje inválido.");
  try {
    const response = await handleCopilotMessage(ctx, parsed.data.message);
    return ok(response);
  } catch (error) {
    console.error("copilotSend failed:", error);
    return fail("No pude procesar tu solicitud. Inténtalo de nuevo.");
  }
}

const confirmSchema = z.object({
  kind: z.literal("create_task"),
  payload: z.record(z.string(), z.string()),
});

export async function copilotConfirm(input: unknown): Promise<ActionResult<CopilotResponse>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "copilot.use");
  } catch {
    return fail("No tienes permiso.");
  }
  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return fail("Acción inválida.");
  try {
    const response = await confirmCreateTask(ctx, parsed.data.payload);
    return ok(response);
  } catch (error) {
    console.error("copilotConfirm failed:", error);
    return fail("No se pudo completar la acción.");
  }
}
