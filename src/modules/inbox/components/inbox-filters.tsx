"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHANNEL_LABELS } from "@/config/channels";
import { cn } from "@/lib/utils";

const ALL = "all";

interface Props {
  counts: { all: number; unassigned: number; needsAttention: number };
}

export function InboxFilters({ counts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    // Changing filters resets the selected conversation.
    params.delete("c");
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === ALL) params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeFilter = searchParams.get("unassigned")
    ? "unassigned"
    : searchParams.get("status") === "needs_attention"
      ? "attention"
      : "all";

  const tabs = [
    { key: "all", label: "Todas", count: counts.all, patch: { unassigned: null, status: null } },
    { key: "unassigned", label: "Sin asignar", count: counts.unassigned, patch: { unassigned: "1", status: null } },
    { key: "attention", label: "Atención", count: counts.needsAttention, patch: { unassigned: null, status: "needs_attention" } },
  ];

  return (
    <div className="space-y-2 border-b border-border p-3">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => update(tab.patch)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              activeFilter === tab.key ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            {tab.label}
            <span className="text-[10px] text-muted-foreground">{tab.count}</span>
          </button>
        ))}
      </div>
      <Select value={searchParams.get("channel") ?? ALL} onValueChange={(v) => update({ channel: v })}>
        <SelectTrigger className="w-full" size="sm">
          <SelectValue placeholder="Canal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los canales</SelectItem>
          {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
