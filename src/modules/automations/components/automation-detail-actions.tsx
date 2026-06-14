"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { deleteAutomation, runAutomationNow, setAutomationStatus } from "@/modules/automations/server/actions";

export function AutomationDetailActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [running, setRunning] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function onToggle(next: boolean) {
    const result = await setAutomationStatus({ id, status: next ? "active" : "inactive" });
    if (result.ok) {
      toast.success(next ? "Activada." : "Pausada.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function onRun() {
    setRunning(true);
    const result = await runAutomationNow({ id });
    setRunning(false);
    if (result.ok) {
      toast.success("Ejecución simulada registrada.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function onDelete() {
    if (!confirm("¿Eliminar esta automatización?")) return;
    setDeleting(true);
    const result = await deleteAutomation({ id });
    setDeleting(false);
    if (result.ok) {
      toast.success("Automatización eliminada.");
      router.push("/automations");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Switch checked={status === "active"} onCheckedChange={onToggle} aria-label="Activar" />
        {status === "active" ? "Activa" : "Inactiva"}
      </label>
      <Button variant="outline" size="sm" onClick={onRun} disabled={running}>
        {running ? <Loader2 className="animate-spin" /> : <Play />}
        Ejecutar ahora
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Eliminar" onClick={onDelete} disabled={deleting}>
        <Trash2 />
      </Button>
    </div>
  );
}
