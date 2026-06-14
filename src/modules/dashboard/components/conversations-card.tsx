import Link from "next/link";
import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChannelIcon } from "@/modules/dashboard/components/channel-badge";
import type { PendingConversation } from "@/modules/dashboard/types";

const STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  open: "Abierto",
  waiting_customer: "Esperando cliente",
  needs_attention: "Requiere atención",
};

export function ConversationsCard({ conversations }: { conversations: PendingConversation[] }) {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>Conversaciones pendientes</CardTitle>
        <CardDescription>WhatsApp, email y web chat que esperan respuesta.</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/inbox">Abrir inbox</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <div className="px-2 pb-2">
        {conversations.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Inbox al día"
            description="No tienes conversaciones pendientes por responder."
            className="mx-4 mb-2 border-0 bg-transparent py-8"
          />
        ) : (
          <ul className="divide-y divide-border">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <Link href="/inbox" className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-muted">
                  <div className="mt-0.5">
                    <ChannelIcon channel={conv.channel} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{conv.contactName}</p>
                      {conv.status === "needs_attention" ? (
                        <Badge variant="destructive" className="shrink-0">
                          {STATUS_LABELS[conv.status]}
                        </Badge>
                      ) : (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {STATUS_LABELS[conv.status] ?? conv.status}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{conv.snippet}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {conv.lastMessageLabel ? (
                      <span className="text-[11px] text-muted-foreground">{conv.lastMessageLabel}</span>
                    ) : null}
                    {conv.unreadCount > 0 ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
