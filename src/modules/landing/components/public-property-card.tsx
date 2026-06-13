import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PublicPropertyCard } from "@/modules/landing/types";

export function PublicPropertyCardItem({ property }: { property: PublicPropertyCard }) {
  return (
    <Link
      href={`/p/${property.slug}`}
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
        <Badge className="absolute top-2 left-2 bg-background/90 text-foreground backdrop-blur">
          {property.operationLabel}
        </Badge>
      </div>
      <div className="space-y-1 p-4">
        {property.priceLabel ? (
          <p className="font-semibold tracking-tight text-foreground">{property.priceLabel}</p>
        ) : null}
        <h3 className="truncate text-sm font-medium text-foreground">{property.title}</h3>
        {property.locationLabel ? (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {property.locationLabel}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
