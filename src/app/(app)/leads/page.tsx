import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Bot, Megaphone, MessageCircle, Star } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES } from "@/config/modules";
import { getTenantContext, hasPermission } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/db";
import { FACT_LABELS, DEFAULT_FACT_KEYS } from "@/lib/leadops/rules";
import { cn } from "@/lib/utils";
import { getLeadOpsData } from "@/modules/leadops/server/queries";

export const metadata: Metadata = { title: MODULES.leads.label };

const ORIGIN_LABELS: Record<string, string> = {
  ctwa_ad: "Anuncio CTWA",
  organic_whatsapp: "WhatsApp orgánico",
  web_form: "Formulario web",
  import: "Importación",
  manual: "Manual",
  desconocido: "Desconocido",
};

function money(value: number | null, currency: string, locale: string) {
  if (value === null) return "—";
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function Houses({ facts }: { facts: string[] }) {
  return (
    <div className="flex gap-1" aria-label={`${facts.length} de 5 datos capturados`}>
      {DEFAULT_FACT_KEYS.map((k) => (
        <span
          key={k}
          title={FACT_LABELS[k]}
          className={cn("size-2.5 rounded-sm", facts.includes(k) ? "bg-emerald-500" : "bg-muted-foreground/20")}
        />
      ))}
    </div>
  );
}

export default async function LeadsPage() {
  const ctx = await getTenantContext();
  if (!hasPermission(ctx, "contacts.view")) {
    return <p className="text-sm text-muted-foreground">No tienes permiso para ver leads.</p>;
  }
  const data = await getLeadOpsData(ctx);
  const locale = ctx.organization.defaultLocale;
  const pendingSetup = !data.configured.webhook || !data.configured.capi || !data.configured.insights;

  const stats = [
    { label: "Leads (30 días)", value: data.totals.leads },
    { label: "Desde anuncios", value: data.totals.fromAds },
    { label: "Ventana 24 h abierta", value: data.totals.windowOpen },
    { label: "Requieren atención", value: data.totals.attention },
    { label: "Sin asesor", value: data.totals.unassigned },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={MODULES.leads.label}
        description={MODULES.leads.description}
        actions={isDemoMode() ? <Badge variant="secondary">Modo demo</Badge> : null}
      />

      {pendingSetup ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Conexión con Meta pendiente</p>
            <ul className="text-muted-foreground">
              <li>Webhook WhatsApp (recepción de leads): {data.configured.webhook ? "listo" : "falta configurar"}</li>
              <li>Conversions API (retroalimentación a campañas): {data.configured.capi ? "listo" : "falta configurar"}</li>
              <li>Insights de anuncios (gasto y costo por lead): {data.configured.insights ? "listo" : "falta configurar"}</li>
            </ul>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="gap-1 py-4">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><Megaphone className="size-4" />Rendimiento por anuncio</CardTitle>
            <CardDescription>Atribución por primer clic: cada lead cuenta para un solo anuncio.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.ads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay leads atribuidos a anuncios.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Anuncio</th>
                      <th className="py-2 pr-3 text-right font-medium">Gasto</th>
                      <th className="py-2 pr-3 text-right font-medium">Leads</th>
                      <th className="py-2 pr-3 text-right font-medium">Costo/lead</th>
                      <th className="py-2 pr-3 text-right font-medium">Calificados</th>
                      <th className="py-2 pr-3 text-right font-medium">Costo/calif.</th>
                      <th className="py-2 text-right font-medium">Visitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.ads.map((a) => (
                      <tr key={a.adId}>
                        <td className="max-w-56 truncate py-2 pr-3">{a.adName}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{money(a.spend, a.currency, locale)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{a.leads}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{money(a.costPerLead, a.currency, locale)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{a.qualified}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{money(a.costPerQualified, a.currency, locale)}</td>
                        <td className="py-2 text-right tabular-nums">{a.visits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Embudo de datos capturados</CardTitle>
            <CardDescription>Cada lead cuenta una vez, en el dato más lejano alcanzado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.funnel.map((count, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{i === 0 ? "Sin datos" : `Hasta ${FACT_LABELS[DEFAULT_FACT_KEYS[i - 1]!]}`}</span>
                <span className="tabular-nums">{count}</span>
              </div>
            ))}
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              Eventos enviados a Meta (CAPI): {data.capi.sent} enviados · {data.capi.skipped} omitidos · {data.capi.failed} fallidos
            </div>
          </CardContent>
        </Card>
      </div>

      {data.leads.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Sin leads de WhatsApp todavía"
          description="Cuando el webhook de WhatsApp esté conectado, cada conversación nueva de tus anuncios aparecerá aquí con su anuncio de origen."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Lead</th>
                <th className="px-4 py-2 font-medium">Origen</th>
                <th className="px-4 py-2 font-medium">Datos</th>
                <th className="px-4 py-2 font-medium">Estrellas</th>
                <th className="px-4 py-2 font-medium">Etapa</th>
                <th className="px-4 py-2 font-medium">Asesor</th>
                <th className="px-4 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.leads.map((l) => (
                <tr key={l.id} className={cn(l.archived && "opacity-60")}>
                  <td className="px-4 py-2">
                    <Link href={`/contacts/${l.id}`} className="font-medium hover:underline">{l.name}</Link>
                    <p className="text-xs text-muted-foreground">
                      {l.whatsappName && l.whatsappName !== l.name ? `${l.whatsappName} · ` : ""}{l.phone ? `+${l.phone}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-2">
                    <p>{ORIGIN_LABELS[l.origin] ?? l.origin}</p>
                    {l.adName ? <p className="max-w-44 truncate text-xs text-muted-foreground">{l.adName}</p> : null}
                  </td>
                  <td className="px-4 py-2"><Houses facts={l.facts} /></td>
                  <td className="px-4 py-2">
                    {l.stars === null ? <span className="text-xs text-muted-foreground">—</span> : (
                      <span className="inline-flex items-center gap-0.5 tabular-nums">{l.stars}<Star className="size-3 fill-amber-400 text-amber-400" /></span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs">{l.outcome !== "open" ? (l.outcome === "won" ? "Cerrado" : "Perdido") : (l.subStage ?? "—")}</td>
                  <td className="px-4 py-2 text-xs">{l.assignee ?? <span className="text-amber-600">Sin asignar</span>}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {l.attention ? <Badge variant="destructive">Atención</Badge> : null}
                      {l.blocked ? <Badge variant="destructive">Bloqueado</Badge> : null}
                      <Badge variant="outline" className="gap-1"><Bot className="size-3" />{l.botEnabled ? "IA" : "Manual"}</Badge>
                      <Badge variant="outline">{l.windowOpen ? "24h abierta" : "24h cerrada"}</Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
