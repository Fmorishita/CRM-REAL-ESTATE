"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auditLog } from "@/lib/audit";
import { getTenantContext, requirePermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { extractLeadFacts } from "@/lib/ai/runners";
import {
  QUALIFICATION_KEYS,
  QUALIFICATION_QUESTIONS,
  extractFactsFromText,
  normalizeFactValue,
  parseAiFacts,
} from "@/lib/leadops/qualification";
import { fail, ok, type ActionResult } from "@/lib/result";
import { reportMilestone } from "@/modules/leadops/server/capi";
import { applyFacts } from "@/modules/leadops/server/facts";

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

  const qualifiesByStars = (fields.stars ?? 0) >= 3;
  if (qualified || qualifiesByStars) await reportMilestone(ctx.organization.id, contactId, "lead_qualified");
  if (fields.outcome === "won" && contact.outcome !== "won") {
    await reportMilestone(ctx.organization.id, contactId, "deal_won", {
      value: dealValue,
      currency: ctx.organization.defaultCurrency,
    });
  }
  revalidatePath("/leads");
  revalidatePath("/inbox");
  return ok(undefined);
}

const factSchema = z.object({
  contactId: z.string().uuid(),
  key: z.enum(QUALIFICATION_KEYS as [string, ...string[]]),
  /** Option values from the catalog; empty clears the answer. */
  values: z.array(z.string().max(40)).max(5),
});

/** Advisor correction of a pre-qualification answer. Source becomes "advisor" — never disguised as AI. */
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
  const { contactId, key, values } = parsed.data;
  const owned = await prisma.contact.count({ where: { id: contactId, organizationId: ctx.organization.id } });
  if (!owned) return fail("Contacto no encontrado.");

  if (values.length === 0) {
    await prisma.contactFact.deleteMany({ where: { contactId, key } });
  } else {
    if (!normalizeFactValue(key, values)) return fail("Opción no válida.");
    await applyFacts(ctx.organization.id, contactId, { [key]: values }, "advisor", ctx.membership.id);
  }
  await auditLog(ctx, "lead.fact", { type: "contact", id: contactId, metadata: { key } });
  revalidatePath("/leads");
  revalidatePath("/inbox");
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

const extractSchema = z.object({ contactId: z.string().uuid() });

/**
 * Reads the contact's latest WhatsApp chat with the configured AI model (Groq by
 * default in Settings → IA) and fills the answers it can prove. Results are
 * stored with source "ai"; an advisor's correction is never overwritten.
 */
export async function extractFactsWithAi(input: unknown): Promise<ActionResult<{ changed: number; mocked: boolean }>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "contacts.edit");
  } catch {
    return fail("No tienes permiso para editar leads.");
  }
  const parsed = extractSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO);

  const contact = await prisma.contact.findFirst({
    where: { id: parsed.data.contactId, organizationId: ctx.organization.id },
    include: {
      conversations: {
        orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
        take: 1,
        include: { messages: { orderBy: { sentAt: "desc" }, take: 40 } },
      },
    },
  });
  if (!contact) return fail("Contacto no encontrado.");
  const conversation = contact.conversations[0];
  const turns = (conversation?.messages ?? [])
    .reverse()
    .filter((m) => m.body.trim())
    .map((m) => ({ direction: m.direction, body: m.body }));
  if (!turns.some((t) => t.direction === "inbound")) return fail("El cliente aún no ha escrito nada que leer.");

  // Deterministic fallback (also the demo/mock output): the keyword extractor over the customer's messages.
  const fallback = extractFactsFromText(turns.filter((t) => t.direction === "inbound").map((t) => t.body).join("\n"));
  const result = await extractLeadFacts(ctx, {
    contactName: contact.firstName || "Cliente",
    turns,
    catalog: QUALIFICATION_QUESTIONS.map((q) => ({
      key: q.key,
      question: q.question,
      max: q.max,
      options: q.options.map((o) => ({ value: o.value, label: o.label })),
    })),
    mock: JSON.stringify(Object.fromEntries(Object.entries(fallback).map(([k, v]) => [k, v.split(",")]))),
    conversationId: conversation?.id,
  });
  const facts = parseAiFacts(result.text);
  const applied = await applyFacts(ctx.organization.id, contact.id, facts, result.mocked ? "system" : "ai");
  await auditLog(ctx, "lead.ai_extract", { type: "contact", id: contact.id, metadata: { changed: applied.changed } });
  revalidatePath("/inbox");
  revalidatePath("/leads");
  return ok({ changed: applied.changed.length, mocked: result.mocked });
}
