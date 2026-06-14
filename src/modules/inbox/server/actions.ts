"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getTenantContext, requirePermission } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { getChannelAdapter } from "@/lib/integrations/channels";
import { suggestReply } from "@/lib/ai/runners";
import { fail, ok, type ActionResult } from "@/lib/result";
import { demoConversationDetail } from "@/modules/inbox/demo";

const DEMO_ERROR = "Acción no disponible en modo demo. Configura la base de datos para guardar cambios.";

async function loadConversation(organizationId: string, id: string) {
  return prisma.conversation.findFirst({
    where: { id, organizationId },
    include: { channelAccount: true, contact: true },
  });
}

const sendSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1, "El mensaje no puede estar vacío").max(4000),
});

export async function sendMessage(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "conversations.reply");
  } catch {
    return fail("No tienes permiso para responder conversaciones.");
  }
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Mensaje inválido.");
  if (isDemoMode()) return ok(undefined);

  try {
    const conversation = await loadConversation(ctx.organization.id, parsed.data.conversationId);
    if (!conversation) return fail("Conversación no encontrada.");

    const adapter = getChannelAdapter(conversation.channelAccount.channel);
    const result = await adapter.send({
      to: conversation.contact?.whatsapp ?? conversation.contact?.phone ?? "",
      body: parsed.data.body,
      conversationExternalId: conversation.externalId,
    });

    await prisma.$transaction([
      prisma.message.create({
        data: {
          organizationId: ctx.organization.id,
          conversationId: conversation.id,
          direction: "outbound",
          authorType: "member",
          authorMembershipId: ctx.membership.id,
          body: parsed.data.body,
          status: result.ok ? "sent" : "failed",
          externalId: result.externalId,
        },
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          status: conversation.status === "new" || conversation.status === "needs_attention" ? "open" : conversation.status,
          unreadCount: 0,
          assignedMembershipId: conversation.assignedMembershipId ?? ctx.membership.id,
        },
      }),
    ]);

    revalidatePath("/inbox");
    return ok(undefined);
  } catch (error) {
    console.error("sendMessage failed:", error);
    return fail("No se pudo enviar el mensaje.");
  }
}

const assignSchema = z.object({
  conversationId: z.string().uuid(),
  membershipId: z.string().uuid().nullable(),
});

export async function assignConversation(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "conversations.view");
  } catch {
    return fail("No tienes permiso.");
  }
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    const conversation = await loadConversation(ctx.organization.id, parsed.data.conversationId);
    if (!conversation) return fail("Conversación no encontrada.");
    if (parsed.data.membershipId) {
      const member = await prisma.membership.findFirst({
        where: { id: parsed.data.membershipId, organizationId: ctx.organization.id },
        select: { id: true },
      });
      if (!member) return fail("Agente inválido.");
    }
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { assignedMembershipId: parsed.data.membershipId },
    });
    await auditLog(ctx, "conversation.assign", { type: "conversation", id: conversation.id });
    revalidatePath("/inbox");
    return ok(undefined);
  } catch (error) {
    console.error("assignConversation failed:", error);
    return fail("No se pudo asignar la conversación.");
  }
}

const statusSchema = z.object({
  conversationId: z.string().uuid(),
  status: z.enum(["new", "open", "waiting_customer", "needs_attention", "closed"]),
});

export async function setConversationStatus(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "conversations.view");
  } catch {
    return fail("No tienes permiso.");
  }
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    const conversation = await loadConversation(ctx.organization.id, parsed.data.conversationId);
    if (!conversation) return fail("Conversación no encontrada.");
    await prisma.conversation.update({ where: { id: conversation.id }, data: { status: parsed.data.status } });
    revalidatePath("/inbox");
    return ok(undefined);
  } catch (error) {
    console.error("setConversationStatus failed:", error);
    return fail("No se pudo actualizar el estado.");
  }
}

const noteSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export async function addConversationNote(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "conversations.view");
  } catch {
    return fail("No tienes permiso.");
  }
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return fail("Nota inválida.");
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    await prisma.note.create({
      data: {
        organizationId: ctx.organization.id,
        entityType: "conversation",
        entityId: parsed.data.conversationId,
        membershipId: ctx.membership.id,
        body: parsed.data.body,
      },
    });
    revalidatePath("/inbox");
    return ok(undefined);
  } catch (error) {
    console.error("addConversationNote failed:", error);
    return fail("No se pudo guardar la nota.");
  }
}

const taskSchema = z.object({
  conversationId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
});

export async function createTaskFromConversation(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "conversations.view");
  } catch {
    return fail("No tienes permiso.");
  }
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return fail(DEMO_ERROR);
  try {
    const conversation = await loadConversation(ctx.organization.id, parsed.data.conversationId);
    if (!conversation) return fail("Conversación no encontrada.");
    await prisma.task.create({
      data: {
        organizationId: ctx.organization.id,
        title: parsed.data.title,
        priority: "medium",
        dueAt: new Date(Date.now() + 24 * 3600 * 1000),
        assignedMembershipId: conversation.assignedMembershipId ?? ctx.membership.id,
        entityType: conversation.contactId ? "contact" : "conversation",
        entityId: conversation.contactId ?? conversation.id,
      },
    });
    revalidatePath("/inbox");
    return ok(undefined);
  } catch (error) {
    console.error("createTaskFromConversation failed:", error);
    return fail("No se pudo crear la tarea.");
  }
}

const suggestSchema = z.object({ conversationId: z.string().uuid() });

export async function suggestReplyWithAi(input: unknown): Promise<ActionResult<{ text: string; mocked: boolean }>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "conversations.reply");
  } catch {
    return fail("No tienes permiso.");
  }
  const parsed = suggestSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");

  try {
    let contactName = "el cliente";
    let channel = "whatsapp";
    let turns: { direction: "inbound" | "outbound"; body: string }[] = [];

    if (isDemoMode()) {
      const demo = demoConversationDetail(parsed.data.conversationId);
      if (!demo) return fail("Conversación no encontrada.");
      contactName = demo.contactName;
      channel = demo.channel;
      turns = demo.messages.map((m) => ({ direction: m.direction, body: m.body }));
    } else {
      const conversation = await prisma.conversation.findFirst({
        where: { id: parsed.data.conversationId, organizationId: ctx.organization.id },
        include: {
          contact: true,
          channelAccount: true,
          messages: { orderBy: { sentAt: "asc" }, take: 50 },
        },
      });
      if (!conversation) return fail("Conversación no encontrada.");
      contactName = conversation.contact
        ? `${conversation.contact.firstName} ${conversation.contact.lastName}`
        : "el cliente";
      channel = conversation.channelAccount.channel;
      turns = conversation.messages.map((m) => ({ direction: m.direction, body: m.body }));
    }

    const result = await suggestReply(ctx, {
      contactName,
      channel,
      turns,
      conversationId: parsed.data.conversationId,
    });
    return ok({ text: result.text, mocked: result.mocked });
  } catch (error) {
    console.error("suggestReplyWithAi failed:", error);
    return fail("No se pudo generar la sugerencia.");
  }
}

const recommendSchema = z.object({
  conversationId: z.string().uuid(),
  propertyId: z.string().uuid(),
});

export async function recommendProperty(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "conversations.reply");
  } catch {
    return fail("No tienes permiso.");
  }
  const parsed = recommendSchema.safeParse(input);
  if (!parsed.success) return fail("Datos inválidos.");
  if (isDemoMode()) return ok(undefined);
  try {
    const [conversation, property] = await Promise.all([
      loadConversation(ctx.organization.id, parsed.data.conversationId),
      prisma.property.findFirst({
        where: { id: parsed.data.propertyId, organizationId: ctx.organization.id, deletedAt: null },
        select: { id: true, title: true, slug: true, price: true, currency: true },
      }),
    ]);
    if (!conversation) return fail("Conversación no encontrada.");
    if (!property) return fail("Propiedad no encontrada.");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const body = `Te comparto esta propiedad que puede interesarte: ${property.title}. Más información: ${appUrl}/p/${property.slug}`;

    await prisma.$transaction(async (tx) => {
      await tx.message.create({
        data: {
          organizationId: ctx.organization.id,
          conversationId: conversation.id,
          direction: "outbound",
          authorType: "member",
          authorMembershipId: ctx.membership.id,
          body,
          status: "sent",
        },
      });
      await tx.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
      if (conversation.contactId) {
        await tx.contactProperty.upsert({
          where: {
            contactId_propertyId_relation: {
              contactId: conversation.contactId,
              propertyId: property.id,
              relation: "recommended",
            },
          },
          create: { contactId: conversation.contactId, propertyId: property.id, relation: "recommended" },
          update: {},
        });
      }
    });

    revalidatePath("/inbox");
    return ok(undefined);
  } catch (error) {
    console.error("recommendProperty failed:", error);
    return fail("No se pudo recomendar la propiedad.");
  }
}
