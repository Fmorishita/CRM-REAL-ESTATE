"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TenantSwitcher } from "@/components/shared/tenant-switcher";
import { MODULES, SIDEBAR_SECTIONS, type ModuleKey } from "@/config/modules";
import type { Organization } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  organizations: Pick<Organization, "id" | "name" | "plan">[];
  activeOrganizationId: string;
  visibleModules: ModuleKey[];
}

export function Sidebar({ organizations, activeOrganizationId, visibleModules }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <TenantSwitcher organizations={organizations} activeOrganizationId={activeOrganizationId} />
      </div>
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4" aria-label="Navegación principal">
        {SIDEBAR_SECTIONS.map((section, index) => {
          const items = section.items.filter((key) => visibleModules.includes(key));
          if (items.length === 0) return null;
          return (
            <div key={section.label ?? index} className="space-y-1">
              {section.label ? (
                <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">{section.label}</p>
              ) : null}
              {items.map((key) => (
                <SidebarLink key={key} moduleKey={key} pathname={pathname} />
              ))}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-3 py-3">
        {visibleModules.includes("settings") ? (
          <SidebarLink moduleKey="settings" pathname={pathname} />
        ) : null}
      </div>
    </aside>
  );
}

function SidebarLink({ moduleKey, pathname }: { moduleKey: ModuleKey; pathname: string }) {
  const moduleDef = MODULES[moduleKey];
  const Icon = moduleDef.icon;
  const isActive = pathname === moduleDef.href || pathname.startsWith(`${moduleDef.href}/`);

  return (
    <Link
      href={moduleDef.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {moduleDef.label}
    </Link>
  );
}
