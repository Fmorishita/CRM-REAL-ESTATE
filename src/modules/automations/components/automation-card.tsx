"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { actionLabel } from "@/config/automations";
import { setAutomationStatus } from "@/modules/automations/server/actions";
import type { AutomationView } from "@/modules/automations/types";

export function AutomationCard({ automation, canManage }: { automation: AutomationView; canManage: boolean }) {
  const router = useRouter();
  const active = automation.status === "active";

  async function onToggle(next: boolean) {
    const result = await setAutomationStatus({ id: automation.id, status: next ? "active" : "inactive" });
    if (result.ok) {
      toast.success(next ? "Automatización activada." : "Automatización pausada.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card className="gap-3">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">
            <Link href={`/automations/${automation.id}`} className="hover:underline">
              {automation.name}
            </Link>
          </CardTitle>
          {canManage ? (
            <Switch checked={active} onCheckedChange={onToggle} aria-label="Activar automatización" />
          ) : (
            <Badge variant={active ? "default" : "outline"}>{active ? "Activa" : "Inactiva"}</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="gap-1">
            <Zap className="size-3" />
            {automation.triggerLabel}
          </Badge>
          {automation.status === "draft" ? <Badge variant="outline">Borrador</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {automation.actions.slice(0, 4).map((a, i) => (
            <span key={i} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {a.label ?? actionLabel(a.type)}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {automation.runCount} ejecuciones
          {automation.lastRunLabel ? ` · última ${automation.lastRunLabel}` : ""}
        </p>
      </CardContent>
    </Card>
  );
}
