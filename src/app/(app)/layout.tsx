import { AppShell } from "@/components/shared/app-shell";
import { getTenantContext } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getTenantContext();

  return <AppShell ctx={ctx}>{children}</AppShell>;
}
