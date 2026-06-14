"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MOBILE_MORE_ITEMS, MOBILE_NAV_ITEMS, MODULES, type ModuleKey } from "@/config/modules";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  visibleModules: ModuleKey[];
}

export function MobileNav({ visibleModules }: MobileNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const primaryItems = MOBILE_NAV_ITEMS.filter((key) => visibleModules.includes(key));
  const moreItems = MOBILE_MORE_ITEMS.filter((key) => visibleModules.includes(key));
  const isMoreActive = moreItems.some((key) => pathname.startsWith(MODULES[key].href));

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden"
    >
      <div className="grid h-16 grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {primaryItems.map((key) => {
          const moduleDef = MODULES[key];
          const Icon = moduleDef.icon;
          const isActive = pathname === moduleDef.href || pathname.startsWith(`${moduleDef.href}/`);
          return (
            <Link
              key={key}
              href={moduleDef.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {moduleDef.label}
            </Link>
          );
        })}
        {moreItems.length > 0 ? (
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                isMoreActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Ellipsis className="size-5" />
              Más
            </SheetTrigger>
            <SheetContent side="bottom" className="pb-[max(env(safe-area-inset-bottom),1rem)]">
              <SheetHeader>
                <SheetTitle>Más módulos</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-2 px-4 pb-2">
                {moreItems.map((key) => {
                  const moduleDef = MODULES[key];
                  const Icon = moduleDef.icon;
                  return (
                    <Link
                      key={key}
                      href={moduleDef.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Icon className="size-5 text-muted-foreground" />
                      {moduleDef.label}
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
    </nav>
  );
}
