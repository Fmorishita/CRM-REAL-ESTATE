import type { Metadata } from "next";
import { ArrowLeft, Bot, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { formatNumber } from "@/lib/format";
import { AiConfigEditor } from "@/modules/ai/components/ai-config-editor";
import { getAiUsageSummary, listAiTaskConfigs } from "@/modules/ai/server/queries";

export const metadata: Metadata = { title: "Inteligencia artificial" };

export default async function AiSettingsPage() {
  const ctx = await getTenantContext();
  const [configs, usage] = await Promise.all([listAiTaskConfigs(ctx), getAiUsageSummary(ctx)]);
  const canConfigure = hasPermission(ctx, "ai.configure");
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/settings">
          <ArrowLeft />
          Configuración
        </Link>
      </Button>

      <PageHeader
        title="Inteligencia artificial"
        description="Configura el proveedor y modelo de IA para cada tarea. Sin API keys, el sistema usa el proveedor mock."
      />

      <div
        className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${
          hasAnthropic
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-border bg-muted/30"
        }`}
      >
        {hasAnthropic ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
        ) : (
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium text-foreground">
            {hasAnthropic ? "Anthropic (Claude) conectado" : "Modo mock activo"}
          </p>
          <p className="text-muted-foreground">
            {hasAnthropic
              ? "Las tareas configuradas con Anthropic usan la API real de Claude."
              : "Agrega ANTHROPIC_API_KEY (u otra API key) en las variables de entorno para activar respuestas reales. Mientras tanto, todas las tareas responden con el proveedor mock."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Solicitudes de IA" value={formatNumber(usage.totalRequests, ctx.organization.defaultLocale)} icon={Bot} />
        <StatCard
          label="Costo acumulado"
          value={`$${usage.totalCostUsd.toFixed(4)}`}
          hint="USD, tracking por request"
        />
        <StatCard label="Tareas configurables" value={formatNumber(configs.length, ctx.organization.defaultLocale)} />
      </div>

      {canConfigure ? (
        <AiConfigEditor configs={configs} />
      ) : (
        <p className="text-sm text-muted-foreground">No tienes permiso para configurar la IA.</p>
      )}
    </div>
  );
}
