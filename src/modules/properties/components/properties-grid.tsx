import { Building2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PropertyCard } from "@/modules/properties/components/property-card";
import type { PropertyListItem } from "@/modules/properties/types";

export function PropertiesGrid({ properties }: { properties: PropertyListItem[] }) {
  if (properties.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Sin propiedades"
        description="No hay propiedades que coincidan con tu búsqueda. Ajusta los filtros o publica una nueva."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
