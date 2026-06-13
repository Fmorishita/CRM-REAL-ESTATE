import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Car,
  ExternalLink,
  MapPin,
  Pencil,
  Ruler,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/format";
import { StatusBadge } from "@/modules/properties/components/property-badges";
import { PropertyFormDialog } from "@/modules/properties/components/property-form-dialog";
import type { PropertyDetail, PropertyFormOptions } from "@/modules/properties/types";

export function PropertyDetailView({
  property,
  options,
  defaultCurrency,
  canManage,
  canPublish,
}: {
  property: PropertyDetail;
  options: PropertyFormOptions;
  defaultCurrency: string;
  canManage: boolean;
  canPublish: boolean;
}) {
  const location = [property.zone, property.city, property.state].filter(Boolean).join(", ");
  const cover = property.media[0];
  const rest = property.media.slice(1, 5);

  const specs = [
    property.bedrooms != null ? { icon: BedDouble, label: `${property.bedrooms} rec.` } : null,
    property.bathrooms != null ? { icon: Bath, label: `${property.bathrooms} baños` } : null,
    property.parking != null ? { icon: Car, label: `${property.parking} estac.` } : null,
    property.builtM2 != null ? { icon: Ruler, label: `${property.builtM2} m² const.` } : null,
    property.lotSizeM2 != null ? { icon: Ruler, label: `${property.lotSizeM2} m² terreno` } : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/properties">
            <ArrowLeft />
            Propiedades
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {canPublish ? (
            <Button asChild variant="outline" size="sm">
              <a href={`/p/${property.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                Ver landing
              </a>
            </Button>
          ) : null}
          {canManage ? (
            <PropertyFormDialog
              options={options}
              defaultCurrency={defaultCurrency}
              initial={{
                id: property.id,
                title: property.title,
                propertyType: property.type,
                operation: property.operation,
                status: property.status,
                price: Number(property.priceLabel.replace(/[^0-9.]/g, "")) || 0,
                zone: property.zone,
                city: property.city,
                state: property.state,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                parking: property.parking,
                builtM2: property.builtM2,
                lotSizeM2: property.lotSizeM2,
                amenities: property.amenities,
                commissionPct: property.commissionPct,
                description: property.description,
              }}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil />
                  Editar
                </Button>
              }
            />
          ) : null}
        </div>
      </div>

      {/* Gallery */}
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
        {rest.map((m) => (
          <div key={m.id} className="relative hidden aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:block">
            <Image src={m.url} alt={m.alt ?? property.title} fill sizes="25vw" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{property.operationLabel}</Badge>
              <StatusBadge status={property.status} />
              <Badge variant="secondary">{property.typeLabel}</Badge>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{property.title}</h1>
            <p className="mt-1 text-2xl font-semibold text-foreground">{property.priceLabel}</p>
            {location ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {location}
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{property.description}</p>
              </CardContent>
            </Card>
          ) : null}

          {property.amenities.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Amenidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <Badge key={a} variant="secondary">
                      {a}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Agente">{property.assignedName ?? "Sin asignar"}</Row>
              {property.commissionPct != null ? <Row label="Comisión">{property.commissionPct}%</Row> : null}
              {property.developerName ? <Row label="Desarrollador">{property.developerName}</Row> : null}
              {property.deliveryDateLabel ? <Row label="Entrega">{property.deliveryDateLabel}</Row> : null}
              {property.createdAtLabel ? <Row label="Publicada">{property.createdAtLabel}</Row> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads interesados ({property.interestedLeads.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {property.interestedLeads.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">Aún no hay leads interesados.</p>
              ) : (
                <ul className="space-y-2">
                  {property.interestedLeads.map((lead, i) => (
                    <li key={`${lead.contactId}-${i}`} className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-[10px]">{getInitials(lead.name)}</AvatarFallback>
                      </Avatar>
                      <Link
                        href={`/contacts/${lead.contactId}`}
                        className="flex-1 truncate text-sm font-medium text-foreground hover:underline"
                      >
                        {lead.name}
                      </Link>
                      <Badge variant="outline">{lead.relationLabel}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  );
}
