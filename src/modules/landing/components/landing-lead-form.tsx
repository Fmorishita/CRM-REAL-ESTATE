"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitLandingLead } from "@/modules/landing/server/actions";

interface Props {
  organizationId: string;
  propertyId?: string;
  accentColor: string;
  title?: string;
  defaultMessage?: string;
}

export function LandingLeadForm({ organizationId, propertyId, accentColor, title, defaultMessage }: Props) {
  const searchParams = useSearchParams();
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const utm = {
      source: searchParams.get("utm_source") ?? undefined,
      medium: searchParams.get("utm_medium") ?? undefined,
      campaign: searchParams.get("utm_campaign") ?? undefined,
      term: searchParams.get("utm_term") ?? undefined,
      content: searchParams.get("utm_content") ?? undefined,
    };

    const result = await submitLandingLead({
      organizationId,
      propertyId,
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      message: formData.get("message"),
      utm,
    });
    setPending(false);
    if (result.ok) setDone(true);
    else setError(result.error);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="size-10 text-emerald-500" />
        <h3 className="text-lg font-semibold text-foreground">¡Gracias por tu interés!</h3>
        <p className="text-sm text-muted-foreground">
          Un asesor se pondrá en contacto contigo muy pronto.
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-3 rounded-xl border border-border bg-card p-5">
      {title ? <h3 className="text-base font-semibold text-foreground">{title}</h3> : null}
      <div className="space-y-1.5">
        <Label htmlFor="lead-name" className="text-xs text-muted-foreground">
          Nombre completo
        </Label>
        <Input id="lead-name" name="name" required placeholder="Tu nombre" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lead-phone" className="text-xs text-muted-foreground">
          Teléfono / WhatsApp
        </Label>
        <Input id="lead-phone" name="phone" required placeholder="+52 ..." />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lead-email" className="text-xs text-muted-foreground">
          Email (opcional)
        </Label>
        <Input id="lead-email" name="email" type="email" placeholder="tu@email.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lead-message" className="text-xs text-muted-foreground">
          Mensaje
        </Label>
        <Textarea id="lead-message" name="message" rows={3} defaultValue={defaultMessage} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="submit"
        disabled={pending}
        className="w-full text-white"
        style={{ backgroundColor: accentColor }}
      >
        {pending ? <Loader2 className="animate-spin" /> : null}
        Solicitar información
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        Al enviar aceptas ser contactado por un asesor.
      </p>
    </form>
  );
}
