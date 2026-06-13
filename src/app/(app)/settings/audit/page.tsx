import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ScrollText, ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { listAuditLogs } from "@/modules/audit/server/queries";

export const metadata: Metadata = { title: "Auditoría" };

export default async function AuditPage() {
  const ctx = await getTenantContext();
  if (!hasPermission(ctx, "settings.manage")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Auditoría" description="Registro de acciones sensibles." />
        <p className="text-sm text-muted-foreground">No tienes permiso para ver la auditoría.</p>
      </div>
    );
  }

  const logs = await listAuditLogs(ctx);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/settings">
          <ArrowLeft />
          Configuración
        </Link>
      </Button>

      <PageHeader
        title="Auditoría"
        description="Registro de acciones sensibles realizadas en tu organización."
        actions={isDemoMode() ? <Badge variant="secondary">Datos demo</Badge> : null}
      />

      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
        <div>
          <p className="font-medium text-foreground">Aislamiento por organización activo</p>
          <p className="text-muted-foreground">
            Cada registro está aislado por organización (organization_id) con Row Level Security en la base de datos.
            Las acciones sensibles quedan registradas aquí.
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="Sin actividad" description="Aún no se han registrado acciones sensibles." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{log.actionLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {log.actorName ?? "Sistema"}
                  {log.entityType ? ` · ${log.entityType}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{log.atLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
