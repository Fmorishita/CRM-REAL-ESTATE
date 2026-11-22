"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getTenantContext, requirePermission } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { getChannelAdapter } from "@/lib/integrations/channels";
import { suggestReply } from "@/lib/ai/runners";
import { canSendToContact } from "@/lib/leadops/rules";
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

type LoadedConversation = NonNullable<Awaited<ReturnType<typeof loadConversation>>>;

/**
 * Persists an outbound human message. A provider failure is stored as `failed`
 * with Meta's error and reported to the advisor — never shown as delivered.
 * A successful human reply takes over: the bot switches off (with reason) and
 * "Atención" clears. Reactivators are a separate switch and stay as they are.
 */
async function recordOutbound(
  ctx: Awaited<ReturnType<typeof getTenantContext>>,
  conversation: LoadedConversation,
  input: { body: string; sentVia: "crm" | "template"; result: { ok: boolean; externalId?: string; error?: string } },
): Promise<void> {
  const now = new Date();
  const contact = conversation.contact;
  const { result } = input;
  await prisma.$transaction([
    prisma.message.create({
      data: {
        organizationId: ctx.organization.id,
        conversationId: conversation.id,
        direction: "outbound",
        authorType: "member",
        authorMembershipId: ctx.membership.id,
        body: input.body,
        status: result.ok ? "sent" : "failed",
        externalId: result.externalId,
        errorMessage: result.ok ? null : (result.error ?? "Error del proveedor"),
        sentVia: input.sentVia,
      },
    }),
    ...(result.ok
      ? [
          prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              lastMessageAt: now,
              status: conversation.status === "new" || conversation.status === "needs_attention" ? "open" : conversation.status,
              unreadCount: 0,
              assignedMembershipId: conversation.assignedMembershipId ?? ctx.membership.id,
            },
          }),
          ...(contact
            ? [
                prisma.contact.update({
                  where: { id: contact.id },
                  data: {
                    lastOutboundAt: now,
                    firstMemberReplyAt: contact.firstMemberReplyAt ?? now,
                    attentionAt: null,
                    ...(contact.botEnabled
                      ? { botEnabled: false, botChangedAt: now, botChangedReason: "human_reply", botChangedByMembershipId: ctx.membership.id }
                      : {}),
                  },
                }),
              ]
            : []),
        ]
      : []),
  ]);
}

function recipientOf(conversation: LoadedConversation): string {
  return conversation.contact?.whatsapp ?? conversation.contact?.waId ?? conversation.contact?.phone ?? "";
}

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

    // Lead-ops rules, enforced server-side: blocked contacts get nothing, and
    // free-form WhatsApp text needs the 24h window (from the customer's last message).
    const contact = conversation.contact;
    if (contact && conversation.channelAccount.channel === "whatsapp") {
      const guard = canSendToContact({ blockedAt: contact.blockedAt, lastInboundAt: contact.lastInboundAt, isTemplate: false });
      if (!guard.allowed) {
        return fail(
          guard.reason === "blocked"
            ? "Este contacto está bloqueado: no se le pueden enviar mensajes."
            : "Ventana de 24 h cerrada: solo se pueden enviar plantillas aprobadas de Meta.",
        );
      }
    } else if (contact?.blockedAt) {
      return fail("Este contacto está bloqueado: no se le pueden enviar mensajes.");
    }

    const adapter = getChannelAdapter(conversation.channelAccount.channel);
    const result = await adapter.send({
      to: recipientOf(conversation),
      body: parsed.data.body,
      conversationExternalId: conversation.externalId,
    });
    await recordOutbound(ctx, conversation, { body: parsed.data.body, sentVia: "crm", result });
    revalidatePath("/inbox");
    if (!result.ok) return fail(`No se entregó: ${result.error ?? "error del proveedor"}`);
    return ok(undefined);
  } catch (error) {
    console.error("sendMessage failed:", error);
    return fail("No se pudo enviar el mensaje.");
  }
}

const templateSchema = z.object({
  conversationId: z.string().uuid(),
  name: z.string().trim().min(1).max(512),
  language: z.string().trim().min(2).max(15),
  params: z.array(z.string().trim().min(1, "Completa todas las variables").max(1024)).max(10),
});

/** Approved Meta template: the only message allowed outside the 24h window. Blocked contacts still get nothing. */
export async function sendTemplateMessage(input: unknown): Promise<ActionResult<void>> {
  const ctx = await getTenantContext();
  try {
    requirePermission(ctx, "conversations.reply");
  } catch {
    return fail("No tienes permiso para responder conversaciones.");
  }
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Plantilla inválida.");
  if (isDemoMode()) return fail("Modo demo: la plantilla no se envía.");

  try {
    const conversation = await loadConversation(ctx.organization.id, parsed.data.conversationId);
    if (!conversation) return fail("Conversación no encontrada.");
    if (conversation.channelAccount.channel !== "whatsapp") return fail("Las plantillas solo aplican a WhatsApp.");
    const contact = conversation.contact;
    if (contact) {
      const guard = canSendToContact({ blockedAt: contact.blockedAt, lastInboundAt: contact.lastInboundAt, isTemplate: true });
      if (!guard.allowed) return fail("Este contacto está bloqueado: no se le pueden enviar mensajes.");
    }

    const { listApprovedTemplates, renderTemplate } = await import("@/modules/leadops/server/templates");
    const { templates } = await listApprovedTemplates();
    const template = templates.find((t) => t.name === parsed.data.name && t.language === parsed.data.language);
    if (!template) return fail("La plantilla no está aprobada en Meta.");
    if (parsed.data.params.length !== template.params) return fail("Completa todas las variables de la plantilla.");

    const adapter = getChannelAdapter("whatsapp");
    if (!adapter.sendTemplate) return fail("El canal no admite plantillas.");
    const result = await adapter.sendTemplate({
      to: recipientOf(conversation),
      name: template.name,
      language: template.language,
      bodyParams: parsed.data.params,
    });
    await recordOutbound(ctx, conversation, {
      body: `📋 ${renderTemplate(template.body, parsed.data.params)}`,
      sentVia: "template",
      result,
    });
    await auditLog(ctx, "conversation.template", { type: "conversation", id: conversation.id, metadata: { template: template.name } });
    revalidatePath("/inbox");
    if (!result.ok) return fail(`No se entregó: ${result.error ?? "error del proveedor"}`);
    return ok(undefined);
  } catch (error) {
    console.error("sendTemplateMessage failed:", error);
    return fail("No se pudo enviar la plantilla.");
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

    // Same rules as a typed reply: it is really sent through the channel, blocked
    // contacts get nothing and WhatsApp needs the 24h window.
    const contact = conversation.contact;
    if (contact) {
      const guard = canSendToContact({
        blockedAt: contact.blockedAt,
        lastInboundAt: conversation.channelAccount.channel === "whatsapp" ? contact.lastInboundAt : new Date(),
        isTemplate: false,
      });
      if (!guard.allowed) {
        return fail(guard.reason === "blocked" ? "Este contacto está bloqueado." : "Ventana de 24 h cerrada: usa una plantilla aprobada.");
      }
    }
    const result = await getChannelAdapter(conversation.channelAccount.channel).send({
      to: recipientOf(conversation),
      body,
      conversationExternalId: conversation.externalId,
    });
    if (!result.ok) {
      await recordOutbound(ctx, conversation, { body, sentVia: "crm", result });
      return fail(`No se entregó: ${result.error ?? "error del proveedor"}`);
    }

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
          externalId: result.externalId,
          sentVia: "crm",
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
