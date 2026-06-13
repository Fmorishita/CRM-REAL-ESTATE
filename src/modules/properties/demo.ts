import { operationLabel, propertyTypeLabel } from "@/config/properties";
import type { TenantContext } from "@/lib/auth/types";
import { formatCurrency } from "@/lib/format";
import type {
  PropertyDetail,
  PropertyFormOptions,
  PropertyListItem,
} from "@/modules/properties/types";

interface DemoProperty {
  id: string;
  title: string;
  slug: string;
  type: string;
  operation: string;
  status: string;
  price: number;
  zone: string;
  city: string;
  state: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  builtM2: number | null;
  lotSizeM2: number | null;
  cover: string;
  amenities: string[];
  description: string;
  commissionPct: number;
  interest: number;
  developer?: string;
}

const DEMO_PROPERTIES: DemoProperty[] = [
  { id: "b2000000-0000-4000-8000-000000000001", title: "Casa frente al mar en Ensenada", slug: "casa-frente-al-mar-ensenada", type: "house", operation: "sale", status: "available", price: 12500000, zone: "Playa Hermosa", city: "Ensenada", state: "Baja California", bedrooms: 4, bathrooms: 4.5, parking: 3, builtM2: 420, lotSizeM2: 650, cover: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200", amenities: ["Vista al mar", "Alberca", "Acceso a playa", "Cocina integral", "Roof garden"], description: "Espectacular residencia con vista al océano Pacífico, acabados de lujo y acceso a playa privada.", commissionPct: 3.5, interest: 3 },
  { id: "b2000000-0000-4000-8000-000000000002", title: "Departamento en Polanco CDMX", slug: "departamento-polanco-cdmx", type: "apartment", operation: "sale", status: "available", price: 8900000, zone: "Polanco", city: "Ciudad de México", state: "CDMX", bedrooms: 2, bathrooms: 2, parking: 2, builtM2: 135, lotSizeM2: null, cover: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200", amenities: ["Gimnasio", "Roof garden", "Seguridad 24/7", "Pet friendly", "Lobby"], description: "Departamento de lujo en el corazón de Polanco, a pasos de Masaryk. Amenidades premium.", commissionPct: 3, interest: 3 },
  { id: "b2000000-0000-4000-8000-000000000003", title: "Terreno en Valle de Guadalupe", slug: "terreno-valle-de-guadalupe", type: "land", operation: "sale", status: "available", price: 3200000, zone: "San Antonio de las Minas", city: "Ensenada", state: "Baja California", bedrooms: null, bathrooms: null, parking: null, builtM2: null, lotSizeM2: 5000, cover: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200", amenities: ["Uso agrícola", "Servicios cercanos", "Vista a viñedos"], description: "Terreno campestre ideal para viñedo o casa de descanso en la ruta del vino.", commissionPct: 5, interest: 1 },
  { id: "b2000000-0000-4000-8000-000000000004", title: "Preventa Torre Altitude Tijuana", slug: "preventa-torre-altitude-tijuana", type: "presale", operation: "presale", status: "available", price: 4750000, zone: "Zona Río", city: "Tijuana", state: "Baja California", bedrooms: 2, bathrooms: 2, parking: 1, builtM2: 98, lotSizeM2: null, cover: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200", amenities: ["Alberca", "Gym", "Coworking", "Sky lounge", "Smart home"], description: "Departamentos en preventa con entrega 2027. Zona Río, plusvalía garantizada.", commissionPct: 4, interest: 4, developer: "Altitude Developments" },
  { id: "b2000000-0000-4000-8000-000000000005", title: "Desarrollo Residencial Cumbres Monterrey", slug: "desarrollo-cumbres-monterrey", type: "development", operation: "sale", status: "available", price: 6800000, zone: "Cumbres", city: "Monterrey", state: "Nuevo León", bedrooms: 3, bathrooms: 3.5, parking: 2, builtM2: 260, lotSizeM2: 320, cover: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200", amenities: ["Club house", "Casa club", "Áreas verdes", "Seguridad", "Parque"], description: "Casas en desarrollo en zona premium de Monterrey, con club house y áreas verdes.", commissionPct: 3.5, interest: 2 },
];

function toListItem(p: DemoProperty, currency: string, locale: string): PropertyListItem {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    type: p.type,
    typeLabel: propertyTypeLabel(p.type),
    operation: p.operation,
    operationLabel: operationLabel(p.operation),
    status: p.status,
    priceLabel: formatCurrency(p.price, currency, locale, { maximumFractionDigits: 0 }),
    zone: p.zone,
    city: p.city,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    builtM2: p.builtM2,
    coverUrl: p.cover,
    interest: p.interest,
  };
}

export function demoPropertyList(ctx: TenantContext): PropertyListItem[] {
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  return DEMO_PROPERTIES.map((p) => toListItem(p, currency, locale));
}

export function demoPropertyDetail(ctx: TenantContext, idOrSlug: string): PropertyDetail | null {
  const p = DEMO_PROPERTIES.find((x) => x.id === idOrSlug || x.slug === idOrSlug);
  if (!p) return null;
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  return {
    ...toListItem(p, currency, locale),
    description: p.description,
    amenities: p.amenities,
    media: [{ id: `${p.id}-cover`, url: p.cover, alt: p.title, kind: "photo" }],
    lat: null,
    lng: null,
    state: p.state,
    country: "MX",
    parking: p.parking,
    lotSizeM2: p.lotSizeM2,
    commissionPct: p.commissionPct,
    developerName: p.developer ?? null,
    deliveryDateLabel: p.type === "presale" ? "jun 2027" : null,
    assignedName: "Carlos Mendoza",
    createdAtLabel: "hace 2 días",
    interestedLeads: [
      { contactId: "demo", name: "Roberto Gómez", relation: "favorite", relationLabel: "Favorita" },
      { contactId: "demo", name: "Patricia Núñez", relation: "recommended", relationLabel: "Recomendada" },
    ].slice(0, p.interest > 1 ? 2 : 1),
  };
}

export const DEMO_PROPERTY_FORM_OPTIONS: PropertyFormOptions = {
  members: [
    { id: "m1", name: "Carlos Mendoza" },
    { id: "m2", name: "Mariana López" },
    { id: "m3", name: "Sofía Hernández" },
  ],
};
