"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function VisitsToolbar({ date, members }: { date: string; members: { id: string; name: string }[] }) {
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon-sm" aria-label="Día anterior" onClick={() => update({ date: shiftDate(date, -1) })}>
          <ChevronLeft />
        </Button>
        <Input
          type="date"
          value={date}
          onChange={(e) => update({ date: e.target.value || null })}
          className="w-auto"
        />
        <Button variant="outline" size="icon-sm" aria-label="Día siguiente" onClick={() => update({ date: shiftDate(date, 1) })}>
          <ChevronRight />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => update({ date: null })}>
          Hoy
        </Button>
      </div>
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
    </div>
  );
}
