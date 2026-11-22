import type { Channel } from "@prisma/client";

export interface ConversationListItem {
  id: string;
  channel: Channel;
  contactId: string | null;
  contactName: string;
  status: string;
  priority: "low" | "normal" | "high";
  snippet: string;
  lastMessageLabel: string | null;
  unreadCount: number;
  assignedName: string | null;
  /** Lead badges for the list (WhatsApp leads only). */
  attention?: boolean;
  windowOpen?: boolean;
  factsCount?: number;
}

export interface ChatMessage {
  id: string;
  direction: "inbound" | "outbound";
  authorType: "contact" | "member" | "ai" | "system";
  authorName: string | null;
  body: string;
  timeLabel: string;
  status: string;
  /** "crm" | "whatsapp_business_app" | "template" | "automation" | null. */
  sentVia?: string | null;
  /** Provider error for failed outbound messages. */
  error?: string | null;
}

export interface LeadFactState {
  key: string;
  /** Canonical option values. */
  values: string[];
  source: "ai" | "advisor" | "form" | "import" | "system";
}

/** Lead-management state of the conversation's contact (Phase 26/27). */
export interface LeadState {
  contactId: string;
  botEnabled: boolean;
  botChangedReason: string | null;
  reactEnabled: boolean;
  blocked: boolean;
  archived: boolean;
  attention: boolean;
  windowOpen: boolean;
  /** ISO time the 24h window closes, when open. */
  windowClosesAt: string | null;
  stars: number | null;
  subStage: string | null;
  outcome: "open" | "won" | "lost";
  facts: LeadFactState[];
  origin: string | null;
  adName: string | null;
}

export interface ConversationInternalNote {
  id: string;
  body: string;
  authorName: string | null;
  atLabel: string;
}

export interface ConversationDetail {
  id: string;
  channel: Channel;
  contactId: string | null;
  contactName: string;
  contactPhone: string | null;
  status: string;
  priority: "low" | "normal" | "high";
  assignedMembershipId: string | null;
  assignedName: string | null;
  aiSummary: string | null;
  aiIntent: string | null;
  aiSentiment: string | null;
  messages: ChatMessage[];
  internalNotes: ConversationInternalNote[];
  /** Present for contacts managed as leads (WhatsApp). */
  lead: LeadState | null;
}

export interface InboxFilters {
  channel?: string;
  status?: string;
  assignedMembershipId?: string;
  unassigned?: boolean;
  /** Lead filters: needs a human, 24h window open/closed, hot leads. */
  lead?: "attention" | "window_open" | "window_closed" | "hot";
}

export interface InboxData {
  conversations: ConversationListItem[];
  counts: { all: number; unassigned: number; needsAttention: number };
}

export interface InboxOptions {
  members: { id: string; name: string }[];
  quickReplies: { id: string; title: string; body: string }[];
  properties: { id: string; title: string; priceLabel: string }[];
}
