import Image from "next/image";
import {
  Building2,
  CalendarClock,
  Check,
  FileText,
  Heart,
  MessageCircle,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PortalHeader } from "@/modules/portal/components/portal-chrome";
import type { PortalData, PortalPropertyCard } from "@/modules/portal/types";

function waLink(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

const TYPE_TITLE: Record<string, string> = {
  buyer: "Tu proceso de compra",
  seller: "Tu propiedad en venta",
  investor: "Tu portafolio de inversión",
};

export function PortalView({ data }: { data: PortalData }) {
  const accent = data.brand.accentColor;
  const wa = waLink(data.agent?.whatsapp ?? null);

  return (
    <div className="min-h-dvh bg-muted/20">
      <PortalHeader brand={data.brand} clientName={data.clientName} />

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{TYPE_TITLE[data.portalType]}</h1>
          <p className="text-sm text-muted-foreground">Sigue tu proceso y mantente en contacto con tu asesor.</p>
        </div>

        {data.steps.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado del proceso</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-wrap gap-2">
                {data.steps.map((step) => (
                  <li
                    key={step.label}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                      step.current
                        ? "border-transparent text-white"
                        : step.done
                          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : "border-border text-muted-foreground",
                    )}
                    style={step.current ? { backgroundColor: accent } : undefined}
                  >
                    {step.done ? <Check className="size-3" /> : null}
                    {step.label}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ) : null}

        {/* Seller: listed property + interest + feedback */}
        {data.portalType === "seller" ? (
          <>
            <Section icon={Building2} title="Tu propiedad">
              {data.listedProperties.length === 0 ? (
                <Empty text="Aún no hay propiedades listadas." />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.listedProperties.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              )}
            </Section>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="space-y-1 py-5 text-center">
                  <p className="text-2xl font-semibold text-foreground">{data.interestedLeadsCount}</p>
                  <p className="text-xs text-muted-foreground">Leads interesados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-1 py-5 text-center">
                  <p className="text-2xl font-semibold text-foreground">{data.visits.length}</p>
                  <p className="text-xs text-muted-foreground">Visitas agendadas</p>
                </CardContent>
              </Card>
            </div>
            {data.visitFeedback.length > 0 ? (
              <Section icon={MessageCircle} title="Feedback de visitas">
                <ul className="space-y-2">
                  {data.visitFeedback.map((f, i) => (
                    <li key={i} className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
                      {f}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </>
        ) : null}

        {/* Investor: ROI */}
        {data.portalType === "investor" && data.roi.length > 0 ? (
          <Section icon={TrendingUp} title="Proyección de inversión">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {data.roi.map((r) => (
                <Card key={r.label}>
                  <CardContent className="space-y-1 py-5 text-center">
                    <p className="text-xl font-semibold" style={{ color: accent }}>
                      {r.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>
        ) : null}

        {/* Recommended (buyer/investor) */}
        {data.recommended.length > 0 ? (
          <Section icon={Building2} title="Recomendadas para ti">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.recommended.slice(0, 4).map((m) => (
                <PropertyCard
                  key={m.propertyId}
                  property={{
                    id: m.propertyId,
                    title: m.title,
                    slug: m.slug,
                    priceLabel: m.priceLabel,
                    coverUrl: m.coverUrl,
                    locationLabel: m.locationLabel,
                    relationLabel: `${m.score}% match`,
                  }}
                />
              ))}
            </div>
          </Section>
        ) : null}

        {/* Favorites */}
        {data.favorites.length > 0 ? (
          <Section icon={Heart} title="Tus favoritas">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.favorites.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </Section>
        ) : null}

        {/* Visits */}
        <Section icon={CalendarClock} title="Tus visitas">
          {data.visits.length === 0 ? (
            <Empty text="No tienes visitas agendadas." />
          ) : (
            <ul className="space-y-2">
              {data.visits.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{v.propertyTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.dayLabel} · {v.timeLabel}
                    </p>
                  </div>
                  <Badge variant="outline">{v.statusLabel}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Documents placeholder */}
        <Section icon={FileText} title="Documentos">
          <Empty text="Aquí aparecerán tus documentos (contratos, comprobantes). Próximamente." />
        </Section>

        {/* Agent contact */}
        {data.agent ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tu asesor</CardTitle>
              <CardDescription>{data.agent.name}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: accent }}
                >
                  <MessageCircle className="size-4" />
                  Mensaje por WhatsApp
                </a>
              ) : null}
              {data.agent.email ? (
                <a
                  href={`mailto:${data.agent.email}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground"
                >
                  Email
                </a>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Building2; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4 text-muted-foreground" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function PropertyCard({ property }: { property: PortalPropertyCard }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[4/3] w-full bg-muted">
        {property.coverUrl ? (
          <Image src={property.coverUrl} alt={property.title} fill sizes="50vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="size-8 text-muted-foreground/40" />
          </div>
        )}
        {property.relationLabel ? (
          <Badge className="absolute top-2 left-2 bg-background/90 text-foreground backdrop-blur">
            {property.relationLabel}
          </Badge>
        ) : null}
      </div>
      <div className="space-y-0.5 p-3">
        <p className="text-sm font-semibold text-foreground">{property.priceLabel}</p>
        <p className="truncate text-sm text-foreground">{property.title}</p>
        {property.locationLabel ? <p className="truncate text-xs text-muted-foreground">{property.locationLabel}</p> : null}
      </div>
    </div>
  );
}
