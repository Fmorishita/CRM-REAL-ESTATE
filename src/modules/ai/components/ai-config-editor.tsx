"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AI_PROVIDERS } from "@/lib/ai/registry";
import type { AiProviderId } from "@/lib/ai/types";
import { updateAiTaskConfig } from "@/modules/ai/server/actions";
import type { AiTaskConfigView } from "@/modules/ai/types";

export function AiConfigEditor({ configs }: { configs: AiTaskConfigView[] }) {
  return (
    <div className="space-y-4">
      {configs.map((config) => (
        <TaskRow key={config.taskKey} config={config} />
      ))}
    </div>
  );
}

function modelsFor(provider: AiProviderId) {
  return AI_PROVIDERS.find((p) => p.id === provider)?.models ?? [];
}

function TaskRow({ config }: { config: AiTaskConfigView }) {
  const router = useRouter();
  const [provider, setProvider] = React.useState<AiProviderId>(config.provider);
  const [model, setModel] = React.useState(config.model);
  const [temperature, setTemperature] = React.useState(config.temperature);
  const [requiresApproval, setRequiresApproval] = React.useState(config.requiresApproval);
  const [enabled, setEnabled] = React.useState(config.enabled);
  const [pending, setPending] = React.useState(false);

  const providerInfo = AI_PROVIDERS.find((p) => p.id === provider);
  const models = modelsFor(provider);

  function onProviderChange(next: AiProviderId) {
    setProvider(next);
    const first = modelsFor(next)[0];
    if (first) setModel(first.id);
  }

  async function onSave() {
    setPending(true);
    const result = await updateAiTaskConfig({
      taskKey: config.taskKey,
      provider,
      model,
      temperature,
      requiresApproval,
      enabled,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Configuración guardada.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {config.label}
          {!providerInfo?.implemented ? <Badge variant="outline">Próximamente</Badge> : null}
        </CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Proveedor</Label>
            <Select value={provider} onValueChange={(v) => onProviderChange(v as AiProviderId)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                    {!p.implemented ? " (próximamente)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Modelo</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Temperatura</Label>
            <span className="text-xs tabular-nums text-foreground">{temperature.toFixed(2)}</span>
          </div>
          <Slider
            value={[temperature]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={(v) => setTemperature(v[0] ?? 0)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
            Requiere aprobación humana
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            Activa
          </label>
          <Button size="sm" onClick={onSave} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
