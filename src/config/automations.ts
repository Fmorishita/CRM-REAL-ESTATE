/** Catalog for the automation builder: triggers, conditions, actions, templates. */

export const TRIGGERS: Record<string, string> = {
  lead_created: "Lead nuevo",
  form_submitted: "Formulario enviado",
  message_received: "Mensaje recibido",
  email_opened: "Email abierto",
  property_favorited: "Propiedad marcada favorita",
  visit_scheduled: "Visita agendada",
  visit_done: "Visita realizada",
  lead_no_contact: "Lead sin contacto por X días",
  stage_changed: "Cambio de etapa",
  task_overdue: "Tarea vencida",
  document_uploaded: "Documento subido",
};

export const CONDITIONS: Record<string, string> = {
  lead_source: "Fuente del lead",
  budget: "Presupuesto",
  zone: "Zona",
  property_type: "Tipo de propiedad",
  score: "Score",
  assigned_agent: "Agente asignado",
  pipeline_stage: "Etapa del pipeline",
  channel: "Canal",
  tag: "Etiqueta",
  time_no_response: "Tiempo sin respuesta",
};

export const ACTIONS: Record<string, string> = {
  send_whatsapp: "Enviar WhatsApp",
  send_email: "Enviar email",
  create_task: "Crear tarea",
  assign_agent: "Asignar agente",
  change_stage: "Cambiar etapa",
  add_tag: "Agregar etiqueta",
  send_recommended_property: "Enviar propiedad recomendada",
  notify_supervisor: "Notificar supervisor",
  create_reminder: "Crear recordatorio",
  create_note: "Crear nota",
  run_ai: "Ejecutar IA",
  webhook: "Webhook externo",
};

export function triggerLabel(key: string): string {
  return TRIGGERS[key] ?? key;
}
export function conditionLabel(key: string): string {
  return CONDITIONS[key] ?? key;
}
export function actionLabel(key: string): string {
  return ACTIONS[key] ?? key;
}

export interface AutomationCondition {
  field: string;
  op: string;
  value: string;
}
export interface AutomationAction {
  type: string;
  label?: string;
}
export interface AutomationTrigger {
  type: string;
  config?: Record<string, unknown>;
}

export interface AutomationTemplate {
  key: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    key: "new_facebook_lead",
    name: "Nuevo lead de Facebook",
    description: "Da la bienvenida y asigna el lead automáticamente al recibirlo.",
    trigger: { type: "lead_created" },
    conditions: [{ field: "lead_source", op: "is", value: "facebook" }],
    actions: [
      { type: "send_whatsapp", label: "Mensaje de bienvenida" },
      { type: "assign_agent", label: "Round-robin del equipo" },
      { type: "create_task", label: "Llamar en la primera hora" },
    ],
  },
  {
    key: "no_response_24h",
    name: "Lead sin respuesta 24h",
    description: "Reactiva leads que no han respondido en 24 horas.",
    trigger: { type: "lead_no_contact", config: { days: 1 } },
    conditions: [],
    actions: [
      { type: "send_whatsapp", label: "Mensaje de seguimiento" },
      { type: "notify_supervisor", label: "Avisar al líder de equipo" },
    ],
  },
  {
    key: "post_visit",
    name: "Seguimiento después de visita",
    description: "Agradece y da seguimiento tras una visita realizada.",
    trigger: { type: "visit_done" },
    conditions: [],
    actions: [
      { type: "send_whatsapp", label: "Agradecer la visita" },
      { type: "create_task", label: "Registrar feedback y próximos pasos" },
    ],
  },
  {
    key: "cold_lead",
    name: "Recalentamiento de leads fríos",
    description: "Recupera leads fríos sin contacto en 7 días.",
    trigger: { type: "lead_no_contact", config: { days: 7 } },
    conditions: [{ field: "score", op: "lt", value: "50" }],
    actions: [
      { type: "send_email", label: "Email de recalentamiento" },
      { type: "add_tag", label: "Etiqueta: Frío" },
    ],
  },
  {
    key: "auto_recommend",
    name: "Recomendación automática de propiedades",
    description: "Envía propiedades compatibles cuando el cliente marca una favorita.",
    trigger: { type: "property_favorited" },
    conditions: [],
    actions: [{ type: "send_recommended_property", label: "Top 3 por smart matching" }],
  },
  {
    key: "presale_investor",
    name: "Cliente interesado en preventa",
    description: "Flujo para inversionistas interesados en preventas.",
    trigger: { type: "message_received" },
    conditions: [
      { field: "property_type", op: "is", value: "presale" },
      { field: "tag", op: "is", value: "Inversionista" },
    ],
    actions: [
      { type: "send_recommended_property", label: "Preventas disponibles" },
      { type: "create_task", label: "Enviar brochure y tabla de precios" },
    ],
  },
];
