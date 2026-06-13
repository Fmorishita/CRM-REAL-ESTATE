"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

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
import { CONTACT_TYPE_LABELS, CRM_STAGES } from "@/config/stages";
import { createContact, updateContact } from "@/modules/contacts/server/actions";
import type { ContactFormOptions } from "@/modules/contacts/types";

const UNSET = "none";

export interface ContactFormInitial {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  stage: string;
}

interface Props {
  options: ContactFormOptions;
  initial?: ContactFormInitial;
  trigger?: React.ReactNode;
}

export function ContactFormDialog({ options, initial, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isEdit = Boolean(initial);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const budgetMin = formData.get("budgetMin");
    const budgetMax = formData.get("budgetMax");
    const zone = (formData.get("zone") as string)?.trim();
    const leadSourceId = formData.get("leadSourceId") as string;
    const assignedMembershipId = formData.get("assignedMembershipId") as string;

    const hasPreference = budgetMin || budgetMax || zone;
    const input = {
      type: formData.get("type"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      whatsapp: formData.get("whatsapp"),
      stage: formData.get("stage"),
      leadSourceId: leadSourceId === UNSET ? undefined : leadSourceId,
      assignedMembershipId: assignedMembershipId === UNSET ? undefined : assignedMembershipId,
      preference: hasPreference
        ? {
            budgetMin: budgetMin ? Number(budgetMin) : undefined,
            budgetMax: budgetMax ? Number(budgetMax) : undefined,
            zones: zone ? [zone] : [],
            urgency: formData.get("urgency") || "medium",
          }
        : undefined,
    };

    const result = isEdit ? await updateContact(initial!.id, input) : await createContact(input);
    setPending(false);

    if (result.ok) {
      setOpen(false);
      router.refresh();
      if (!isEdit && "id" in result.data) router.push(`/contacts/${result.data.id}`);
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus />
            Nuevo contacto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar contacto" : "Nuevo contacto"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Actualiza la información del contacto." : "Agrega un nuevo prospecto a tu CRM."}
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" htmlFor="firstName">
              <Input id="firstName" name="firstName" required defaultValue={initial?.firstName} />
            </Field>
            <Field label="Apellido" htmlFor="lastName">
              <Input id="lastName" name="lastName" required defaultValue={initial?.lastName} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo" htmlFor="type">
              <Select name="type" defaultValue={initial?.type ?? "buyer"}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTACT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Etapa" htmlFor="stage">
              <Select name="stage" defaultValue={initial?.stage ?? "new"}>
                <SelectTrigger id="stage" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRM_STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={initial?.email ?? ""} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono" htmlFor="phone">
              <Input id="phone" name="phone" defaultValue={initial?.phone ?? ""} />
            </Field>
            <Field label="WhatsApp" htmlFor="whatsapp">
              <Input id="whatsapp" name="whatsapp" defaultValue={initial?.whatsapp ?? ""} />
            </Field>
          </div>
          {!isEdit ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Presupuesto mín." htmlFor="budgetMin">
                  <Input id="budgetMin" name="budgetMin" type="number" min="0" placeholder="0" />
                </Field>
                <Field label="Presupuesto máx." htmlFor="budgetMax">
                  <Input id="budgetMax" name="budgetMax" type="number" min="0" placeholder="0" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Zona de interés" htmlFor="zone">
                  <Input id="zone" name="zone" placeholder="Ej. Zona Río" />
                </Field>
                <Field label="Urgencia" htmlFor="urgency">
                  <Select name="urgency" defaultValue="medium">
                    <SelectTrigger id="urgency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fuente" htmlFor="leadSourceId">
              <Select name="leadSourceId" defaultValue={UNSET}>
                <SelectTrigger id="leadSourceId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET}>Sin fuente</SelectItem>
                  {options.leadSources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
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
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {isEdit ? "Guardar cambios" : "Crear contacto"}
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
