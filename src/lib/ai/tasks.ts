import type { AiProviderId, AiTaskKey } from "@/lib/ai/types";

export interface AiTaskDef {
  key: AiTaskKey;
  label: string;
  description: string;
  defaultProvider: AiProviderId;
  defaultModel: string;
  defaultTemperature: number;
  /** Whether outputs should require human approval by default (sensitive tasks). */
  requiresApprovalDefault: boolean;
  /** Phase that wires this task to the UI. */
  phase: number;
}

export const AI_TASKS: Record<AiTaskKey, AiTaskDef> = {
  summarize_conversation: {
    key: "summarize_conversation",
    label: "Resumir conversación",
    description: "Genera un resumen breve del hilo de una conversación.",
    defaultProvider: "mock",
    defaultModel: "mock-1",
    defaultTemperature: 0.3,
    requiresApprovalDefault: false,
    phase: 9,
  },
  suggest_reply: {
    key: "suggest_reply",
    label: "Sugerir respuesta",
    description: "Propone una respuesta para el cliente según el contexto del chat.",
    defaultProvider: "mock",
    defaultModel: "mock-1",
    defaultTemperature: 0.4,
    requiresApprovalDefault: false,
    phase: 9,
  },
  score_lead: {
    key: "score_lead",
    label: "Calificar lead",
    description: "Estima el lead score y la probabilidad de cierre.",
    defaultProvider: "mock",
    defaultModel: "mock-1",
    defaultTemperature: 0.1,
    requiresApprovalDefault: false,
    phase: 14,
  },
  recommend_properties: {
    key: "recommend_properties",
    label: "Recomendar propiedades",
    description: "Sugiere propiedades compatibles con el perfil del cliente.",
    defaultProvider: "mock",
    defaultModel: "mock-1",
    defaultTemperature: 0.3,
    requiresApprovalDefault: false,
    phase: 10,
  },
  generate_property_description: {
    key: "generate_property_description",
    label: "Generar descripción",
    description: "Redacta la descripción de una propiedad para su publicación.",
    defaultProvider: "mock",
    defaultModel: "mock-1",
    defaultTemperature: 0.7,
    requiresApprovalDefault: false,
    phase: 9,
  },
  next_best_action: {
    key: "next_best_action",
    label: "Próxima mejor acción",
    description: "Recomienda la siguiente acción comercial para un contacto.",
    defaultProvider: "mock",
    defaultModel: "mock-1",
    defaultTemperature: 0.2,
    requiresApprovalDefault: false,
    phase: 14,
  },
};

export const AI_TASK_LIST: AiTaskDef[] = Object.values(AI_TASKS);
