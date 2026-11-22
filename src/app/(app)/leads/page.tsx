import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Bot, CheckCircle2, Circle, Megaphone, MessageCircle, Star } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES } from "@/config/modules";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { QUALIFICATION_QUESTIONS, TEMPERATURE_LABELS, factValueLabel, type LeadTemperature } from "@/lib/leadops/qualification";
import { formatPhone } from "@/lib/leadops/rules";
import { cn } from "@/lib/utils";
import { getLeadOpsData, type LeadRow } from "@/modules/leadops/server/queries";

export const metadata: Metadata = { title: MODULES.leads.label };

const ORIGIN_LABELS: Record<string, string> = {
  ctwa_ad: "Anuncio WhatsApp",
  organic_whatsapp: "WhatsApp orgánico",
  web_form: "Formulario web",
  import: "Importación",
  manual: "Manual",
  desconocido: "Desconocido",
};

const TEMPERATURE_TONE: Record<LeadTemperature, string> = {
  hot: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  warm: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  cold: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  unknown: "bg-muted text-muted-foreground",
};

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "attention", label: "Requieren humano" },
  { key: "hot", label: "Calientes" },
  { key: "qualified", label: "Calificados" },
  { key: "window", label: "24 h abierta" },
  { key: "unassigned", label: "Sin asesor" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

function applyFilter(leads: LeadRow[], f: FilterKey): LeadRow[] {
  switch (f) {
    case "attention":
      return leads.filter((l) => l.attention && !l.blocked);
    case "hot":
      return leads.filter((l) => l.temperature === "hot");
    case "qualified":
      return leads.filter((l) => l.qualified);
    case "window":
      return leads.filter((l) => l.windowOpen);
    case "unassigned":
      return leads.filter((l) => !l.assignee);
    default:
      return leads;
  }
}

function money(value: number | null, currency: string, locale: string) {
  if (value === null) return "—";
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function Houses({ facts }: { facts: Record<string, string> }) {
  const count = QUALIFICATION_QUESTIONS.filter((q) => facts[q.key]).length;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5" aria-label={`${count} de 5 respuestas`}>
        {QUALIFICATION_QUESTIONS.map((q) => (
          <span
            key={q.key}
            title={`${q.label}: ${facts[q.key] ? factValueLabel(q.key, facts[q.key]) : "sin dato"}`}
            className={cn("h-3 w-2 rounded-[3px]", facts[q.key] ? "bg-emerald-500" : "bg-muted-foreground/20")}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{count}/5</span>
    </div>
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await getTenantContext();
  if (!hasPermission(ctx, "contacts.view")) {
    return <p className="text-sm text-muted-foreground">No tienes permiso para ver leads.</p>;
  }
  const params = await searchParams;
  const rawFilter = typeof params.f === "string" ? params.f : "all";
  const filter: FilterKey = FILTERS.some((f) => f.key === rawFilter) ? (rawFilter as FilterKey) : "all";

  const data = await getLeadOpsData(ctx);
  const locale = ctx.organization.defaultLocale;
  const demo = isDemoMode();
  const setup = [
    { label: "WhatsApp (recibir leads de los anuncios)", ok: data.configured.webhook },
    { label: "Formulario web de Punta Pacífico", ok: data.configured.webForm },
    { label: "Conversions API (calidad del lead → Meta)", ok: data.configured.capi },
    { label: "Gasto por anuncio (costo por lead)", ok: data.configured.insights },
  ];
  const pending = setup.filter((s) => !s.ok).length;
  const t = data.totals;
  const pct = (n: number) => (t.leads ? `${Math.round((n / t.leads) * 100)}%` : "—");

  const stats = [
    { label: "Leads (30 días)", value: String(t.leads), hint: `${t.fromAds} desde anuncios` },
    { label: "Calificados", value: String(t.qualified), hint: `${pct(t.qualified)} del total` },
    { label: "Calientes", value: String(t.hot), hint: "Compran ≤ 3 meses y piden cita" },
    { label: "Requieren humano", value: String(t.attention), hint: "Atención pendiente", alert: t.attention > 0 },
    { label: "Costo por lead", value: money(t.spend !== null && t.fromAds ? t.spend / t.fromAds : null, t.currency, locale), hint: `Gasto ${money(t.spend, t.currency, locale)}` },
    { label: "Costo por calificado", value: money(t.spend !== null && t.qualified ? t.spend / t.qualified : null, t.currency, locale), hint: `${t.unassigned} sin asesor` },
  ];

  const rows = applyFilter(data.leads, filter);
  const maxFunnel = Math.max(1, ...data.funnel);

  return (
    <div className="space-y-6">
      <PageHeader
        title={MODULES.leads.label}
        description="Leads de tus anuncios de WhatsApp y del formulario web: precalificación, reparto y retroalimentación a Meta."
        actions={demo ? <Badge variant="secondary">Datos demo</Badge> : null}
      />

      {pending > 0 ? (
        <details className="group rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-foreground">
            <AlertCircle className="size-4 shrink-0 text-amber-500" />
            Conexiones pendientes: {pending} de {setup.length}
            <span className="ml-auto text-xs font-normal text-muted-foreground group-open:hidden">Ver detalle</span>
          </summary>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {setup.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-muted-foreground">
                {s.ok ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4" />}
                <span className={cn(s.ok && "text-foreground")}>{s.label}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="gap-1 py-4">
            <CardContent className="space-y-0.5 px-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("text-2xl font-semibold tabular-nums", s.alert && "text-destructive")}>{s.value}</p>
              <p className="truncate text-[11px] text-muted-foreground">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><Megaphone className="size-4" />Rendimiento por anuncio</CardTitle>
            <CardDescription>Atribución por primer clic: cada lead cuenta para un solo anuncio.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.ads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay leads atribuidos a anuncios.</p>
            ) : (
              <div className="-mx-2 overflow-x-auto px-2">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Anuncio</th>
                      <th className="py-2 pr-3 text-right font-medium">Gasto</th>
                      <th className="py-2 pr-3 text-right font-medium">Leads</th>
                      <th className="py-2 pr-3 text-right font-medium">Costo/lead</th>
                      <th className="py-2 pr-3 text-right font-medium">Calif.</th>
                      <th className="py-2 pr-3 text-right font-medium">Costo/calif.</th>
                      <th className="py-2 pr-3 text-right font-medium">Calientes</th>
                      <th className="py-2 text-right font-medium">Piden cita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.ads.map((a) => (
                      <tr key={a.adId}>
                        <td className="max-w-48 truncate py-2 pr-3 font-medium">{a.adName}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{money(a.spend, a.currency, locale)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{a.leads}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{money(a.costPerLead, a.currency, locale)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{a.qualified}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{money(a.costPerQualified, a.currency, locale)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{a.hot}</td>
                        <td className="py-2 text-right tabular-nums">{a.meetings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Señales enviadas a Meta (Conversions API): {data.capi.sent} enviadas · {data.capi.skipped} sin clic de anuncio · {data.capi.failed} con error
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avance de precalificación</CardTitle>
            <CardDescription>Cada lead cuenta una vez, en la última pregunta que respondió.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.funnel.map((count, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{i === 0 ? "Sin respuestas" : `Hasta ${QUALIFICATION_QUESTIONS[i - 1]!.label.toLowerCase()}`}</span>
                  <span className="tabular-nums">{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(count / maxFunnel) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Qué buscan tus leads</CardTitle>
          <CardDescription>Respuestas a las 5 preguntas de precalificación (formulario, chat o asesor).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {data.answers.map((a) => {
            const max = Math.max(1, ...a.options.map((o) => o.count));
            return (
              <div key={a.key} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-medium text-foreground">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">{a.answered} resp.</p>
                </div>
                {a.options.map((o) => (
                  <div key={o.value} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">{o.label}</span>
                      <span className="tabular-nums">{o.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${(o.count / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <nav className="-mx-1 flex gap-1 overflow-x-auto px-1" aria-label="Filtrar leads">
          {FILTERS.map((f) => {
            const count = applyFilter(data.leads, f.key).length;
            const active = filter === f.key;
            return (
              <Link
                key={f.key}
                href={f.key === "all" ? "/leads" : `/leads?f=${f.key}`}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {f.label}
                <span className={cn("tabular-nums", active ? "text-primary-foreground/80" : "text-muted-foreground/80")}>{count}</span>
              </Link>
            );
          })}
        </nav>

        {data.leads.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Sin leads todavía"
            description="Cuando WhatsApp y el formulario web estén conectados, cada lead aparecerá aquí con su anuncio de origen y sus respuestas."
          />
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No hay leads con este filtro.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Lead</th>
                  <th className="px-4 py-2 font-medium">Origen</th>
                  <th className="px-4 py-2 font-medium">Temperatura</th>
                  <th className="px-4 py-2 font-medium">Respuestas</th>
                  <th className="px-4 py-2 font-medium">Valoración</th>
                  <th className="px-4 py-2 font-medium">Asesor</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((l) => {
                  const href = demo ? null : l.conversationId ? `/inbox?c=${l.conversationId}` : `/contacts/${l.id}`;
                  return (
                    <tr key={l.id} className={cn("transition-colors hover:bg-muted/40", l.archived && "opacity-60")}>
                      <td className="px-4 py-2.5">
                        {href ? (
                          <Link href={href} className="font-medium hover:underline">{l.name}</Link>
                        ) : (
                          <span className="font-medium">{l.name}</span>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatPhone(l.phone)}
                          {l.subStage ? ` · ${l.subStage}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-xs">{ORIGIN_LABELS[l.origin] ?? l.origin}</p>
                        {l.adName ? <p className="max-w-40 truncate text-xs text-muted-foreground">{l.adName}</p> : null}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TEMPERATURE_TONE[l.temperature])}>
                          {TEMPERATURE_LABELS[l.temperature]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5"><Houses facts={l.facts} /></td>
                      <td className="px-4 py-2.5">
                        {l.stars === null ? <span className="text-xs text-muted-foreground">—</span> : (
                          <span className="inline-flex items-center gap-0.5 text-xs tabular-nums">{l.stars}<Star className="size-3 fill-amber-400 text-amber-400" /></span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs">{l.assignee ?? <span className="text-amber-600 dark:text-amber-400">Sin asignar</span>}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {l.outcome !== "open" ? <Badge variant="outline">{l.outcome === "won" ? "Ganado" : "Perdido"}</Badge> : null}
                          {l.attention && !l.blocked ? <Badge variant="destructive">Atención</Badge> : null}
                          {l.blocked ? <Badge variant="destructive">Bloqueado</Badge> : null}
                          <Badge variant="outline" className="gap-1"><Bot className="size-3" />{l.botEnabled ? "IA" : "Humano"}</Badge>
                          {l.origin !== "web_form" || l.lastInboundAt ? (
                            <Badge variant="outline" className={cn(l.windowOpen ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                              {l.windowOpen ? "24 h abierta" : "24 h cerrada"}
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
