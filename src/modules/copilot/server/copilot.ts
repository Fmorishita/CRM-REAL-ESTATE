import "server-only";

import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/format";
import { getDashboardData } from "@/modules/dashboard/server/queries";
import { listContacts } from "@/modules/contacts/server/queries";
import { getPropertyMatches } from "@/modules/matching/server/queries";
import type { CopilotResponse, PendingAction } from "@/modules/copilot/types";

const HELP: CopilotResponse = {
  text: "Soy tu copiloto. Puedo ayudarte con:",
  blocks: [
    {
      type: "list",
      title: "Prueba pedirme",
      items: [
        "Muéstrame los leads más calientes",
        "¿Cómo va mi día? / Resumen del dashboard",
        "Qué leads necesitan seguimiento",
        "Recomienda propiedades para <nombre>",
        "Genera un reporte de la semana",
        "Crea una tarea: <descripción>",
      ],
    },
  ],
};

function has(q: string, ...words: string[]): boolean {
  return words.some((w) => q.includes(w));
}

export async function handleCopilotMessage(ctx: TenantContext, message: string): Promise<CopilotResponse> {
  const q = message.toLowerCase();

  if (has(q, "crea tarea", "crear tarea", "crea una tarea", "agenda tarea", "recuérdame", "recuerdame", "recordar")) {
    return prepareCreateTask(message);
  }
  if (has(q, "caliente", "hot", "mejores leads", "más calientes")) {
    return findHotLeads(ctx);
  }
  if (has(q, "recomienda", "recomienda", "propiedades para", "propiedad para")) {
    return findPropertiesForContact(ctx, message);
  }
  if (has(q, "reporte", "report", "semanal", "informe")) {
    return generateReport(ctx);
  }
  if (has(q, "seguimiento", "sin contacto", "contactar", "fríos", "frios", "atrasad")) {
    return suggestFollowups(ctx);
  }
  if (has(q, "día", "dia", "resumen", "dashboard", "cómo va", "como va", "hoy")) {
    return summarizeDashboard(ctx);
  }
  return HELP;
}

async function findHotLeads(ctx: TenantContext): Promise<CopilotResponse> {
  const data = await getDashboardData(ctx);
  const items = data.hotLeads.slice(0, 5).map((l) => ({
    contactId: l.id,
    name: l.name,
    score: l.score,
    detail: [l.budgetLabel, l.zone].filter(Boolean).join(" · ") || l.type,
    action: l.recommendedAction,
  }));
  return {
    text: `Estos son tus ${items.length} leads más calientes ahora mismo:`,
    blocks: [{ type: "leads", items }],
  };
}

async function summarizeDashboard(ctx: TenantContext): Promise<CopilotResponse> {
  const data = await getDashboardData(ctx);
  return {
    text: "Resumen de tu día:",
    blocks: [
      {
        type: "stats",
        items: [
          { label: "Leads nuevos hoy", value: String(data.stats.newLeads) },
          { label: "Conversaciones pendientes", value: String(data.stats.pendingConversations) },
          { label: "Visitas esta semana", value: String(data.stats.upcomingVisits) },
          { label: "Pipeline activo", value: formatCurrency(data.pipeline.totalValue, data.currency, data.locale, { notation: "compact" }) },
        ],
      },
      { type: "list", title: "AI Insights", items: data.insights.map((i) => i.text) },
    ],
  };
}

async function suggestFollowups(ctx: TenantContext): Promise<CopilotResponse> {
  const data = await getDashboardData(ctx);
  const items = data.commandCenter.map((c) => `${c.title}${c.hint ? ` — ${c.hint}` : ""}`);
  const leadItems = data.hotLeads.slice(0, 3).map((l) => ({
    contactId: l.id,
    name: l.name,
    score: l.score,
    detail: l.lastContactLabel ? `Últ. contacto ${l.lastContactLabel}` : l.type,
    action: l.recommendedAction,
  }));
  return {
    text: "Esto es lo que deberías dar seguimiento hoy:",
    blocks: [
      ...(items.length ? [{ type: "list" as const, title: "Prioridades", items }] : []),
      { type: "leads" as const, items: leadItems },
    ],
  };
}

async function findPropertiesForContact(ctx: TenantContext, message: string): Promise<CopilotResponse> {
  const { items: contacts } = await listContacts(ctx, {});
  const q = message.toLowerCase();
  const contact = contacts.find((c) => {
    const first = c.name.split(" ")[0]?.toLowerCase() ?? "";
    return first.length > 2 && q.includes(first);
  });
  if (!contact) {
    return {
      text: "¿Para qué cliente quieres recomendaciones? Dime su nombre, por ejemplo: \"Recomienda propiedades para Roberto\".",
      blocks: [],
    };
  }
  const matches = await getPropertyMatches(ctx, contact.id);
  const items = matches.slice(0, 3).map((m) => ({
    propertyId: m.propertyId,
    title: m.title,
    priceLabel: m.priceLabel,
    score: m.score,
    detail: m.reasons[0]?.text ?? m.locationLabel ?? "",
  }));
  return {
    text: `Propiedades recomendadas para ${contact.name}:`,
    blocks: items.length ? [{ type: "properties", items }] : [{ type: "text", text: "No encontré propiedades compatibles. Revisa sus preferencias." }],
  };
}

async function generateReport(ctx: TenantContext): Promise<CopilotResponse> {
  const data = await getDashboardData(ctx);
  return {
    text: "Reporte de la semana de tu equipo:",
    blocks: [
      {
        type: "stats",
        items: [
          { label: "Leads nuevos hoy", value: String(data.stats.newLeads) },
          { label: "Pipeline activo", value: formatCurrency(data.pipeline.totalValue, data.currency, data.locale, { notation: "compact" }) },
          { label: "Forecast ponderado", value: formatCurrency(data.pipeline.weightedForecast, data.currency, data.locale, { notation: "compact" }) },
          { label: "Oportunidades abiertas", value: String(data.pipeline.openCount) },
        ],
      },
      {
        type: "list",
        title: "Hallazgos",
        items: data.insights.map((i) => i.text),
      },
    ],
  };
}

function prepareCreateTask(message: string): CopilotResponse {
  // Extract a title after a "tarea[:]" marker, else use the message tail.
  let title = message.trim();
  const markers = ["crea una tarea", "crear tarea", "crea tarea", "agenda tarea", "recuérdame", "recuerdame", "recordar"];
  for (const m of markers) {
    const idx = title.toLowerCase().indexOf(m);
    if (idx >= 0) {
      title = title.slice(idx + m.length).replace(/^[:\s]+/, "").trim();
      break;
    }
  }
  if (!title) title = "Nueva tarea de seguimiento";
  const pendingAction: PendingAction = { kind: "create_task", label: `Crear tarea: "${title}"`, payload: { title } };
  return {
    text: "Voy a crear esta tarea. ¿Confirmas?",
    blocks: [{ type: "text", text: title }],
    pendingAction,
  };
}

export async function confirmCreateTask(ctx: TenantContext, payload: Record<string, string>): Promise<CopilotResponse> {
  const title = (payload.title ?? "").trim() || "Nueva tarea de seguimiento";
  if (isDemoMode()) {
    return { text: `✅ Tarea creada (simulado): "${title}".`, blocks: [] };
  }
  await prisma.task.create({
    data: {
      organizationId: ctx.organization.id,
      title,
      priority: "medium",
      dueAt: new Date(Date.now() + 24 * 3600 * 1000),
      assignedMembershipId: ctx.membership.id,
    },
  });
  return { text: `✅ Tarea creada: "${title}". La verás en tu lista de tareas.`, blocks: [] };
}
