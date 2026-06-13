import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Building2, MapPin, Ruler, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/modules/properties/components/property-badges";
import type { PropertyListItem } from "@/modules/properties/types";

export function PropertyCard({ property }: { property: PropertyListItem }) {
  const location = [property.zone, property.city].filter(Boolean).join(", ");
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {property.coverUrl ? (
          <Image
            src={property.coverUrl}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="size-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge className="bg-background/90 text-foreground backdrop-blur">{property.operationLabel}</Badge>
          <StatusBadge status={property.status} />
        </div>
        {property.interest > 0 ? (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-0.5 text-xs font-medium text-foreground backdrop-blur">
            <Users className="size-3" />
            {property.interest}
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-4">
        <div>
          <p className="font-semibold tracking-tight text-foreground">{property.priceLabel}</p>
          <h3 className="truncate text-sm font-medium text-foreground">{property.title}</h3>
        </div>
        {location ? (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {location}
          </p>
        ) : null}
        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
          {property.bedrooms != null ? (
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" />
              {property.bedrooms}
            </span>
          ) : null}
          {property.bathrooms != null ? (
            <span className="flex items-center gap-1">
              <Bath className="size-3.5" />
              {property.bathrooms}
            </span>
          ) : null}
          {property.builtM2 != null ? (
            <span className="flex items-center gap-1">
              <Ruler className="size-3.5" />
              {property.builtM2} m²
            </span>
          ) : null}
          <span className="ml-auto">{property.typeLabel}</span>
        </div>
      </div>
    </Link>
  );
}
