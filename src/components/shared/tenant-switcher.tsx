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

const PLAN_LABELS: Record<Organization["plan"], string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function TenantSwitcher({ organizations, activeOrganizationId, className }: TenantSwitcherProps) {
  const active = organizations.find((org) => org.id === activeOrganizationId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("h-auto w-full justify-start gap-2.5 px-2 py-2", className)}
          aria-label="Cambiar organización"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building className="size-4" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <span className="w-full truncate text-left text-sm font-semibold text-foreground">
              {active?.name ?? "Organización"}
            </span>
            <span className="text-xs text-muted-foreground">
              Plan {active ? PLAN_LABELS[active.plan] : ""}
            </span>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
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
