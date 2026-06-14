import type { Metadata } from "next";
import { Suspense } from "react";
import { Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MODULES } from "@/config/modules";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { cn } from "@/lib/utils";
import { ConversationList } from "@/modules/inbox/components/conversation-list";
import { ConversationView } from "@/modules/inbox/components/conversation-view";
import { InboxFilters } from "@/modules/inbox/components/inbox-filters";
import { getConversation, getInboxData, getInboxOptions } from "@/modules/inbox/server/queries";
import type { InboxFilters as Filters } from "@/modules/inbox/types";

export const metadata: Metadata = { title: MODULES.inbox.label };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export default async function InboxPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const ctx = await getTenantContext();

  const filters: Filters = {
    channel: pick(params, "channel"),
    status: pick(params, "status"),
    unassigned: pick(params, "unassigned") === "1",
  };

  const [data, options] = await Promise.all([getInboxData(ctx, filters), getInboxOptions(ctx)]);

  // No auto-select: on mobile this lands the user on the conversation list first
  // (a single pane), then tapping a chat opens it full-screen with a back button.
  const selectedId = pick(params, "c") ?? null;
  const conversation = selectedId ? await getConversation(ctx, selectedId) : null;

  const baseParams = new URLSearchParams();
  if (filters.channel) baseParams.set("channel", filters.channel);
  if (filters.status) baseParams.set("status", filters.status);
  if (filters.unassigned) baseParams.set("unassigned", "1");
  const baseQuery = baseParams.toString();

  const hasSelection = Boolean(conversation);
  const canReply = hasPermission(ctx, "conversations.reply");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{MODULES.inbox.label}</h1>
          <p className="text-sm text-muted-foreground">Todas tus conversaciones en un solo lugar.</p>
        </div>
        {isDemoMode() ? <Badge variant="secondary">Datos demo</Badge> : null}
      </div>

      <div className="flex h-[calc(100dvh-15rem)] min-h-[440px] overflow-hidden rounded-xl border border-border bg-card sm:h-[calc(100dvh-13rem)] lg:h-[calc(100dvh-12rem)] lg:min-h-[520px]">
        {/* List pane */}
        <div
          className={cn(
            "w-full min-w-0 flex-col border-r border-border lg:flex lg:w-80 lg:shrink-0",
            hasSelection ? "hidden lg:flex" : "flex",
          )}
        >
          <Suspense fallback={null}>
            <InboxFilters counts={data.counts} />
          </Suspense>
          <div className="flex-1 overflow-y-auto">
            <ConversationList conversations={data.conversations} activeId={selectedId} baseQuery={baseQuery} />
          </div>
        </div>

        {/* Chat pane */}
        <div className={cn("min-w-0 flex-1", hasSelection ? "flex" : "hidden lg:flex")}>
          {conversation ? (
            <div className="w-full min-w-0">
              <ConversationView
                conversation={conversation}
                options={options}
                persist={!isDemoMode() && canReply}
                canReply={canReply}
                backHref={`/inbox${baseQuery ? `?${baseQuery}` : ""}`}
              />
            </div>
          ) : (
            <div className="flex w-full flex-col items-center justify-center gap-2 text-center">
              <Inbox className="size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">Selecciona una conversación</p>
              <p className="text-xs text-muted-foreground">Elige un chat de la lista para empezar a responder.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
