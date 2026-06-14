import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { MODULES } from "@/config/modules";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { CopilotChat } from "@/modules/copilot/components/copilot-chat";

export const metadata: Metadata = { title: MODULES.copilot.label };

export default async function CopilotPage() {
  const ctx = await getTenantContext();
  const canUse = hasPermission(ctx, "copilot.use");

  return (
    <div className="space-y-4">
      <PageHeader
        title={MODULES.copilot.label}
        description="Pregunta, analiza y ejecuta acciones. Las acciones sensibles requieren tu confirmación."
        actions={isDemoMode() ? <Badge variant="secondary">Datos demo</Badge> : null}
      />
      {canUse ? (
        <CopilotChat />
      ) : (
        <p className="text-sm text-muted-foreground">No tienes permiso para usar el copiloto.</p>
      )}
    </div>
  );
}
