import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { phoneVariants, type WebFormLead } from "@/lib/leadops/web-form";
import { applyFacts } from "@/modules/leadops/server/facts";
import { chooseAssignee } from "@/modules/leadops/server/ingest";

export type WebIntakeResult =
  | { status: "created" | "updated" | "duplicate"; contactId: string }
  | { status: "ignored"; reason: string };

/**
 * Website form lead → the same contact the WhatsApp webhook uses (matched by
 * phone in every Mexican spelling, or by email). Answers are stored with source
 * "form" and never overwrite an advisor's correction. Idempotent per form row.
 */
export async function ingestWebFormLead(lead: WebFormLead): Promise<WebIntakeResult> {
  const orgSlug = process.env.LEADOPS_ORGANIZATION_SLUG?.trim();
  if (!orgSlug) return { status: "ignored", reason: "LEADOPS_ORGANIZATION_SLUG no configurado" };
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug }, select: { id: true } });
  if (!org) return { status: "ignored", reason: "organización no encontrada" };
  if (!lead.phone && !lead.email) return { status: "ignored", reason: "sin teléfono ni email" };
  const organizationId = org.id;

  // Idempotency: the same form row (Supabase may retry) is processed once,
  // unless the row gained new answers (UPDATE from step 2 of the form).
  const eventKey = `web:${lead.externalId ?? `${lead.phone ?? lead.email}`}:${Object.values(lead.facts).join("|")}`;
  try {
    await prisma.webhookEvent.create({
      data: { provider: "web_form", eventKey, eventType: "lead", organizationId, payload: lead as unknown as Prisma.InputJsonValue },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const prior = await prisma.webhookEvent.findUnique({ where: { provider_eventKey: { provider: "web_form", eventKey } } });
      if (prior?.status === "processed") {
        const c = await findContact(organizationId, lead);
        return c ? { status: "duplicate", contactId: c.id } : { status: "ignored", reason: "duplicado" };
      }
    } else {
      throw error;
    }
  }

  const variants = phoneVariants(lead.phone);
  let contact = await findContact(organizationId, lead);
  const isNew = !contact;
  const [firstName, ...rest] = (lead.name ?? "").split(/\s+/).filter(Boolean);

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        organizationId,
        firstName: firstName ?? (lead.phone ? `+${variants[0] ?? lead.phone}` : (lead.email ?? "Lead web")),
        lastName: rest.join(" "),
        phone: variants[0] ?? lead.phone,
        whatsapp: variants[0] ?? lead.phone,
        // Same identity key the WhatsApp webhook uses, so a later chat joins this contact.
        waId: variants[0] ?? null,
        email: lead.email,
        stage: "new",
        firstContactAt: new Date(),
      },
    });
  } else {
    const declared = `${contact.firstName} ${contact.lastName}`.trim();
    const onlyNumber = !declared || declared.startsWith("+") || declared === contact.whatsappName;
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        email: contact.email ?? lead.email,
        phone: contact.phone ?? variants[0] ?? lead.phone,
        // A name typed in the form beats the WhatsApp profile name or a bare number.
        ...(firstName && onlyNumber ? { firstName, lastName: rest.join(" ") } : {}),
      },
    });
  }

  const hasFirstTouch = await prisma.leadAttribution.count({ where: { contactId: contact.id, isFirstTouch: true } });
  const alreadyFromThisRow = lead.externalId
    ? await prisma.leadAttribution.count({ where: { contactId: contact.id, channel: "web_form", sourceType: `form:${lead.externalId}` } })
    : 0;
  if (!alreadyFromThisRow) {
    await prisma.leadAttribution.create({
      data: {
        organizationId,
        contactId: contact.id,
        channel: "web_form",
        platform: lead.utm.utm_source ?? (lead.fbclid ? "facebook" : lead.gclid ? "google" : "web"),
        campaignName: lead.utm.utm_campaign ?? null,
        adName: lead.utm.utm_content ?? null,
        sourceType: lead.externalId ? `form:${lead.externalId}` : "form",
        sourceUrl: lead.page,
        headline: lead.origin,
        utm: { ...lead.utm, ...(lead.fbclid ? { fbclid: lead.fbclid } : {}), ...(lead.gclid ? { gclid: lead.gclid } : {}) },
        isFirstTouch: hasFirstTouch === 0,
        occurredAt: new Date(),
      },
    });
  }

  if (!contact.assignedMembershipId) {
    const { membershipId, reason } = await chooseAssignee(organizationId);
    if (membershipId) {
      await prisma.contact.update({ where: { id: contact.id }, data: { assignedMembershipId: membershipId } });
      await prisma.assignmentLog.create({ data: { organizationId, contactId: contact.id, toMembershipId: membershipId, reason } });
    }
  }

  await applyFacts(organizationId, contact.id, lead.facts, "form");

  await prisma.webhookEvent.update({
    where: { provider_eventKey: { provider: "web_form", eventKey } },
    data: { status: "processed", processedAt: new Date(), attempts: { increment: 1 } },
  });
  return { status: isNew ? "created" : "updated", contactId: contact.id };
}

async function findContact(organizationId: string, lead: WebFormLead) {
  const variants = phoneVariants(lead.phone);
  const or: Prisma.ContactWhereInput[] = [];
  if (variants.length) {
    or.push({ waId: { in: variants } }, { phone: { in: variants } }, { whatsapp: { in: variants } });
  }
  if (lead.email) or.push({ email: { equals: lead.email, mode: "insensitive" } });
  if (or.length === 0) return null;
  return prisma.contact.findFirst({ where: { organizationId, deletedAt: null, OR: or }, orderBy: { createdAt: "asc" } });
}
