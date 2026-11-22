"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auditLog } from "@/lib/audit";
import { getTenantContext, requirePermission } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/result";
import { publishToFacebook, publishToInstagram, socialConfig } from "@/lib/social/meta";

const schema = z
  .object({
    text: z.string().trim().min(1, "Escribe el texto de la publicación.").max(2200),
    imageUrl: z.string().trim().url("La imagen debe ser un enlace https.").startsWith("https://", "La imagen debe ser un enlace https.").optional().or(z.literal("")),
    facebook: z.boolean(),
    instagram: z.boolean(),
    scheduledAt: z.coerce.date().optional(),
  })
  .refine((v) => v.facebook || v.instagram, { message: "Elige al menos una red." })
  .refine((v) => !v.instagram || Boolean(v.imageUrl), { message: "Instagram requiere una imagen." })
  .refine((v) => !v.scheduledAt || !v.instagram, { message: "Instagram no permite programar desde la API: publica ahora o solo en Facebook." })
  .refine(
    (v) => !v.scheduledAt || (v.scheduledAt.getTime() > Date.now() + 10 * 60_000 && v.scheduledAt.getTime() < Date.now() + 30 * 86_400_000),
    { message: "Programa entre 10 minutos y 30 días a partir de ahora." },
  );

export async function publishPost(input: unknown): Promise<ActionResult<{ results: string[] }>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "properties.publish");
  } catch {
    return fail("No tienes permiso para publicar en redes.");
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  if (!socialConfig().connected) return fail("Conecta la página de Facebook (token de página) para publicar.");

  const { text, imageUrl, facebook, instagram, scheduledAt } = parsed.data;
  const results: string[] = [];
  const errors: string[] = [];
  if (facebook) {
    try {
      await publishToFacebook({ message: text, imageUrl: imageUrl || undefined, scheduledAt });
      results.push(scheduledAt ? "Facebook (programada)" : "Facebook");
    } catch (e) {
      errors.push(`Facebook: ${e instanceof Error ? e.message : "error"}`);
    }
  }
  if (instagram && imageUrl) {
    try {
      await publishToInstagram({ caption: text, imageUrl });
      results.push("Instagram");
    } catch (e) {
      errors.push(`Instagram: ${e instanceof Error ? e.message : "error"}`);
    }
  }
  await auditLog(ctx, "social.publish", { type: "social_post", id: "meta", metadata: { results, errors, scheduled: Boolean(scheduledAt) } });
  revalidatePath("/social");
  if (results.length === 0) return fail(errors.join(" · "));
  return ok({ results: errors.length ? [...results, `Falló: ${errors.join(" · ")}`] : results });
}
