"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { sendTemplateMessage } from "@/modules/inbox/server/actions";

export interface TemplateOption {
  name: string;
  language: string;
  category: string;
  body: string;
  params: number;
}

const CATEGORY_LABELS: Record<string, string> = { MARKETING: "Marketing", UTILITY: "Utilidad", AUTHENTICATION: "Autenticación" };

function render(body: string, params: string[]): string {
  return body.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n: string) => params[Number(n) - 1] || `{{${n}}}`);
}

/**
 * Approved Meta template sender — the only way to write once the 24h window is
 * closed. Marketing templates are billed by Meta per delivered message.
 */
export function TemplatePicker({
  conversationId,
  contactFirstName,
  templates,
  live,
  persist,
  variant = "outline",
  label = "Plantilla",
}: {
  conversationId: string;
  contactFirstName: string;
  templates: TemplateOption[];
  live: boolean;
  persist: boolean;
  variant?: "outline" | "default";
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<TemplateOption | null>(templates[0] ?? null);
  const [params, setParams] = React.useState<string[]>([]);
  const [sending, setSending] = React.useState(false);

  function choose(t: TemplateOption) {
    setSelected(t);
    setParams(Array.from({ length: t.params }, (_, i) => (i === 0 ? contactFirstName : "")));
  }

  async function onSend() {
    if (!selected) return;
    if (!persist) {
      toast.info("Modo demo: la plantilla no se envía.");
      setOpen(false);
      return;
    }
    setSending(true);
    const result = await sendTemplateMessage({ conversationId, name: selected.name, language: selected.language, params });
    setSending(false);
    if (result.ok) {
      toast.success("Plantilla enviada.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const complete = selected ? params.length === selected.params && params.every((p) => p.trim()) : false;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next && selected) choose(selected);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant} size="xs">
          <FileText />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar plantilla aprobada</DialogTitle>
          <DialogDescription>
            Fuera de la ventana de 24 h solo se permiten plantillas aprobadas por Meta.
            {live ? "" : " (WhatsApp sin conectar: plantillas de ejemplo.)"}
          </DialogDescription>
        </DialogHeader>

        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay plantillas aprobadas. Créalas en el Administrador de WhatsApp de Meta y vuelve a intentar.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
              {templates.map((t) => (
                <button
                  key={`${t.name}:${t.language}`}
                  type="button"
                  onClick={() => choose(t)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    selected?.name === t.name && selected.language === t.language
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <span className="truncate font-medium">{t.name}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    <Badge variant="outline">{CATEGORY_LABELS[t.category] ?? t.category}</Badge>
                    <span className="text-xs text-muted-foreground">{t.language}</span>
                  </span>
                </button>
              ))}
            </div>

            {selected && selected.params > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: selected.params }, (_, i) => (
                  <div key={i} className="space-y-1">
                    <Label htmlFor={`tpl-p${i}`} className="text-xs">{`Variable {{${i + 1}}}`}</Label>
                    <Input
                      id={`tpl-p${i}`}
                      value={params[i] ?? ""}
                      onChange={(e) => setParams((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {selected ? (
              <div className="rounded-xl bg-emerald-500/10 p-3 text-sm whitespace-pre-wrap text-foreground">
                {render(selected.body, params)}
              </div>
            ) : null}
            {selected?.category === "MARKETING" ? (
              <p className="text-xs text-muted-foreground">Las plantillas de marketing tienen costo por mensaje entregado en Meta.</p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button onClick={onSend} disabled={!selected || !complete || sending}>
            {sending ? <Loader2 className="animate-spin" /> : <Send />}
            Enviar plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
