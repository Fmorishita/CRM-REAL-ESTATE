import { MobileNav } from "@/components/shared/mobile-nav";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { MODULES, type ModuleDefinition, type ModuleKey } from "@/config/modules";
import { ROLE_LABELS } from "@/config/permissions";
import type { TenantContext } from "@/lib/auth/types";

interface AppShellProps {
  ctx: TenantContext;
  children: React.ReactNode;
}

/** Authenticated application frame: sidebar (desktop), topbar, bottom nav (mobile). */
export function AppShell({ ctx, children }: AppShellProps) {
  const visibleModules = (Object.keys(MODULES) as ModuleKey[]).filter((key) => {
    const { permission }: ModuleDefinition = MODULES[key];
    return permission === undefined || ctx.permissions.includes(permission);
  });

  const organizations = ctx.organizations.map(({ id, name, plan }) => ({ id, name, plan }));

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar
        organizations={organizations}
        activeOrganizationId={ctx.organization.id}
        visibleModules={visibleModules}
      />
      <div className="flex min-h-dvh flex-col lg:pl-60">
        <Topbar
          userName={ctx.user.name}
          userEmail={ctx.user.email}
          roleLabel={ROLE_LABELS[ctx.role]}
          visibleModules={visibleModules}
        />
        <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">{children}</main>
      </div>
      <MobileNav visibleModules={visibleModules} />
    </div>
  );
}
