import "server-only";

import { hasEnv } from "@/lib/integrations/env";

export interface WaTemplate {
  name: string;
  language: string;
  category: string;
  /** Body text with {{1}}… placeholders. */
  body: string;
  /** Number of body placeholders to fill. */
  params: number;
}

const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v23.0";

/** Shown when WhatsApp is not connected, so the flow can be tried end to end. */
const DEMO_TEMPLATES: WaTemplate[] = [
  {
    name: "seguimiento_lead",
    language: "es_MX",
    category: "MARKETING",
    body: "Hola {{1}}, soy tu asesor de Legacy Capital. ¿Te gustaría agendar una visita a Punta Pacífico esta semana?",
    params: 1,
  },
  {
    name: "recordatorio_cita",
    language: "es_MX",
    category: "UTILITY",
    body: "Hola {{1}}, te recordamos tu cita el {{2}}. Responde a este mensaje si necesitas reprogramar.",
    params: 2,
  },
];

function countParams(body: string): number {
  const found = body.match(/\{\{\s*\d+\s*\}\}/g) ?? [];
  return new Set(found.map((f) => f.replace(/\D/g, ""))).size;
}

/**
 * Approved templates of the WhatsApp Business Account (Graph API). Templates are
 * created and approved in Meta (WhatsApp Manager); here they are only listed and
 * sent. Cached for 5 minutes.
 */
export async function listApprovedTemplates(): Promise<{ templates: WaTemplate[]; live: boolean; error?: string }> {
  if (!hasEnv("WHATSAPP_BUSINESS_ACCOUNT_ID", "WHATSAPP_ACCESS_TOKEN")) {
    return { templates: DEMO_TEMPLATES, live: false };
  }
  const waba = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!.trim();
  const token = process.env.WHATSAPP_ACCESS_TOKEN!.trim();
  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${waba}/message_templates?fields=name,language,category,status,components&status=APPROVED&limit=100`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } });
    if (!res.ok) return { templates: [], live: true, error: `Meta respondió ${res.status} al listar plantillas.` };
    const json = (await res.json()) as {
      data?: { name: string; language: string; category: string; status: string; components?: { type: string; text?: string }[] }[];
    };
    const templates = (json.data ?? [])
      .filter((t) => t.status === "APPROVED")
      .map((t) => {
        const body = t.components?.find((c) => c.type === "BODY")?.text ?? "";
        return { name: t.name, language: t.language, category: t.category, body, params: countParams(body) };
      });
    return { templates, live: true };
  } catch (error) {
    return { templates: [], live: true, error: error instanceof Error ? error.message : "No se pudieron cargar las plantillas." };
  }
}

/** Renders the body with its parameters for the chat history. */
export function renderTemplate(body: string, params: string[]): string {
  return body.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n: string) => params[Number(n) - 1] ?? `{{${n}}}`);
}
