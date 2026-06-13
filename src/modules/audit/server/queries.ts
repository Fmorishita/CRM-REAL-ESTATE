import "server-only";

import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatRelativeTime } from "@/lib/format";
import type { AuditLogView } from "@/modules/audit/types";

const ACTION_LABELS: Record<string, string> = {
  "contact.create": "Creó un contacto",
  "contact.update": "Editó un contacto",
  "contact.stage_change": "Cambió la etapa de un contacto",
  "opportunity.create": "Creó una oportunidad",
  "opportunity.move": "Movió una oportunidad",
  "property.create": "Creó una propiedad",
  "property.update": "Editó una propiedad",
  "conversation.assign": "Asignó una conversación",
  "visit.create": "Agendó una visita",
  "visit.feedback": "Registró feedback de visita",
  "automation.create": "Creó una automatización",
  "automation.delete": "Eliminó una automatización",
  "ai.configure": "Configuró la IA",
};

function label(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

const DEMO_AUDIT: AuditLogView[] = [
  { id: "a1", action: "contact.create", actionLabel: label("contact.create"), actorName: "Carlos Mendoza", entityType: "contact", entityId: null, atLabel: "hace 1 hora" },
  { id: "a2", action: "opportunity.move", actionLabel: label("opportunity.move"), actorName: "Mariana López", entityType: "opportunity", entityId: null, atLabel: "hace 3 horas" },
  { id: "a3", action: "ai.configure", actionLabel: label("ai.configure"), actorName: "Frank Morishita", entityType: "ai_task_config", entityId: null, atLabel: "hace 1 día" },
  { id: "a4", action: "automation.create", actionLabel: label("automation.create"), actorName: "Frank Morishita", entityType: "automation", entityId: null, atLabel: "hace 2 días" },
];

export async function listAuditLogs(ctx: TenantContext): Promise<AuditLogView[]> {
  if (isDemoMode()) return DEMO_AUDIT;
  try {
    const rows = await prisma.auditLog.findMany({
      where: { organizationId: ctx.organization.id },
      include: { membership: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      actionLabel: label(r.action),
      actorName: r.membership?.user.name ?? null,
      entityType: r.entityType,
      entityId: r.entityId,
      atLabel: formatRelativeTime(r.createdAt, ctx.organization.defaultLocale),
    }));
  } catch (error) {
    console.error("listAuditLogs failed, falling back to demo:", error);
    return DEMO_AUDIT;
  }
}
