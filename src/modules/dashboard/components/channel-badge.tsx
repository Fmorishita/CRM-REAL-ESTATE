import type { Channel } from "@prisma/client";
import { Camera, Globe, Mail, MessageCircle, MessagesSquare, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const CHANNEL_META: Record<Channel, { label: string; icon: LucideIcon; className: string }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, className: "text-emerald-600 dark:text-emerald-400" },
  email: { label: "Email", icon: Mail, className: "text-blue-600 dark:text-blue-400" },
  instagram: { label: "Instagram", icon: Camera, className: "text-pink-600 dark:text-pink-400" },
  facebook: { label: "Facebook", icon: MessagesSquare, className: "text-indigo-600 dark:text-indigo-400" },
  webchat: { label: "Web chat", icon: Globe, className: "text-zinc-600 dark:text-zinc-400" },
};

export function ChannelIcon({ channel, className }: { channel: Channel; className?: string }) {
  const meta = CHANNEL_META[channel];
  const Icon = meta.icon;
  return <Icon className={cn("size-4", meta.className, className)} aria-label={meta.label} />;
}

export function channelLabel(channel: Channel): string {
  return CHANNEL_META[channel].label;
}
