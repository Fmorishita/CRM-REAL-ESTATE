"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KeyRound, Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/result";
import { requestPasswordResetAction } from "@/modules/auth/server/actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ActionResult<{ sent: true }> | null, FormData>(
    requestPasswordResetAction,
    null,
  );
  const sent = state?.ok === true;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center space-y-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gold/15">
          {sent ? <MailCheck className="size-5 text-gold" /> : <KeyRound className="size-5 text-primary" />}
        </div>
        <CardTitle>{sent ? "Revisa tu correo" : "Recuperar contraseña"}</CardTitle>
        <CardDescription>
          {sent
            ? "Si el email tiene una cuenta, te enviamos un enlace para crear una nueva contraseña. Revisa también spam."
            : "Te enviaremos un enlace para crear una nueva contraseña."}
        </CardDescription>
      </CardHeader>
      {sent ? null : (
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            {state && !state.ok ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Enviar enlace
            </Button>
          </form>
        </CardContent>
      )}
      <CardFooter className="justify-center">
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
