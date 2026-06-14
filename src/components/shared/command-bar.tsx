"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MODULES, type ModuleKey } from "@/config/modules";

interface CommandBarProps {
  visibleModules: ModuleKey[];
}

export function CommandBar({ visibleModules }: CommandBarProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full max-w-64 justify-start gap-2 text-muted-foreground sm:w-64"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left text-sm font-normal">Buscar…</span>
        <kbd className="pointer-events-none hidden rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Búsqueda global" description="Navega a cualquier módulo">
        <Command>
          <CommandInput placeholder="Buscar módulos, contactos, propiedades…" />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup heading="Ir a">
              {visibleModules.map((key) => {
                const moduleDef = MODULES[key];
                const Icon = moduleDef.icon;
                return (
                  <CommandItem
                    key={key}
                    value={moduleDef.label}
                    onSelect={() => {
                      setOpen(false);
                      router.push(moduleDef.href);
                    }}
                  >
                    <Icon />
                    {moduleDef.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
