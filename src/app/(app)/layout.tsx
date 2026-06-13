import { AppShell } from "@/components/shared/app-shell";
import { getTenantContext } from "@/lib/auth/session";

// Tenant data is per-request; never prerender the authenticated app.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getTenantContext();

  return <AppShell ctx={ctx}>{children}</AppShell>;
}
