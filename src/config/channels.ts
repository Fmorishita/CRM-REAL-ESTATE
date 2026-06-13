export const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  instagram: "Instagram",
  facebook: "Facebook",
  webchat: "Web chat",
};

export const CONVERSATION_STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  open: "Abierto",
  waiting_customer: "Esperando cliente",
  needs_attention: "Requiere atención",
  closed: "Cerrado",
};

export const CONVERSATION_STATUS_TONES: Record<string, string> = {
  new: "text-blue-600 dark:text-blue-400",
  open: "text-emerald-600 dark:text-emerald-400",
  waiting_customer: "text-amber-600 dark:text-amber-400",
  needs_attention: "text-red-600 dark:text-red-400",
  closed: "text-muted-foreground",
};

export const OPEN_STATUSES = ["new", "open", "waiting_customer", "needs_attention"] as const;

export function channelLabel(channel: string): string {
  return CHANNEL_LABELS[channel] ?? channel;
}

export function conversationStatusLabel(status: string): string {
  return CONVERSATION_STATUS_LABELS[status] ?? status;
}

export function conversationStatusTone(status: string): string {
  return CONVERSATION_STATUS_TONES[status] ?? "text-muted-foreground";
}
