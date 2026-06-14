import type { Channel } from "@prisma/client";

export interface DashboardStats {
  newLeads: number;
  pendingConversations: number;
  upcomingVisits: number;
  pipelineValue: number;
  weightedForecast: number;
}

export type CommandKind = "overdue_task" | "today_task" | "stale_leads" | "next_action";

export interface CommandItem {
  id: string;
  kind: CommandKind;
  title: string;
  hint?: string;
  priority: "low" | "medium" | "high";
  href: string;
}

export interface HotLead {
  id: string;
  name: string;
  type: string;
  score: number;
  budgetLabel: string | null;
  zone: string | null;
  lastContactLabel: string | null;
  recommendedAction: string;
}

export interface PipelineStageSummary {
  id: string;
  name: string;
  count: number;
  value: number;
}

export interface PipelineOverview {
  stages: PipelineStageSummary[];
  totalValue: number;
  weightedForecast: number;
  openCount: number;
}

export interface PendingConversation {
  id: string;
  contactName: string;
  channel: Channel;
  status: string;
  snippet: string;
  lastMessageLabel: string | null;
  unreadCount: number;
  priority: "low" | "normal" | "high";
}

export interface UpcomingVisit {
  id: string;
  contactName: string;
  propertyTitle: string;
  dayLabel: string;
  timeLabel: string;
  status: string;
  locationLabel: string | null;
  mapsQuery: string | null;
}

export interface PropertyInterest {
  id: string;
  title: string;
  type: string;
  status: string;
  priceLabel: string;
  interest: number;
}

export interface AiInsight {
  id: string;
  tone: "info" | "warning" | "success";
  text: string;
}

export interface DashboardData {
  currency: string;
  locale: string;
  timezone: string;
  stats: DashboardStats;
  commandCenter: CommandItem[];
  hotLeads: HotLead[];
  pipeline: PipelineOverview;
  conversations: PendingConversation[];
  visits: UpcomingVisit[];
  propertyPerformance: PropertyInterest[];
  insights: AiInsight[];
}
