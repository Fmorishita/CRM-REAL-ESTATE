"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyMessageButton({ message, label = "Copiar mensaje" }: { message: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Mensaje copiado al portapapeles.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el mensaje.");
    }
  }

  return (
    <Button variant="outline" size="xs" onClick={onCopy}>
      {copied ? <Check /> : <Copy />}
      {label}
    </Button>
  );
}
