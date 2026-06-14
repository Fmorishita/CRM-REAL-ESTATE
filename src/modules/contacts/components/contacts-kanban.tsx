import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CRM_STAGES, stageTone } from "@/config/stages";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ScoreBadge, TagChip } from "@/modules/contacts/components/contact-badges";
import type { ContactListItem } from "@/modules/contacts/types";

export function ContactsKanban({ contacts }: { contacts: ContactListItem[] }) {
  const byStage = new Map<string, ContactListItem[]>();
  for (const stage of CRM_STAGES) byStage.set(stage.key, []);
  for (const c of contacts) {
    const list = byStage.get(c.stage);
    if (list) list.push(c);
    else byStage.set(c.stage, [c]);
  }

  // Only show stages that have contacts, to keep the board focused.
  const visibleStages = CRM_STAGES.filter((s) => (byStage.get(s.key)?.length ?? 0) > 0);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {visibleStages.map((stage) => {
        const items = byStage.get(stage.key) ?? [];
        return (
          <div key={stage.key} className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30">
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className={cn("text-sm font-medium", stageTone(stage.key))}>{stage.label}</span>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="flex flex-col gap-2 px-2 pb-2">
              {items.map((c) => (
                <Link
                  key={c.id}
                  href={`/contacts/${c.id}`}
                  className="rounded-lg border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">{getInitials(c.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                    </div>
                    <ScoreBadge score={c.score} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{c.typeLabel}</p>
                  {c.budgetLabel ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.budgetLabel}</p>
                  ) : null}
                  {c.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <TagChip key={t.id} name={t.name} color={t.color} />
                      ))}
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
