import type { Metadata } from "next";
import { Workflow } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { MODULES } from "@/config/modules";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { AutomationCard } from "@/modules/automations/components/automation-card";
import { CustomAutomationDialog } from "@/modules/automations/components/custom-automation-dialog";
import { TemplateGallery } from "@/modules/automations/components/template-gallery";
import { listAutomations } from "@/modules/automations/server/queries";

export const metadata: Metadata = { title: MODULES.automations.label };

export default async function AutomationsPage() {
  const ctx = await getTenantContext();
  const automations = await listAutomations(ctx);
  const canManage = hasPermission(ctx, "automations.manage");

  return (
    <div className="space-y-8">
      <PageHeader
        title={MODULES.automations.label}
        description="Workflows que dan seguimiento por ti: triggers, condiciones y acciones."
        actions={
          <div className="flex items-center gap-2">
            {isDemoMode() ? <Badge variant="secondary">Datos demo</Badge> : null}
            {canManage ? <CustomAutomationDialog /> : null}
          </div>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Tus automatizaciones</h2>
        {automations.length === 0 ? (
          <EmptyState
            icon={Workflow}
            title="Sin automatizaciones"
            description="Crea una desde una plantilla abajo o construye la tuya con el botón 'Nueva automatización'."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {automations.map((a) => (
              <AutomationCard key={a.id} automation={a} canManage={canManage} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Plantillas</h2>
        <TemplateGallery />
      </section>
    </div>
  );
}
