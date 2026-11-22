"use client";

import { Building, Check, ChevronsUpDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Organization } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

interface TenantSwitcherProps {
  organizations: Pick<Organization, "id" | "name" | "plan">[];
  activeOrganizationId: string;
  className?: string;
}

export function TenantSwitcher({ organizations, activeOrganizationId, className }: TenantSwitcherProps) {
  const active = organizations.find((org) => org.id === activeOrganizationId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("h-auto w-full justify-start gap-2.5 px-2 py-2 hover:bg-sidebar-accent", className)}
          aria-label="Cambiar organización"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold text-gold-foreground shadow-sm">
            <Building className="size-4" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <span className="w-full truncate text-left font-heading text-lg leading-tight font-semibold text-sidebar-foreground">
              {active?.name ?? "Organización"}
            </span>
            <span className="text-[11px] tracking-wide text-sidebar-foreground/55">
              Realtor Pro CRM
            </span>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizaciones
        </DropdownMenuLabel>
        {organizations.map((org) => (
          // Switching tenants becomes functional with real memberships in Phase 2.
          <DropdownMenuItem key={org.id} disabled={org.id !== activeOrganizationId}>
            <div className="flex size-6 items-center justify-center rounded-md border border-border bg-background">
              <Building className="size-3.5" />
            </div>
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === activeOrganizationId ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Plus />
          Crear organización
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
