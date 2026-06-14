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
}

export interface ChatMessage {
  id: string;
  direction: "inbound" | "outbound";
  authorType: "contact" | "member" | "ai" | "system";
  authorName: string | null;
  body: string;
  timeLabel: string;
  status: string;
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
}

export interface InboxFilters {
  channel?: string;
  status?: string;
  assignedMembershipId?: string;
  unassigned?: boolean;
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
