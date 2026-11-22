"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, Ban, Bot, Clock, Flame, Loader2, Megaphone, RefreshCw, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  QUALIFICATION_QUESTIONS,
  TEMPERATURE_LABELS,
  leadTemperature,
  type LeadTemperature,
} from "@/lib/leadops/qualification";
import { cn } from "@/lib/utils";
import { extractFactsWithAi, setContactFact, setLeadControl, updateLeadManagement } from "@/modules/leadops/server/actions";
import type { LeadState } from "@/modules/inbox/types";

const SOURCE_LABELS: Record<string, string> = {
  ai: "IA",
  advisor: "Asesor",
  form: "Formulario",
  import: "Importación",
  system: "Detectado en chat",
};

const ORIGIN_LABELS: Record<string, string> = {
  ctwa_ad: "Anuncio de WhatsApp",
  organic_whatsapp: "WhatsApp orgánico",
  messenger_ad: "Anuncio Messenger",
  instagram_ad: "Anuncio Instagram",
  organic_messenger: "Messenger orgánico",
  organic_instagram: "Instagram orgánico",
  web_form: "Formulario web",
  import: "Importación",
  manual: "Manual",
};

const BOT_REASON_LABELS: Record<string, string> = {
  human_reply: "respondió un asesor",
  human_reply_phone: "respondió desde el teléfono",
  human_reply_meta: "respondió desde Meta Business Suite",
  manual: "apagada a mano",
};

export const TEMPERATURE_TONE: Record<LeadTemperature, string> = {
  hot: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  warm: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  cold: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  unknown: "bg-muted text-muted-foreground",
};

function windowLabel(closesAt: string | null): string {
  if (!closesAt) return "Cerrada · solo plantillas";
  const ms = new Date(closesAt).getTime() - Date.now();
  if (ms <= 0) return "Cerrada · solo plantillas";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `Abierta · cierra en ${h} h ${m} min` : `Abierta · cierra en ${m} min`;
}

/**
 * Lead management for one contact, next to the chat: the five pre-qualification
 * answers ("casas"), human stars, temperature, and the four independent controls
 * (BOT, REACT, archive, block). Facts, stars and stage stay separate on purpose.
 */
export function LeadPanel({ lead, persist }: { lead: LeadState; persist: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [facts, setFacts] = React.useState(() => new Map(lead.facts.map((f) => [f.key, f])));
  const [stars, setStars] = React.useState(lead.stars);
  const [syncKey, setSyncKey] = React.useState(JSON.stringify(lead));

  const currentKey = JSON.stringify(lead);
  if (syncKey !== currentKey) {
    setSyncKey(currentKey);
    setFacts(new Map(lead.facts.map((f) => [f.key, f])));
    setStars(lead.stars);
  }

  const flat = Object.fromEntries([...facts.values()].map((f) => [f.key, f.values.join(",")]));
  const temperature = leadTemperature(flat);
  const answered = QUALIFICATION_QUESTIONS.filter((q) => facts.get(q.key)?.values.length).length;

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success?: string) {
    if (!persist) {
      toast.info("Esta vista es de solo lectura.");
      return;
    }
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        if (success) toast.success(success);
        router.refresh();
      } else {
        toast.error(result.error ?? "Ocurrió un error.");
        setFacts(new Map(lead.facts.map((f) => [f.key, f])));
        setStars(lead.stars);
      }
    });
  }

  function toggleOption(key: string, value: string, max: number) {
    const current = facts.get(key)?.values ?? [];
    let next: string[];
    if (current.includes(value)) next = current.filter((v) => v !== value);
    else if (max === 1) next = [value];
    else next = [...current, value].slice(-max);
    setFacts((prev) => {
      const copy = new Map(prev);
      if (next.length) copy.set(key, { key, values: next, source: "advisor" });
      else copy.delete(key);
      return copy;
    });
    run(() => setContactFact({ contactId: lead.contactId, key, values: next }));
  }

  const [reading, setReading] = React.useState(false);
  async function readChat() {
    if (!persist) {
      toast.info("Esta vista es de solo lectura.");
      return;
    }
    setReading(true);
    const result = await extractFactsWithAi({ contactId: lead.contactId });
    setReading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.data.changed
        ? `${result.data.changed} respuesta${result.data.changed > 1 ? "s" : ""} capturada${result.data.changed > 1 ? "s" : ""}${result.data.mocked ? " (sin modelo IA: palabras clave)" : ""}.`
        : "No hay respuestas nuevas en el chat.",
    );
    router.refresh();
  }

  function rate(value: number) {
    const next = stars === value ? null : value;
    setStars(next);
    run(() => updateLeadManagement({ contactId: lead.contactId, stars: next }), "Valoración guardada.");
  }

  function control(name: "bot" | "react" | "archive" | "block", enabled: boolean, label: string) {
    run(() => setLeadControl({ contactId: lead.contactId, control: name, enabled }), label);
  }

  return (
    <div className={cn("flex h-full flex-col gap-4 overflow-y-auto p-4 text-sm", pending && "opacity-80")}>
      {/* Header: temperature + origin */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Lead</p>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", TEMPERATURE_TONE[temperature])}>
            <Flame className="size-3" />
            {TEMPERATURE_LABELS[temperature]}
          </span>
        </div>
        {lead.origin ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Megaphone className="size-3.5 shrink-0" />
            <span className="truncate">
              {ORIGIN_LABELS[lead.origin] ?? lead.origin}
              {lead.adName ? ` · ${lead.adName}` : ""}
            </span>
          </p>
        ) : null}
        <p suppressHydrationWarning className={cn("flex items-center gap-1.5 text-xs", lead.windowOpen ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
          <Clock className="size-3.5 shrink-0" />
          Ventana 24 h: {windowLabel(lead.windowClosesAt)}
        </p>
        <div className="flex flex-wrap gap-1">
          {lead.attention ? <Badge variant="destructive">Atención</Badge> : null}
          {lead.blocked ? <Badge variant="destructive">Bloqueado</Badge> : null}
          {lead.archived ? <Badge variant="secondary">Archivado</Badge> : null}
          {lead.outcome !== "open" ? <Badge variant="outline">{lead.outcome === "won" ? "Cerrado ganado" : "Perdido"}</Badge> : null}
          {lead.subStage ? <Badge variant="outline">{lead.subStage}</Badge> : null}
        </div>
      </div>

      {/* Stars (human rating, separate from answers) */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">Valoración del asesor</p>
        <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Estrellas">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={stars === n}
              aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
              onClick={() => rate(n)}
              className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Star className={cn("size-5", (stars ?? 0) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
            </button>
          ))}
        </div>
      </div>

      {/* Five pre-qualification answers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-foreground">
            Precalificación <span className="font-normal text-muted-foreground tabular-nums">· {answered} de 5</span>
          </p>
          <button
            type="button"
            onClick={readChat}
            disabled={reading}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-violet-600 transition-colors hover:bg-violet-500/10 disabled:opacity-60 dark:text-violet-400"
          >
            {reading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            Leer chat con IA
          </button>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(answered / 5) * 100}%` }} />
        </div>
        {QUALIFICATION_QUESTIONS.map((q) => {
          const fact = facts.get(q.key);
          return (
            <div key={q.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs text-muted-foreground">{q.question}</p>
                {fact ? <span className="shrink-0 text-[10px] text-muted-foreground/80">{SOURCE_LABELS[fact.source] ?? fact.source}</span> : null}
              </div>
              <div className="flex flex-wrap gap-1">
                {q.options.map((o) => {
                  const active = fact?.values.includes(o.value) ?? false;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleOption(q.key, o.value, q.max)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Independent controls */}
      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs font-medium text-foreground">Controles</p>
        <ControlRow
          icon={Bot}
          label="BOT · IA de atención"
          hint={!lead.botEnabled && lead.botChangedReason ? `Apagada: ${BOT_REASON_LABELS[lead.botChangedReason] ?? lead.botChangedReason}` : "Responde y captura datos"}
          checked={lead.botEnabled}
          onChange={(v) => control("bot", v, v ? "IA activada." : "IA apagada.")}
        />
        <ControlRow
          icon={RefreshCw}
          label="REACT · Reactivadores"
          hint="Seguimientos automáticos si deja de responder"
          checked={lead.reactEnabled}
          onChange={(v) => control("react", v, v ? "Reactivadores activados." : "Reactivadores apagados.")}
        />
        <ControlRow
          icon={Archive}
          label="Archivar"
          hint="Solo lo oculta de la bandeja"
          checked={lead.archived}
          onChange={(v) => control("archive", v, v ? "Lead archivado." : "Lead restaurado.")}
        />
        <ControlRow
          icon={Ban}
          label="Bloquear"
          hint="No se le envía nada, ni automático"
          checked={lead.blocked}
          danger
          onChange={(v) => control("block", v, v ? "Contacto bloqueado." : "Contacto desbloqueado.")}
        />
      </div>
    </div>
  );
}

function ControlRow({
  icon: Icon,
  label,
  hint,
  checked,
  danger,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  checked: boolean;
  danger?: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = React.useId();
  return (
    <div className="flex items-center gap-3">
      <Icon className={cn("size-4 shrink-0", danger && checked ? "text-destructive" : "text-muted-foreground")} />
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-xs font-medium text-foreground">{label}</span>
        <span className="line-clamp-2 block text-[11px] text-muted-foreground">{hint}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
