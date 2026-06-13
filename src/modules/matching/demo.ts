import { operationLabel, propertyTypeLabel } from "@/config/properties";
import type { TenantContext } from "@/lib/auth/types";
import { formatCurrency } from "@/lib/format";
import { computeMatch, type MatchPreference } from "@/lib/matching/engine";
import { DEMO_PROPERTIES } from "@/modules/properties/demo";
import type { ClientMatch, PropertyMatch } from "@/modules/matching/types";

interface DemoPref {
  contactId: string;
  name: string;
  type: string;
  pref: MatchPreference;
}

const DEMO_PREFS: DemoPref[] = [
  { contactId: "d4000000-0000-4000-8000-000000000005", name: "Eduardo Villarreal", type: "investor", pref: { budgetMin: 2500000, budgetMax: 4000000, zones: ["San Antonio de las Minas"], propertyTypes: ["land"], bedroomsMin: null, bathroomsMin: null, amenities: ["Uso agrícola"], urgency: "high" } },
  { contactId: "d4000000-0000-4000-8000-000000000002", name: "Patricia Núñez", type: "investor", pref: { budgetMin: 3000000, budgetMax: 5000000, zones: ["Zona Río", "Cumbres"], propertyTypes: ["presale", "apartment"], bedroomsMin: 2, bathroomsMin: 2, amenities: ["Gym", "Coworking"], urgency: "high" } },
  { contactId: "d4000000-0000-4000-8000-000000000001", name: "Roberto Gómez", type: "buyer", pref: { budgetMin: 8000000, budgetMax: 13000000, zones: ["Playa Hermosa"], propertyTypes: ["house"], bedroomsMin: 3, bathroomsMin: 3, amenities: ["Vista al mar", "Alberca"], urgency: "medium" } },
  { contactId: "d4000000-0000-4000-8000-000000000003", name: "Luis Fernández", type: "buyer", pref: { budgetMin: 7000000, budgetMax: 9500000, zones: ["Polanco"], propertyTypes: ["apartment"], bedroomsMin: 2, bathroomsMin: 2, amenities: ["Seguridad 24/7", "Pet friendly"], urgency: "medium" } },
  { contactId: "d4000000-0000-4000-8000-000000000010", name: "Fernanda Aguirre", type: "investor", pref: { budgetMin: 4000000, budgetMax: 7000000, zones: ["Cumbres", "Zona Río"], propertyTypes: ["development", "presale"], bedroomsMin: 3, bathroomsMin: 3, amenities: ["Club house", "Seguridad"], urgency: "medium" } },
];

const CURRENCY = "MXN";

function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

function message(name: string, title: string, score: number, location: string | null): string {
  const where = location ? ` en ${location}` : "";
  return `Hola ${firstName(name)}, encontré una propiedad que coincide ${score}% con lo que buscas: "${title}"${where}. ¿Te gustaría agendar una visita?`;
}

export function demoPropertyMatches(ctx: TenantContext, contactId: string): PropertyMatch[] {
  const locale = ctx.organization.defaultLocale;
  const entry = DEMO_PREFS.find((p) => p.contactId === contactId);
  const pref: MatchPreference = entry?.pref ?? { zones: [], propertyTypes: [], amenities: [] };
  const name = entry?.name ?? "el cliente";

  return DEMO_PROPERTIES.map((p) => {
    const result = computeMatch(pref, {
      price: p.price,
      zone: p.zone,
      city: p.city,
      propertyType: p.type,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      amenities: p.amenities,
    });
    const location = [p.zone, p.city].filter(Boolean).join(", ") || null;
    return {
      propertyId: p.id,
      title: p.title,
      slug: p.slug,
      priceLabel: formatCurrency(p.price, CURRENCY, locale, { maximumFractionDigits: 0 }),
      coverUrl: p.cover,
      typeLabel: propertyTypeLabel(p.type),
      operationLabel: operationLabel(p.operation),
      locationLabel: location,
      score: result.score,
      tier: result.tier,
      reasons: result.reasons,
      objections: result.objections,
      suggestedMessage: message(name, p.title, result.score, location),
    };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export function demoClientMatches(ctx: TenantContext, propertyId: string): ClientMatch[] {
  const locale = ctx.organization.defaultLocale;
  const cur = (n: number) => formatCurrency(n, CURRENCY, locale, { notation: "compact" });
  const property = DEMO_PROPERTIES.find((p) => p.id === propertyId);
  if (!property) return [];
  const location = [property.zone, property.city].filter(Boolean).join(", ") || null;

  return DEMO_PREFS.map((entry) => {
    const result = computeMatch(entry.pref, {
      price: property.price,
      zone: property.zone,
      city: property.city,
      propertyType: property.type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      amenities: property.amenities,
    });
    const { budgetMin, budgetMax } = entry.pref;
    return {
      contactId: entry.contactId,
      name: entry.name,
      typeLabel: entry.type,
      score: result.score,
      tier: result.tier,
      budgetLabel:
        budgetMin != null && budgetMax != null ? `${cur(budgetMin)} – ${cur(budgetMax)}` : null,
      zone: entry.pref.zones[0] ?? null,
      reasons: result.reasons,
      suggestedMessage: message(entry.name, property.title, result.score, location),
    };
  })
    .filter((m) => m.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}
