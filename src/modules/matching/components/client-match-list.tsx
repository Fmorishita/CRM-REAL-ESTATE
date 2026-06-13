import Link from "next/link";
import { Check, MapPin } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { contactTypeLabel } from "@/config/stages";
import { getInitials } from "@/lib/format";
import { CopyMessageButton } from "@/modules/matching/components/copy-message-button";
import { MatchScore } from "@/modules/matching/components/match-score";
import type { ClientMatch } from "@/modules/matching/types";

export function ClientMatchList({ matches }: { matches: ClientMatch[] }) {
  if (matches.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Aún no hay clientes compatibles con esta propiedad.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {matches.map((m) => (
        <li key={m.contactId} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-start gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="text-xs">{getInitials(m.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/contacts/${m.contactId}`} className="truncate text-sm font-medium text-foreground hover:underline">
                    {m.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{contactTypeLabel(m.typeLabel)}</Badge>
                    {m.budgetLabel ? <span>{m.budgetLabel}</span> : null}
                    {m.zone ? (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="size-3" />
                        {m.zone}
                      </span>
                    ) : null}
                  </div>
                </div>
                <MatchScore score={m.score} tier={m.tier} />
              </div>
            </div>
          </div>
          {m.reasons.length > 0 ? (
            <ul className="mt-2 space-y-0.5">
              {m.reasons.slice(0, 2).map((r, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="size-3 shrink-0 text-emerald-500" />
                  {r.text}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-2.5">
            <CopyMessageButton message={m.suggestedMessage} label="Copiar mensaje" />
          </div>
        </li>
      ))}
    </ul>
  );
}
