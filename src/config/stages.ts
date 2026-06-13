/** CRM lifecycle stages, aligned with the seeded pipeline stage keys. */
export interface StageDef {
  key: string;
  label: string;
  /** Tailwind text color token for badges/columns. */
  tone: string;
}

export const CRM_STAGES: StageDef[] = [
  { key: "new", label: "Nuevo lead", tone: "text-blue-600 dark:text-blue-400" },
  { key: "contacted", label: "Contactado", tone: "text-sky-600 dark:text-sky-400" },
  { key: "qualified", label: "Calificado", tone: "text-violet-600 dark:text-violet-400" },
  { key: "searching", label: "Buscando propiedad", tone: "text-indigo-600 dark:text-indigo-400" },
  { key: "visit_scheduled", label: "Visita agendada", tone: "text-amber-600 dark:text-amber-400" },
  { key: "visit_done", label: "Visita realizada", tone: "text-orange-600 dark:text-orange-400" },
  { key: "negotiation", label: "Negociación", tone: "text-pink-600 dark:text-pink-400" },
  { key: "won", label: "Ganado", tone: "text-emerald-600 dark:text-emerald-400" },
  { key: "lost", label: "Perdido", tone: "text-red-600 dark:text-red-400" },
];

const STAGE_MAP = new Map(CRM_STAGES.map((s) => [s.key, s]));

export function stageLabel(key: string): string {
  return STAGE_MAP.get(key)?.label ?? key;
}

export function stageTone(key: string): string {
  return STAGE_MAP.get(key)?.tone ?? "text-muted-foreground";
}

export const CONTACT_TYPE_LABELS: Record<string, string> = {
  buyer: "Comprador",
  seller: "Vendedor",
  investor: "Inversionista",
  renter: "Rentador",
  external_broker: "Broker externo",
  referrer: "Referidor",
  developer: "Desarrollador",
};

export function contactTypeLabel(type: string): string {
  return CONTACT_TYPE_LABELS[type] ?? type;
}
