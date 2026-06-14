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
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS, STATUS_LABELS } from "@/config/properties";
import { createProperty, updateProperty } from "@/modules/properties/server/actions";
import type { PropertyFormOptions } from "@/modules/properties/types";

const UNSET = "none";

export interface PropertyFormInitial {
  id: string;
  title: string;
  propertyType: string;
  operation: string;
  status: string;
  price: number;
  zone: string | null;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  builtM2: number | null;
  lotSizeM2: number | null;
  amenities: string[];
  commissionPct: number | null;
  description: string | null;
}

interface Props {
  options: PropertyFormOptions;
  defaultCurrency: string;
  initial?: PropertyFormInitial;
  trigger?: React.ReactNode;
}

function num(formData: FormData, key: string): number | undefined {
  const value = formData.get(key);
  return value ? Number(value) : undefined;
}

export function PropertyFormDialog({ options, defaultCurrency, initial, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isEdit = Boolean(initial);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const amenities = String(formData.get("amenities") ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    const assignedMembershipId = formData.get("assignedMembershipId") as string;

    const input = {
      title: formData.get("title"),
      propertyType: formData.get("propertyType"),
      operation: formData.get("operation"),
      status: formData.get("status"),
      price: Number(formData.get("price")),
      currency: defaultCurrency,
      description: formData.get("description"),
      zone: formData.get("zone"),
      city: formData.get("city"),
      state: formData.get("state"),
      bedrooms: num(formData, "bedrooms"),
      bathrooms: num(formData, "bathrooms"),
      parking: num(formData, "parking"),
      builtM2: num(formData, "builtM2"),
      lotSizeM2: num(formData, "lotSizeM2"),
      amenities,
      commissionPct: num(formData, "commissionPct"),
      assignedMembershipId: assignedMembershipId === UNSET ? undefined : assignedMembershipId,
    };

    const result = isEdit ? await updateProperty(initial!.id, input) : await createProperty(input);
    setPending(false);
    if (result.ok) {
      setOpen(false);
      toast.success(isEdit ? "Propiedad actualizada." : "Propiedad creada.");
      router.refresh();
      if (!isEdit && "id" in result.data) router.push(`/properties/${result.data.id}`);
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
            Nueva propiedad
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar propiedad" : "Nueva propiedad"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Actualiza los datos de la propiedad." : "Agrega una propiedad a tu inventario."}
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <Field label="Título" htmlFor="title">
            <Input id="title" name="title" required defaultValue={initial?.title} placeholder="Ej. Casa frente al mar en Ensenada" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Tipo" htmlFor="propertyType">
              <Select name="propertyType" defaultValue={initial?.propertyType ?? "house"}>
                <SelectTrigger id="propertyType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Operación" htmlFor="operation">
              <Select name="operation" defaultValue={initial?.operation ?? "sale"}>
                <SelectTrigger id="operation" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OPERATION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estado" htmlFor="status">
              <Select name="status" defaultValue={initial?.status ?? "available"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Precio (${defaultCurrency})`} htmlFor="price">
              <Input id="price" name="price" type="number" min="0" required defaultValue={initial?.price} />
            </Field>
            <Field label="Comisión %" htmlFor="commissionPct">
              <Input id="commissionPct" name="commissionPct" type="number" min="0" max="100" step="0.1" defaultValue={initial?.commissionPct ?? ""} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Zona" htmlFor="zone">
              <Input id="zone" name="zone" defaultValue={initial?.zone ?? ""} />
            </Field>
            <Field label="Ciudad" htmlFor="city">
              <Input id="city" name="city" defaultValue={initial?.city ?? ""} />
            </Field>
            <Field label="Estado" htmlFor="state">
              <Input id="state" name="state" defaultValue={initial?.state ?? ""} />
            </Field>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <Field label="Rec." htmlFor="bedrooms">
              <Input id="bedrooms" name="bedrooms" type="number" min="0" defaultValue={initial?.bedrooms ?? ""} />
            </Field>
            <Field label="Baños" htmlFor="bathrooms">
              <Input id="bathrooms" name="bathrooms" type="number" min="0" step="0.5" defaultValue={initial?.bathrooms ?? ""} />
            </Field>
            <Field label="Estac." htmlFor="parking">
              <Input id="parking" name="parking" type="number" min="0" defaultValue={initial?.parking ?? ""} />
            </Field>
            <Field label="m² const." htmlFor="builtM2">
              <Input id="builtM2" name="builtM2" type="number" min="0" defaultValue={initial?.builtM2 ?? ""} />
            </Field>
            <Field label="m² terreno" htmlFor="lotSizeM2">
              <Input id="lotSizeM2" name="lotSizeM2" type="number" min="0" defaultValue={initial?.lotSizeM2 ?? ""} />
            </Field>
          </div>
          <Field label="Amenidades (separadas por coma)" htmlFor="amenities">
            <Input id="amenities" name="amenities" defaultValue={initial?.amenities.join(", ")} placeholder="Alberca, Gym, Seguridad 24/7" />
          </Field>
          <Field label="Descripción" htmlFor="description">
            <Textarea id="description" name="description" rows={3} defaultValue={initial?.description ?? ""} />
          </Field>
          <Field label="Agente responsable" htmlFor="assignedMembershipId">
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
              {isEdit ? "Guardar cambios" : "Crear propiedad"}
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
