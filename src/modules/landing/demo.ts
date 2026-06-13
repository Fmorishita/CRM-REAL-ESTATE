import { operationLabel, propertyTypeLabel } from "@/config/properties";
import { formatCurrency } from "@/lib/format";
import { DEMO_PROPERTIES, type DemoProperty } from "@/modules/properties/demo";
import type {
  LandingBrand,
  PublicCompany,
  PublicProperty,
  PublicPropertyCard,
} from "@/modules/landing/types";

const CURRENCY = "MXN";
const LOCALE = "es-MX";

export const DEMO_BRAND: LandingBrand = {
  organizationId: "14ffd897-81d1-409e-9f50-c96a416e0d26",
  name: "Morishita Realty Group",
  slug: "morishita-realty",
  logoUrl: null,
  primaryColor: "#0f172a",
  accentColor: "#2563eb",
  whatsapp: "+52 646 100 0003",
};

function price(p: DemoProperty): string {
  return formatCurrency(p.price, CURRENCY, LOCALE, { maximumFractionDigits: 0 });
}

function toCard(p: DemoProperty): PublicPropertyCard {
  return {
    slug: p.slug,
    title: p.title,
    priceLabel: price(p),
    coverUrl: p.cover,
    typeLabel: propertyTypeLabel(p.type),
    operationLabel: operationLabel(p.operation),
    locationLabel: [p.zone, p.city].filter(Boolean).join(", ") || null,
  };
}

export function demoPublicProperty(slug: string): PublicProperty | null {
  const p = DEMO_PROPERTIES.find((x) => x.slug === slug);
  if (!p) return null;
  const location = [p.zone, p.city, p.state].filter(Boolean).join(", ");
  return {
    brand: DEMO_BRAND,
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    typeLabel: propertyTypeLabel(p.type),
    operationLabel: operationLabel(p.operation),
    status: p.status,
    priceLabel: price(p),
    hidePrice: false,
    locationLabel: location || null,
    showExactLocation: false,
    lat: null,
    lng: null,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    parking: p.parking,
    builtM2: p.builtM2,
    lotSizeM2: p.lotSizeM2,
    amenities: p.amenities,
    media: [{ id: `${p.id}-cover`, url: p.cover, alt: p.title }],
    agentName: "Carlos Mendoza",
    seoTitle: `${p.title} | ${DEMO_BRAND.name}`,
    seoDescription: p.description,
    ogImage: p.cover,
    similar: DEMO_PROPERTIES.filter((x) => x.slug !== slug && x.type === p.type)
      .slice(0, 3)
      .map(toCard),
  };
}

export function demoPublicCompany(slug: string): PublicCompany | null {
  if (slug !== DEMO_BRAND.slug) return null;
  return {
    brand: DEMO_BRAND,
    description:
      "Inmobiliaria boutique especializada en propiedades premium en Baja California y las principales ciudades de México. Acompañamos a compradores, vendedores e inversionistas en cada paso.",
    agents: [
      { name: "Frank Morishita", roleLabel: "Owner" },
      { name: "Sofía Hernández", roleLabel: "Team Leader" },
      { name: "Carlos Mendoza", roleLabel: "Agente" },
      { name: "Mariana López", roleLabel: "Agente" },
    ],
    properties: DEMO_PROPERTIES.map(toCard),
    seoTitle: `${DEMO_BRAND.name} | Propiedades premium`,
    seoDescription:
      "Descubre propiedades premium en venta, renta y preventa con Morishita Realty Group.",
  };
}
