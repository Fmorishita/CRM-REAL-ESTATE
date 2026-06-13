import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Building2, Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyMessageButton } from "@/modules/matching/components/copy-message-button";
import { MatchScore } from "@/modules/matching/components/match-score";
import type { PropertyMatch } from "@/modules/matching/types";

export function PropertyMatchList({ matches }: { matches: PropertyMatch[] }) {
  if (matches.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No hay propiedades para recomendar. Agrega preferencias al contacto o publica más propiedades.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {matches.map((m) => (
        <li key={m.propertyId} className="rounded-xl border border-border bg-card p-3">
          <div className="flex gap-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {m.coverUrl ? (
                <Image src={m.coverUrl} alt={m.title} fill sizes="64px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Building2 className="size-5 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/properties/${m.propertyId}`} className="truncate text-sm font-medium text-foreground hover:underline">
                    {m.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {m.priceLabel}
                    {m.locationLabel ? ` · ${m.locationLabel}` : ""}
                  </p>
                </div>
                <MatchScore score={m.score} tier={m.tier} />
              </div>
            </div>
          </div>

          {m.reasons.length > 0 ? (
            <ul className="mt-2 space-y-0.5">
              {m.reasons.slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="size-3 shrink-0 text-emerald-500" />
                  {r.text}
                </li>
              ))}
            </ul>
          ) : null}
          {m.objections.length > 0 ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3 shrink-0" />
              {m.objections[0]}
            </p>
          ) : null}

          <div className="mt-2.5 flex items-center gap-2">
            <CopyMessageButton message={m.suggestedMessage} label="Copiar recomendación" />
            <Button asChild variant="ghost" size="xs">
              <Link href={`/properties/${m.propertyId}`}>Ver propiedad</Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MatchSectionTitle() {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className="size-4 text-violet-500" />
      <span className="text-sm font-semibold text-foreground">Smart Matching</span>
      <Badge variant="secondary">IA</Badge>
    </div>
  );
}
