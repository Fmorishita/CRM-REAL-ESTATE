import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { AutomationDetailActions } from "@/modules/automations/components/automation-detail-actions";
import { AutomationFlow } from "@/modules/automations/components/automation-flow";
import { RunList } from "@/modules/automations/components/run-list";
import { getAutomation, listAutomationRuns } from "@/modules/automations/server/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ctx = await getTenantContext();
  const automation = await getAutomation(ctx, id);
  return { title: automation ? automation.name : "Automatización" };
}

export default async function AutomationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();

  const [automation, runs] = await Promise.all([getAutomation(ctx, id), listAutomationRuns(ctx, id)]);
  if (!automation) notFound();

  const canManage = hasPermission(ctx, "automations.manage");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/automations">
            <ArrowLeft />
            Automatizaciones
          </Link>
        </Button>
        {canManage ? <AutomationDetailActions id={automation.id} status={automation.status} /> : null}
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{automation.name}</h1>
        <p className="text-sm text-muted-foreground">
          {automation.runCount} ejecuciones · creada {automation.createdAtLabel}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Flujo</CardTitle>
            </CardHeader>
            <CardContent>
              <AutomationFlow automation={automation} />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de ejecución</CardTitle>
            </CardHeader>
            <CardContent>
              <RunList runs={runs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
