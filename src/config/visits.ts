export const VISIT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  en_route: "En camino",
  done: "Realizada",
  no_show: "No asistió",
  rescheduled: "Reagendada",
  cancelled: "Cancelada",
};

export const VISIT_STATUS_TONES: Record<string, string> = {
  pending: "text-amber-600 dark:text-amber-400",
  confirmed: "text-emerald-600 dark:text-emerald-400",
  en_route: "text-blue-600 dark:text-blue-400",
  done: "text-violet-600 dark:text-violet-400",
  no_show: "text-red-600 dark:text-red-400",
  rescheduled: "text-orange-600 dark:text-orange-400",
  cancelled: "text-muted-foreground",
};

export const VISIT_STATUSES = [
  "pending",
  "confirmed",
  "en_route",
  "done",
  "no_show",
  "rescheduled",
  "cancelled",
] as const;

/** Statuses that count as part of an active route for the day. */
export const ROUTE_STATUSES = ["pending", "confirmed", "en_route", "rescheduled"] as const;

export function visitStatusLabel(status: string): string {
  return VISIT_STATUS_LABELS[status] ?? status;
}

export function visitStatusTone(status: string): string {
  return VISIT_STATUS_TONES[status] ?? "text-muted-foreground";
}
