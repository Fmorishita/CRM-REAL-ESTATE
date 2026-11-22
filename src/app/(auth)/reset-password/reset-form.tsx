"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/modules/auth/server/actions";

/** Reads the recovery token from the URL fragment (never sent to the server in the URL). */
function readRecoveryToken(): { token: string | null; error: string | null } {
  if (typeof window === "undefined") return { token: null, error: null };
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const error = params.get("error_description");
  const token = params.get("type") === "recovery" ? params.get("access_token") : null;
  return { token, error };
}

type Recovery = { token: string | null; error: string | null };
let captured: Recovery | null = null;

/** Captures the token once, then removes it from the address bar and history. */
function recoverySnapshot(): Recovery {
  if (!captured) {
    captured = readRecoveryToken();
    if (captured.token) window.history.replaceState(null, "", window.location.pathname);
  }
  return captured;
}
const noopSubscribe = () => () => {};

export function ResetPasswordForm() {
  const router = useRouter();
  const recovery = React.useSyncExternalStore<Recovery | null>(noopSubscribe, recoverySnapshot, () => null);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recovery?.token) return;
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setPending(true);
    const result = await resetPasswordAction({ accessToken: recovery.token, password });
    setPending(false);
    if (result.ok) router.replace("/login?reset=1");
    else setError(result.error);
  }

  const invalid = recovery !== null && !recovery.token;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center space-y-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <KeyRound className="size-5 text-primary" />
        </div>
        <CardTitle>Nueva contraseña</CardTitle>
        <CardDescription>
          {invalid
            ? (recovery?.error ?? "Este enlace no es válido o ya expiró.")
            : "Elige una contraseña de al menos 8 caracteres."}
        </CardDescription>
      </CardHeader>
      {invalid || recovery === null ? null : (
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña nueva</Label>
              <Input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input id="confirm" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar contraseña
            </Button>
          </form>
        </CardContent>
      )}
      <CardFooter className="justify-center">
        <Link href={invalid ? "/forgot-password" : "/login"} className="text-sm font-medium text-primary hover:underline">
          {invalid ? "Pedir un enlace nuevo" : "Volver a iniciar sesión"}
        </Link>
      </CardFooter>
    </Card>
  );
}
