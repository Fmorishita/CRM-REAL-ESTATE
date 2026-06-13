import { Building2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { portalLogout } from "@/modules/portal/server/auth";
import type { PortalBrand } from "@/modules/portal/types";

export function PortalHeader({ brand, clientName }: { brand: PortalBrand; clientName: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span
            className="flex size-8 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <Building2 className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">{brand.name}</p>
            <p className="text-[11px] text-muted-foreground">Portal de clientes</p>
          </div>
        </div>
        <form action={portalLogout}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </form>
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-1">
        <p className="text-[11px] text-muted-foreground">Hola, {clientName}</p>
      </div>
    </header>
  );
}
