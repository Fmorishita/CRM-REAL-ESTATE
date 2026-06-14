import {
  Building2,
  CalendarClock,
  Columns3,
  MessageCircle,
  StickyNote,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { TimelineEntry } from "@/modules/contacts/types";

const KIND_META: Record<TimelineEntry["kind"], { icon: LucideIcon; className: string }> = {
  created: { icon: UserPlus, className: "text-blue-600 dark:text-blue-400" },
  note: { icon: StickyNote, className: "text-amber-600 dark:text-amber-400" },
  opportunity: { icon: Columns3, className: "text-violet-600 dark:text-violet-400" },
  visit: { icon: CalendarClock, className: "text-orange-600 dark:text-orange-400" },
  conversation: { icon: MessageCircle, className: "text-emerald-600 dark:text-emerald-400" },
  favorite: { icon: Building2, className: "text-pink-600 dark:text-pink-400" },
  stage: { icon: Columns3, className: "text-sky-600 dark:text-sky-400" },
};

export function ContactTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sin actividad todavía.</p>;
  }

  return (
    <ol className="relative space-y-4 pl-2">
      {entries.map((entry, index) => {
        const meta = KIND_META[entry.kind];
        const Icon = meta.icon;
        return (
          <li key={entry.id} className="relative flex gap-3 pl-6">
            {index < entries.length - 1 ? (
              <span className="absolute top-7 left-[10px] h-full w-px bg-border" aria-hidden />
            ) : null}
            <span className="absolute left-0 flex size-5 items-center justify-center">
              <Icon className={cn("size-4", meta.className)} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{entry.title}</p>
              {entry.detail ? (
                <p className="truncate text-sm text-muted-foreground">{entry.detail}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">{entry.atLabel}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
