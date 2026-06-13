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
import { createOpportunity } from "@/modules/pipeline/server/actions";
import type { OpportunityFormOptions } from "@/modules/pipeline/types";

const UNSET = "none";

export function OpportunityFormDialog({ options }: { options: OpportunityFormOptions }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const propertyId = formData.get("propertyId") as string;
    const assignedMembershipId = formData.get("assignedMembershipId") as string;
    const closeDate = formData.get("expectedCloseDate") as string;
    const commission = formData.get("commissionAmount");

    const input = {
      pipelineId: options.pipelineId,
      stageId: formData.get("stageId"),
      contactId: formData.get("contactId"),
      propertyId: propertyId === UNSET ? undefined : propertyId,
      title: formData.get("title"),
      amount: Number(formData.get("amount")),
      currency: options.defaultCurrency,
      commissionAmount: commission ? Number(commission) : undefined,
      probability: Number(formData.get("probability") || 0),
      expectedCloseDate: closeDate || undefined,
      assignedMembershipId: assignedMembershipId === UNSET ? undefined : assignedMembershipId,
    };

    const result = await createOpportunity(input);
    setPending(false);
    if (result.ok) {
      setOpen(false);
      toast.success("Oportunidad creada.");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Nueva oportunidad
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva oportunidad</DialogTitle>
          <DialogDescription>Relaciona un contacto y una propiedad para darle seguimiento al cierre.</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <Field label="Título" htmlFor="title">
            <Input id="title" name="title" required placeholder="Ej. Casa Ensenada - Roberto Gómez" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contacto" htmlFor="contactId">
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
              <Select name="propertyId" defaultValue={UNSET}>
                <SelectTrigger id="propertyId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET}>Sin propiedad</SelectItem>
                  {options.properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Valor (${options.defaultCurrency})`} htmlFor="amount">
              <Input id="amount" name="amount" type="number" min="0" required placeholder="0" />
            </Field>
            <Field label="Comisión estimada" htmlFor="commissionAmount">
              <Input id="commissionAmount" name="commissionAmount" type="number" min="0" placeholder="0" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Etapa" htmlFor="stageId">
              <Select name="stageId" defaultValue={options.stages[0]?.id} required>
                <SelectTrigger id="stageId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Prob. %" htmlFor="probability">
              <Input id="probability" name="probability" type="number" min="0" max="100" placeholder="0" />
            </Field>
            <Field label="Cierre" htmlFor="expectedCloseDate">
              <Input id="expectedCloseDate" name="expectedCloseDate" type="date" />
            </Field>
          </div>
          <Field label="Agente asignado" htmlFor="assignedMembershipId">
            <Select name="assignedMembershipId" defaultValue={UNSET}>
              <SelectTrigger id="assignedMembershipId" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>Sin asignar</SelectItem>
                {options.members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Crear oportunidad
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
