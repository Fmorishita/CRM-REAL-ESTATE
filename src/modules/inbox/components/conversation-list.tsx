import Link from "next/link";
import { Inbox } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { conversationStatusTone } from "@/config/channels";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChannelIcon } from "@/modules/dashboard/components/channel-badge";
import type { ConversationListItem } from "@/modules/inbox/types";

export function ConversationList({
  conversations,
  activeId,
  baseQuery,
}: {
  conversations: ConversationListItem[];
  activeId: string | null;
  baseQuery: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
        <Inbox className="size-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">Sin conversaciones</p>
        <p className="text-xs text-muted-foreground">No hay conversaciones con estos filtros.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {conversations.map((c) => {
        const params = new URLSearchParams(baseQuery);
        params.set("c", c.id);
        const isActive = c.id === activeId;
        return (
          <li key={c.id}>
            <Link
              href={`/inbox?${params.toString()}`}
              className={cn(
                "flex gap-3 px-3 py-3 transition-colors hover:bg-muted/60",
                isActive && "bg-muted",
              )}
            >
              <div className="relative">
                <Avatar className="size-9">
                  <AvatarFallback className="text-xs">{getInitials(c.contactName)}</AvatarFallback>
                </Avatar>
                <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-background">
                  <ChannelIcon channel={c.channel} className="size-3" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{c.contactName}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{c.lastMessageLabel}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{c.snippet}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn("text-[11px] font-medium", conversationStatusTone(c.status))}>
                    {c.assignedName ?? "Sin asignar"}
                  </span>
                  {c.unreadCount > 0 ? (
                    <span className="ml-auto flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {c.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
