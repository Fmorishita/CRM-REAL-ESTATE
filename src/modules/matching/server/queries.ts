import "server-only";

import { operationLabel, propertyTypeLabel } from "@/config/properties";
import type { TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/format";
import { computeMatch, type MatchPreference, type MatchProperty, type MatchScore } from "@/lib/matching/engine";
import { demoClientMatches, demoPropertyMatches } from "@/modules/matching/demo";
import type { ClientMatch, PropertyMatch } from "@/modules/matching/types";

function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

function buildMessage(contactName: string, propertyTitle: string, score: number, reasons: MatchScore["reasons"], locationLabel: string | null): string {
  const reason = reasons[0]?.text.toLowerCase();
  const where = locationLabel ? ` en ${locationLabel}` : "";
  const because = reason ? ` Coincide en que está ${reason}.` : "";
  return (
    `Hola ${firstName(contactName)}, encontré una propiedad que coincide ${score}% con lo que buscas: ` +
    `"${propertyTitle}"${where}.${because} ¿Te gustaría agendar una visita?`
  );
}

/** Recommends properties for a contact, scored by compatibility. */
export async function getPropertyMatches(ctx: TenantContext, contactId: string): Promise<PropertyMatch[]> {
  const locale = ctx.organization.defaultLocale;
  if (isDemoMode()) return demoPropertyMatches(ctx, contactId);
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId: ctx.organization.id, deletedAt: null },
      include: { preference: true },
    });
    if (!contact) return [];

    const pref: MatchPreference = {
      budgetMin: contact.preference?.budgetMin != null ? Number(contact.preference.budgetMin) : null,
      budgetMax: contact.preference?.budgetMax != null ? Number(contact.preference.budgetMax) : null,
      zones: contact.preference?.zones ?? [],
      propertyTypes: contact.preference?.propertyTypes ?? [],
      bedroomsMin: contact.preference?.bedroomsMin ?? null,
      bathroomsMin: contact.preference?.bathroomsMin ?? null,
      amenities: contact.preference?.amenities ?? [],
      urgency: contact.preference?.urgency,
    };

    const properties = await prisma.property.findMany({
      where: { organizationId: ctx.organization.id, deletedAt: null, status: "available" },
      include: { media: { orderBy: { position: "asc" }, take: 1 } },
      take: 100,
    });

    const contactName = `${contact.firstName} ${contact.lastName}`;
    const matches: PropertyMatch[] = properties.map((p) => {
      const input: MatchProperty = {
        price: Number(p.price),
        zone: p.zone,
        city: p.city,
        propertyType: p.propertyType,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        amenities: p.amenities,
      };
      const result = computeMatch(pref, input);
      const locationLabel = [p.zone, p.city].filter(Boolean).join(", ") || null;
      return {
        propertyId: p.id,
        title: p.title,
        slug: p.slug,
        priceLabel: formatCurrency(Number(p.price), p.currency, locale, { maximumFractionDigits: 0 }),
        coverUrl: p.media[0]?.url ?? null,
        typeLabel: propertyTypeLabel(p.propertyType),
        operationLabel: operationLabel(p.operation),
        locationLabel,
        score: result.score,
        tier: result.tier,
        reasons: result.reasons,
        objections: result.objections,
        suggestedMessage: buildMessage(contactName, p.title, result.score, result.reasons, locationLabel),
      };
    });

    return matches.sort((a, b) => b.score - a.score).slice(0, 6);
  } catch (error) {
    console.error("getPropertyMatches failed, falling back to demo:", error);
    return demoPropertyMatches(ctx, contactId);
  }
}

/** Finds clients compatible with a property, scored by compatibility. */
export async function getClientMatches(ctx: TenantContext, propertyId: string): Promise<ClientMatch[]> {
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });
  if (isDemoMode()) return demoClientMatches(ctx, propertyId);
  try {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, organizationId: ctx.organization.id, deletedAt: null },
    });
    if (!property) return [];

    const input: MatchProperty = {
      price: Number(property.price),
      zone: property.zone,
      city: property.city,
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      amenities: property.amenities,
    };

    const contacts = await prisma.contact.findMany({
      where: { organizationId: ctx.organization.id, deletedAt: null, type: { in: ["buyer", "investor", "renter"] } },
      include: { preference: true },
      take: 200,
    });

    const matches: ClientMatch[] = contacts
      .filter((c) => c.preference)
      .map((c) => {
        const pref: MatchPreference = {
          budgetMin: c.preference!.budgetMin != null ? Number(c.preference!.budgetMin) : null,
          budgetMax: c.preference!.budgetMax != null ? Number(c.preference!.budgetMax) : null,
          zones: c.preference!.zones,
          propertyTypes: c.preference!.propertyTypes,
          bedroomsMin: c.preference!.bedroomsMin,
          bathroomsMin: c.preference!.bathroomsMin,
          amenities: c.preference!.amenities,
          urgency: c.preference!.urgency,
        };
        const result = computeMatch(pref, input);
        const min = c.preference!.budgetMin != null ? Number(c.preference!.budgetMin) : null;
        const max = c.preference!.budgetMax != null ? Number(c.preference!.budgetMax) : null;
        const name = `${c.firstName} ${c.lastName}`;
        const locationLabel = [property.zone, property.city].filter(Boolean).join(", ") || null;
        return {
          contactId: c.id,
          name,
          typeLabel: c.type,
          score: result.score,
          tier: result.tier,
          budgetLabel: min != null && max != null ? `${cur(min)} – ${cur(max)}` : max != null ? `Hasta ${cur(max)}` : null,
          zone: c.preference!.zones[0] ?? null,
          reasons: result.reasons,
          suggestedMessage: buildMessage(name, property.title, result.score, result.reasons, locationLabel),
        };
      });

    return matches.filter((m) => m.score >= 40).sort((a, b) => b.score - a.score).slice(0, 6);
  } catch (error) {
    console.error("getClientMatches failed, falling back to demo:", error);
    return demoClientMatches(ctx, propertyId);
  }
}
