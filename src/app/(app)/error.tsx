"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
        <AlertTriangle className="size-5 text-amber-500" />
      </div>
      <h2 className="text-base font-semibold text-foreground">Algo salió mal</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Ocurrió un error inesperado. Puedes intentar de nuevo; si persiste, contacta a soporte.
      </p>
      <Button onClick={reset} className="mt-5">
        Reintentar
      </Button>
    </div>
  );
}
