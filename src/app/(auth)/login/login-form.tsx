"use client";

import { useActionState } from "react";
import { Building2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fail, type ActionResult } from "@/lib/result";
import { signInAction } from "@/modules/auth/server/actions";

export function LoginForm({ initialError }: { initialError: string | null }) {
  const [state, formAction, pending] = useActionState<ActionResult<void> | null, FormData>(
    signInAction,
    initialError ? fail(initialError) : null,
  );
  const errorMessage = state && !state.ok ? state.error : null;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center space-y-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Building2 className="size-5 text-primary" />
        </div>
        <CardTitle>Realtor Pro CRM</CardTitle>
        <CardDescription>Inicia sesión para entrar a tu organización.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@inmobiliaria.mx"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {errorMessage ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Iniciar sesión
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
