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
import { Textarea } from "@/components/ui/textarea";
import { createVisit } from "@/modules/visits/server/actions";
import type { VisitFormOptions } from "@/modules/visits/types";

const UNSET = "none";

export function VisitFormDialog({ options, defaultDate }: { options: VisitFormOptions; defaultDate?: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const agent = formData.get("assignedMembershipId") as string;
    const result = await createVisit({
      contactId: formData.get("contactId"),
      propertyId: formData.get("propertyId"),
      assignedMembershipId: agent === UNSET ? undefined : agent,
      scheduledAt: formData.get("scheduledAt"),
      durationMin: Number(formData.get("durationMin") || 60),
      notes: formData.get("notes"),
    });
    setPending(false);
    if (result.ok) {
      setOpen(false);
      toast.success("Visita agendada.");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  const defaultDateTime = defaultDate ? `${defaultDate}T10:00` : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Agendar visita
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agendar visita</DialogTitle>
          <DialogDescription>Selecciona cliente, propiedad y horario.</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <Field label="Cliente" htmlFor="contactId">
            <Select name="contactId" required>
              <SelectTrigger id="contactId" className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {options.contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Propiedad" htmlFor="propertyId">
            <Select name="propertyId" required>
              <SelectTrigger id="propertyId" className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {options.properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha y hora" htmlFor="scheduledAt">
              <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required defaultValue={defaultDateTime} />
            </Field>
            <Field label="Duración (min)" htmlFor="durationMin">
              <Input id="durationMin" name="durationMin" type="number" min="15" step="15" defaultValue={60} />
            </Field>
          </div>
          <Field label="Agente" htmlFor="assignedMembershipId">
            <Select name="assignedMembershipId" defaultValue={UNSET}>
              <SelectTrigger id="assignedMembershipId" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>Asignarme a mí</SelectItem>
                {options.members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notas" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={2} placeholder="Qué mostrar, qué llevar…" />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Agendar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
