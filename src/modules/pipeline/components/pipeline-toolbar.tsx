"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Columns3, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL = "all";

interface Props {
  view: "board" | "table";
  members: { id: string; name: string }[];
}

export function PipelineToolbar({ view, members }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === ALL) params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <Select value={searchParams.get("agent") ?? ALL} onValueChange={(v) => update({ agent: v })}>
        <SelectTrigger className="w-auto min-w-40" size="sm">
          <SelectValue placeholder="Agente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los agentes</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Vista kanban"
          className={cn(view === "board" && "bg-muted")}
          onClick={() => update({ view: null })}
        >
          <Columns3 />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Vista de tabla"
          className={cn(view === "table" && "bg-muted")}
          onClick={() => update({ view: "table" })}
        >
          <Table2 />
        </Button>
      </div>
    </div>
  );
}
