import "server-only";

import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { computeIntelligence, type IntelSignals, type Intelligence } from "@/lib/intelligence/engine";
import { demoIntelligence } from "@/modules/intelligence/demo";

export async function getContactIntelligence(ctx: TenantContext, contactId: string): Promise<Intelligence | null> {
  if (isDemoMode()) return demoIntelligence(contactId);
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId: ctx.organization.id, deletedAt: null },
      include: {
        preference: true,
        leadSource: true,
        _count: {
          select: {
            conversations: true,
            visits: true,
            properties: true,
          },
        },
      },
    });
    if (!contact) return null;

    const [unresponded, visitsDone, favorites] = await Promise.all([
      prisma.conversation.count({
        where: { organizationId: ctx.organization.id, contactId, status: { in: ["needs_attention", "waiting_customer"] } },
      }),
      prisma.visit.count({ where: { organizationId: ctx.organization.id, contactId, status: "done" } }),
      prisma.contactProperty.count({ where: { contactId, relation: "favorite" } }),
    ]);

    const signals: IntelSignals = {
      lastContactAt: contact.lastContactAt,
      stage: contact.stage,
      hasBudget: contact.preference?.budgetMax != null,
      sourceKind: contact.leadSource?.kind ?? null,
      conversations: contact._count.conversations,
      unresponded,
      visits: contact._count.visits,
      visitsDone,
      favorites,
      urgency: contact.preference?.urgency ?? null,
      whatsapp: Boolean(contact.whatsapp ?? contact.phone),
    };

    return computeIntelligence(signals);
  } catch (error) {
    console.error("getContactIntelligence failed, falling back to demo:", error);
    return demoIntelligence(contactId);
  }
}
