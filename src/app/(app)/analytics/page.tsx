import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { MODULES } from "@/config/modules";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { AnalyticsView } from "@/modules/analytics/components/analytics-view";
import { getAnalytics } from "@/modules/analytics/server/queries";

export const metadata: Metadata = { title: MODULES.analytics.label };

export default async function AnalyticsPage() {
  const ctx = await getTenantContext();
  if (!hasPermission(ctx, "analytics.view")) {
    return (
      <div className="space-y-6">
        <PageHeader title={MODULES.analytics.label} description={MODULES.analytics.description} />
        <p className="text-sm text-muted-foreground">No tienes permiso para ver analytics.</p>
      </div>
    );
  }

  const data = await getAnalytics(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title={MODULES.analytics.label}
        description="Rendimiento por agente, fuente y propiedad. Decisiones con datos."
        actions={isDemoMode() ? <Badge variant="secondary">Datos demo</Badge> : null}
      />
      <AnalyticsView data={data} />
    </div>
  );
}
