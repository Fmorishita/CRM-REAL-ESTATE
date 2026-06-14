export type CopilotBlock =
  | { type: "text"; text: string }
  | { type: "stats"; items: { label: string; value: string }[] }
  | { type: "leads"; items: { contactId: string; name: string; score: number; detail: string; action: string }[] }
  | { type: "properties"; items: { propertyId: string; title: string; priceLabel: string; score: number; detail: string }[] }
  | { type: "list"; title: string; items: string[] };

export interface PendingAction {
  kind: "create_task";
  label: string;
  payload: Record<string, string>;
}

export interface CopilotResponse {
  text: string;
  blocks: CopilotBlock[];
  pendingAction?: PendingAction;
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  blocks?: CopilotBlock[];
  pendingAction?: PendingAction;
}
