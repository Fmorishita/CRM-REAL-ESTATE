"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIONS, TRIGGERS } from "@/config/automations";
import { createCustomAutomation } from "@/modules/automations/server/actions";

export function CustomAutomationDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [triggerType, setTriggerType] = React.useState(Object.keys(TRIGGERS)[0]!);
  const [actionTypes, setActionTypes] = React.useState<string[]>([]);

  function toggleAction(key: string) {
    setActionTypes((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));
  }

  async function onSubmit() {
    setPending(true);
    setError(null);
    const result = await createCustomAutomation({ name, triggerType, actionTypes });
    setPending(false);
    if (result.ok) {
      setOpen(false);
      toast.success("Automatización creada (borrador).");
      router.push(`/automations/${result.data.id}`);
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Nueva automatización
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva automatización</DialogTitle>
          <DialogDescription>Elige el disparador y las acciones a ejecutar.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="auto-name" className="text-xs text-muted-foreground">
              Nombre
            </Label>
            <Input id="auto-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Bienvenida a leads de Google" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auto-trigger" className="text-xs text-muted-foreground">
              Trigger
            </Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger id="auto-trigger" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRIGGERS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Acciones</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(ACTIONS).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={actionTypes.includes(key)}
                    onChange={() => toggleAction(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={pending || !name.trim() || actionTypes.length === 0}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
