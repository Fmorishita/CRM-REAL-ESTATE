"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Rocket, X } from "lucide-react";

const STORAGE_KEY = "rp_onboarding_dismissed_v2";

const STEPS: { href: string; title: string; description: string }[] = [
  {
    href: "/settings/integrations",
    title: "Conecta WhatsApp, Instagram y Messenger",
    description: "Carga las credenciales de Meta para recibir los leads de tus anuncios.",
  },
  {
    href: "/settings",
    title: "Invita a tus asesores",
    description: "Agrégalos y márcalos para recibir leads en reparto automático.",
  },
  {
    href: "/leads",
    title: "Revisa tus leads",
    description: "Origen por anuncio, las 5 respuestas de precalificación y costo por lead.",
  },
  {
    href: "/properties",
    title: "Carga tu inventario",
    description: "Las casas de Punta Pacífico con precios y disponibilidad oficiales.",
  },
  {
    href: "/settings/ai",
    title: "Activa la IA",
    description: "Groq gratis para leer chats y sugerir respuestas.",
  },
];

// Client-only dismissal backed by localStorage, surfaced via useSyncExternalStore
// so there is no setState-in-effect and no hydration mismatch (the server
// snapshot renders nothing; the client reveals it after hydration if not hidden).
const listeners = new Set<() => void>();

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Ignore storage failures (private mode); the card just won't persist.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
}

export function OnboardingChecklist() {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Ocultar primeros pasos"
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <Rocket className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Primeros pasos</h2>
          <p className="text-xs text-muted-foreground">Un recorrido rápido por lo esencial de tu CRM.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, index) => (
          <Link
            key={step.href}
            href={step.href}
            className="group flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3 transition-colors hover:border-primary/40 hover:bg-background"
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[11px] font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                {step.title}
                <ArrowRight className="size-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{step.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
