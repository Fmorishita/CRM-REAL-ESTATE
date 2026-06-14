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
import { CRM_STAGES, CONTACT_TYPE_LABELS } from "@/config/stages";
import { cn } from "@/lib/utils";
import type { ContactTagView } from "@/modules/contacts/types";

const ALL = "all";

interface Props {
  view: "table" | "kanban";
  tags: ContactTagView[];
}

export function ContactsToolbar({ view, tags }: Props) {
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

  // Debounce the search input before pushing to the URL.
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
            placeholder="Buscar por nombre, email o teléfono…"
            className="pl-8"
          />
        </div>
        <Select value={searchParams.get("type") ?? ALL} onValueChange={(v) => update({ type: v })}>
          <SelectTrigger className="w-auto min-w-32" size="sm">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los tipos</SelectItem>
            {Object.entries(CONTACT_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={searchParams.get("stage") ?? ALL} onValueChange={(v) => update({ stage: v })}>
          <SelectTrigger className="w-auto min-w-32" size="sm">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las etapas</SelectItem>
            {CRM_STAGES.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tags.length > 0 ? (
          <Select value={searchParams.get("tag") ?? ALL} onValueChange={(v) => update({ tag: v })}>
            <SelectTrigger className="w-auto min-w-28" size="sm">
              <SelectValue placeholder="Etiqueta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las etiquetas</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.name}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Vista de tabla"
          className={cn(view === "table" && "bg-muted")}
          onClick={() => update({ view: null })}
        >
          <Table2 />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Vista kanban"
          className={cn(view === "kanban" && "bg-muted")}
          onClick={() => update({ view: "kanban" })}
        >
          <LayoutGrid />
        </Button>
      </div>
    </div>
  );
}
