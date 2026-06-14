"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Search, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS, STATUS_LABELS } from "@/config/properties";
import { cn } from "@/lib/utils";

const ALL = "all";

export function PropertiesToolbar({ view }: { view: "grid" | "table" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");

  const update = React.useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "" || value === ALL) params.delete(key);
        else params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  React.useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (search === current) return;
    const t = setTimeout(() => update({ search: search || null }), 350);
    return () => clearTimeout(t);
  }, [search, searchParams, update]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, zona o ciudad…"
            className="pl-8"
          />
        </div>
        <Select value={searchParams.get("type") ?? ALL} onValueChange={(v) => update({ type: v })}>
          <SelectTrigger className="w-auto min-w-32" size="sm">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los tipos</SelectItem>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={searchParams.get("operation") ?? ALL} onValueChange={(v) => update({ operation: v })}>
          <SelectTrigger className="w-auto min-w-28" size="sm">
            <SelectValue placeholder="Operación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toda operación</SelectItem>
            {Object.entries(OPERATION_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={searchParams.get("status") ?? ALL} onValueChange={(v) => update({ status: v })}>
          <SelectTrigger className="w-auto min-w-28" size="sm">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todo estado</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Vista de cuadrícula"
          className={cn(view === "grid" && "bg-muted")}
          onClick={() => update({ view: null })}
        >
          <LayoutGrid />
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
