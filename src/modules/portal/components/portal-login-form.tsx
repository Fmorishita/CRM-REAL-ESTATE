"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { portalLogin } from "@/modules/portal/server/auth";

export function PortalLoginForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await portalLogin({ email: formData.get("email") });
    setPending(false);
    if (result.ok) {
      router.push("/portal");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="portal-email" className="text-xs text-muted-foreground">
          Tu email
        </Label>
        <Input id="portal-email" name="email" type="email" required placeholder="tu@email.com" autoComplete="email" />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Entrar al portal
      </Button>
    </form>
  );
}
