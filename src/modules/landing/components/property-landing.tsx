import Image from "next/image";
import { Bath, BedDouble, Building2, Car, MapPin, Ruler, Trees } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  FloatingWhatsApp,
  LandingFooter,
  LandingHeader,
} from "@/modules/landing/components/landing-chrome";
import { LandingLeadForm } from "@/modules/landing/components/landing-lead-form";
import { PublicPropertyCardItem } from "@/modules/landing/components/public-property-card";
import type { PublicProperty } from "@/modules/landing/types";

export function PropertyLanding({ property }: { property: PublicProperty }) {
  const cover = property.media[0];
  const gallery = property.media.slice(1, 5);
  const specs = [
    property.bedrooms != null ? { icon: BedDouble, label: `${property.bedrooms} recámaras` } : null,
    property.bathrooms != null ? { icon: Bath, label: `${property.bathrooms} baños` } : null,
    property.parking != null ? { icon: Car, label: `${property.parking} estac.` } : null,
    property.builtM2 != null ? { icon: Ruler, label: `${property.builtM2} m² const.` } : null,
    property.lotSizeM2 != null ? { icon: Trees, label: `${property.lotSizeM2} m² terreno` } : null,
  ].filter(Boolean);

  const waMessage = `Hola, me interesa la propiedad "${property.title}". ¿Me pueden dar más información?`;

  return (
    <div className="min-h-dvh bg-background">
      <LandingHeader brand={property.brand} />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Hero gallery */}
        <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted sm:col-span-2 sm:row-span-2 sm:aspect-auto">
            {cover ? (
              <Image src={cover.url} alt={cover.alt ?? property.title} fill sizes="50vw" className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Building2 className="size-12 text-muted-foreground/40" />
              </div>
            )}
          </div>
          {gallery.map((m) => (
            <div key={m.id} className="relative hidden aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:block">
              <Image src={m.url} alt={m.alt ?? property.title} fill sizes="25vw" className="object-cover" />
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge style={{ backgroundColor: property.brand.accentColor }} className="text-white">
                  {property.operationLabel}
                </Badge>
                <Badge variant="secondary">{property.typeLabel}</Badge>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {property.title}
              </h1>
              {property.priceLabel ? (
                <p className="mt-1 text-2xl font-semibold text-foreground">{property.priceLabel}</p>
              ) : (
                <p className="mt-1 text-lg font-medium text-muted-foreground">Precio a consultar</p>
              )}
              {property.locationLabel ? (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {property.locationLabel}
                  {!property.showExactLocation ? " (ubicación aproximada)" : ""}
                </p>
              ) : null}
            </div>

            {specs.length > 0 ? (
              <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-card p-4">
                {specs.map((spec, i) => {
                  const Icon = spec!.icon;
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Icon className="size-4 text-muted-foreground" />
                      {spec!.label}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {property.description ? (
              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">Descripción</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{property.description}</p>
              </section>
            ) : null}

            {property.amenities.length > 0 ? (
              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">Amenidades</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <Badge key={a} variant="secondary">
                      {a}
                    </Badge>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Lead form sidebar */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <LandingLeadForm
              organizationId={property.brand.organizationId}
              propertyId={property.id}
              accentColor={property.brand.accentColor}
              title="Agenda una visita"
              defaultMessage={`Me interesa: ${property.title}`}
            />
            {property.agentName ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Atendido por {property.agentName}
              </p>
            ) : null}
          </div>
        </div>

        {property.similar.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Propiedades similares</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {property.similar.map((p) => (
                <PublicPropertyCardItem key={p.slug} property={p} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <LandingFooter brand={property.brand} />
      <FloatingWhatsApp brand={property.brand} message={waMessage} />
    </div>
  );
}
