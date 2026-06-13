"use server";

import { z } from "zod";

import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { fail, ok, type ActionResult } from "@/lib/result";
import { landingLeadSchema } from "@/modules/landing/schemas";

/**
 * Public lead-capture from a landing page. No session: the organization is
 * resolved server-side from the submitted (and re-verified) ids. Creates a
 * contact, registers the landing lead + source, and opens an opportunity when a
 * property is attached.
 */
export async function submitLandingLead(input: unknown): Promise<ActionResult<void>> {
  const parsed = landingLeadSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Revisa los datos del formulario.", z.flattenError(parsed.error).fieldErrors);
  }
  const data = parsed.data;

  if (isDemoMode()) {
    // Demo: acknowledge without persisting.
    return ok(undefined);
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { id: data.organizationId },
      select: { id: true, defaultCurrency: true },
    });
    if (!org) return fail("Organización no válida.");

    // Re-verify the property belongs to this org.
    const property = data.propertyId
      ? await prisma.property.findFirst({
          where: { id: data.propertyId, organizationId: org.id, deletedAt: null },
          select: { id: true, title: true, price: true, currency: true },
        })
      : null;

    // Ensure a "Landing Page" lead source exists for attribution.
    const leadSource = await prisma.leadSource.upsert({
      where: { organizationId_name: { organizationId: org.id, name: "Landing Page" } },
      create: { organizationId: org.id, name: "Landing Page", kind: "landing" },
      update: {},
    });

    const [firstName, ...rest] = data.name.trim().split(/\s+/);
    const lastName = rest.join(" ") || "—";

    // De-duplicate by phone within the org; otherwise create the contact.
    const existing = await prisma.contact.findFirst({
      where: { organizationId: org.id, phone: data.phone, deletedAt: null },
      select: { id: true },
    });

    const contact = existing
      ? await prisma.contact.update({
          where: { id: existing.id },
          data: { lastContactAt: new Date() },
          select: { id: true },
        })
      : await prisma.contact.create({
          data: {
            organizationId: org.id,
            type: "buyer",
            firstName: firstName ?? data.name,
            lastName,
            phone: data.phone,
            whatsapp: data.phone,
            email: data.email,
            stage: "new",
            leadSourceId: leadSource.id,
            score: 30,
            lastContactAt: new Date(),
          },
          select: { id: true },
        });

    // Landing page row (if configured) for this property — used for counters.
    const landingPage = data.propertyId
      ? await prisma.landingPage.findFirst({
          where: { organizationId: org.id, propertyId: data.propertyId, kind: "property" },
          select: { id: true },
        })
      : null;

    await prisma.landingLead.create({
      data: {
        organizationId: org.id,
        landingPageId: landingPage?.id ?? (await ensureCompanyLanding(org.id)),
        contactId: contact.id,
        formData: { name: data.name, phone: data.phone, email: data.email, message: data.message },
        utm: data.utm ?? undefined,
      },
    });

    if (landingPage) {
      await prisma.landingPage.update({
        where: { id: landingPage.id },
        data: { leadsCount: { increment: 1 } },
      });
    }

    // Attach property interest + open an opportunity.
    if (property) {
      await prisma.contactProperty.upsert({
        where: {
          contactId_propertyId_relation: {
            contactId: contact.id,
            propertyId: property.id,
            relation: "recommended",
          },
        },
        create: { contactId: contact.id, propertyId: property.id, relation: "recommended" },
        update: {},
      });
      await prisma.propertyView.create({
        data: {
          organizationId: org.id,
          propertyId: property.id,
          source: "landing",
          utm: data.utm ?? undefined,
        },
      });

      const pipeline = await prisma.pipeline.findFirst({
        where: { organizationId: org.id, isDefault: true },
        include: { stages: { orderBy: { position: "asc" } } },
      });
      const firstStage = pipeline?.stages.find((s) => !s.isWon && !s.isLost);
      if (pipeline && firstStage) {
        const alreadyOpen = await prisma.opportunity.findFirst({
          where: { organizationId: org.id, contactId: contact.id, propertyId: property.id, closedAt: null },
          select: { id: true },
        });
        if (!alreadyOpen) {
          await prisma.opportunity.create({
            data: {
              organizationId: org.id,
              pipelineId: pipeline.id,
              stageId: firstStage.id,
              contactId: contact.id,
              propertyId: property.id,
              title: `${property.title} — ${data.name}`,
              amount: property.price,
              currency: property.currency,
              probability: firstStage.probability,
            },
          });
        }
      }
    }

    return ok(undefined);
  } catch (error) {
    console.error("submitLandingLead failed:", error);
    return fail("No se pudo enviar tu información. Inténtalo de nuevo.");
  }
}

/** Returns a company landing page id for the org, creating one if needed. */
async function ensureCompanyLanding(organizationId: string): Promise<string> {
  const existing = await prisma.landingPage.findFirst({
    where: { organizationId, kind: "company" },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.landingPage.create({
    data: { organizationId, kind: "company", slug: `company-${organizationId.slice(0, 8)}` },
    select: { id: true },
  });
  return created.id;
}
