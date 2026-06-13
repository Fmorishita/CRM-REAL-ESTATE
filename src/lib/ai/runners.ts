import "server-only";

import type { TenantContext } from "@/lib/auth/types";
import { runTask, type AiTaskResult } from "@/lib/ai/router";

export interface ConversationTurn {
  direction: "inbound" | "outbound";
  body: string;
}

function transcript(contactName: string, turns: ConversationTurn[]): string {
  return turns
    .map((t) => `${t.direction === "inbound" ? contactName : "Asesor"}: ${t.body}`)
    .join("\n");
}

export async function summarizeConversation(
  ctx: TenantContext,
  input: { contactName: string; channel: string; turns: ConversationTurn[]; conversationId?: string },
): Promise<AiTaskResult> {
  const body = transcript(input.contactName, input.turns);
  const lastInbound = [...input.turns].reverse().find((t) => t.direction === "inbound");
  return runTask(ctx, "summarize_conversation", {
    system:
      "Eres un asistente de un CRM inmobiliario. Resume la conversación en una o dos frases en español, " +
      "destacando la intención del cliente y cualquier dato relevante (presupuesto, zona, tipo de propiedad).",
    messages: [{ role: "user", content: `Conversación por ${input.channel}:\n${body}\n\nResumen:` }],
    maxTokens: 200,
    mock: lastInbound
      ? `El cliente escribe por ${input.channel}: "${lastInbound.body.slice(0, 90)}". Requiere seguimiento.`
      : `Conversación por ${input.channel} con ${input.contactName}.`,
    entity: input.conversationId ? { type: "conversation", id: input.conversationId } : undefined,
  });
}

export async function suggestReply(
  ctx: TenantContext,
  input: { contactName: string; channel: string; turns: ConversationTurn[]; conversationId?: string },
): Promise<AiTaskResult> {
  const body = transcript(input.contactName, input.turns);
  return runTask(ctx, "suggest_reply", {
    system:
      "Eres un asesor inmobiliario profesional y cordial. Redacta la siguiente respuesta del asesor al cliente " +
      "en español: breve (2-3 frases), útil y con una llamada a la acción clara (por ejemplo, agendar una visita o " +
      "enviar más información). No inventes datos que no estén en la conversación.",
    messages: [{ role: "user", content: `Conversación por ${input.channel}:\n${body}\n\nRespuesta del asesor:` }],
    maxTokens: 300,
    mock:
      `Hola ${input.contactName.split(" ")[0]}, gracias por tu mensaje. Con gusto te comparto toda la información ` +
      `y resuelvo tus dudas. ¿Te parece si agendamos una llamada o una visita esta semana?`,
    entity: input.conversationId ? { type: "conversation", id: input.conversationId } : undefined,
  });
}
