"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Building2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ActionResult } from "@/lib/result";
import { signUpAction } from "@/modules/auth/server/actions";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState<ActionResult<void> | null, FormData>(signUpAction, null);
  const errorMessage = state && !state.ok ? state.error : null;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center space-y-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Building2 className="size-5 text-primary" />
        </div>
        <CardTitle>Crea tu organización</CardTitle>
        <CardDescription>Empieza gratis. Podrás invitar a tu equipo después.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Tu nombre</Label>
            <Input id="name" name="name" autoComplete="name" placeholder="Frank Morishita" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="orgName">Nombre de tu inmobiliaria</Label>
            <Input id="orgName" name="orgName" placeholder="Morishita Realty Group" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="tu@inmobiliaria.mx" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>
          {errorMessage ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Crear cuenta
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
