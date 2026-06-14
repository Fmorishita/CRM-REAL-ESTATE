/** Suggested prompts and the internal tool catalog for the AI Copilot. */

export const COPILOT_SUGGESTIONS = [
  "Muéstrame los leads más calientes",
  "¿Cómo va mi día?",
  "Qué leads necesitan seguimiento",
  "Recomienda propiedades para Roberto",
  "Genera un reporte de la semana",
  "Crea una tarea: llamar a Patricia mañana",
];

export interface CopilotTool {
  key: string;
  label: string;
  /** Whether the tool performs a write and requires confirmation. */
  sensitive: boolean;
}

export const COPILOT_TOOLS: Record<string, CopilotTool> = {
  find_hot_leads: { key: "find_hot_leads", label: "Buscar leads calientes", sensitive: false },
  summarize_dashboard: { key: "summarize_dashboard", label: "Resumir el día", sensitive: false },
  suggest_followups: { key: "suggest_followups", label: "Sugerir seguimientos", sensitive: false },
  find_properties_for_contact: { key: "find_properties_for_contact", label: "Recomendar propiedades", sensitive: false },
  generate_report: { key: "generate_report", label: "Generar reporte", sensitive: false },
  create_task: { key: "create_task", label: "Crear tarea", sensitive: true },
};
