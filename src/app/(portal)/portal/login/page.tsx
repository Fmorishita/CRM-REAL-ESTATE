import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoMode } from "@/lib/db";
import { getPortalSession } from "@/lib/portal/session";
import { PortalLoginForm } from "@/modules/portal/components/portal-login-form";

export const metadata: Metadata = { title: "Acceso" };
export const dynamic = "force-dynamic";

export default async function PortalLoginPage() {
  const session = await getPortalSession();
  if (session) redirect("/portal");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-6" />
          </span>
          <h1 className="text-lg font-semibold text-foreground">Portal de clientes</h1>
          <p className="text-sm text-muted-foreground">Accede para ver tu proceso, propiedades y visitas.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Iniciar sesión</CardTitle>
            <CardDescription>Ingresa el email con el que te registró tu asesor.</CardDescription>
          </CardHeader>
          <CardContent>
            <PortalLoginForm />
            {isDemoMode() ? (
              <p className="mt-4 rounded-lg bg-muted/50 p-2 text-center text-[11px] text-muted-foreground">
                Demo: prueba con <span className="font-medium text-foreground">roberto.gomez@gmail.com</span> (comprador),{" "}
                <span className="font-medium text-foreground">carmen.ruiz@gmail.com</span> (vendedor) o{" "}
                <span className="font-medium text-foreground">eduardo.v@empresa.mx</span> (inversionista).
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
