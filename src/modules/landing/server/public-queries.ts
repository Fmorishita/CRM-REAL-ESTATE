import "server-only";

import type { Organization, Prisma } from "@prisma/client";

import { operationLabel, propertyTypeLabel } from "@/config/properties";
import { ROLE_LABELS, type Role } from "@/config/permissions";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/format";
import { demoPublicCompany, demoPublicProperty } from "@/modules/landing/demo";
import type {
  LandingBrand,
  PublicCompany,
  PublicProperty,
  PublicPropertyCard,
} from "@/modules/landing/types";

interface OrgBranding {
  primaryColor?: string;
  accentColor?: string;
}

interface OrgSettings {
  whatsapp?: string;
  description?: string;
}

function brandOf(org: Organization, whatsappFallback?: string | null): LandingBrand {
  const branding = (org.branding ?? {}) as OrgBranding;
  const settings = (org.settings ?? {}) as OrgSettings;
  return {
    organizationId: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl,
    primaryColor: branding.primaryColor ?? "#0f172a",
    accentColor: branding.accentColor ?? "#2563eb",
    whatsapp: settings.whatsapp ?? whatsappFallback ?? null,
  };
}

function priceOf(amount: number, currency: string, locale: string): string {
  return formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 });
}

const cardSelect = {
  slug: true,
  title: true,
  price: true,
  currency: true,
  propertyType: true,
  operation: true,
  zone: true,
  city: true,
  media: { orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.PropertySelect;

function toCard(
  p: Prisma.PropertyGetPayload<{ select: typeof cardSelect }>,
  locale: string,
): PublicPropertyCard {
  return {
    slug: p.slug,
    title: p.title,
    priceLabel: priceOf(Number(p.price), p.currency, locale),
    coverUrl: p.media[0]?.url ?? null,
    typeLabel: propertyTypeLabel(p.propertyType),
    operationLabel: operationLabel(p.operation),
    locationLabel: [p.zone, p.city].filter(Boolean).join(", ") || null,
  };
}

export async function getPublicProperty(slug: string): Promise<PublicProperty | null> {
  if (isDemoMode()) return demoPublicProperty(slug);
  try {
    const property = await prisma.property.findFirst({
      where: { slug, deletedAt: null },
      include: {
        organization: true,
        media: { orderBy: { position: "asc" } },
        assignedMembership: { include: { user: true } },
        landingPages: { where: { kind: "property" }, take: 1 },
      },
    });
    if (!property) return null;

    const landing = property.landingPages[0];
    if (landing && !landing.isActive) return null;

    const org = property.organization;
    const locale = org.defaultLocale;
    const hidePrice = landing?.hidePrice ?? false;
    const showExactLocation = landing?.showExactLocation ?? false;
    const location = [property.zone, property.city, property.state].filter(Boolean).join(", ");
    const cover = property.media[0]?.url ?? null;

    const similar = await prisma.property.findMany({
      where: {
        organizationId: org.id,
        deletedAt: null,
        status: "available",
        propertyType: property.propertyType,
        NOT: { id: property.id },
      },
      select: cardSelect,
      take: 3,
    });

    const seo = (landing?.seo ?? {}) as { title?: string; description?: string };

    return {
      brand: brandOf(org, property.assignedMembership?.user.phone ?? null),
      id: property.id,
      title: property.title,
      slug: property.slug,
      description: property.description,
      typeLabel: propertyTypeLabel(property.propertyType),
      operationLabel: operationLabel(property.operation),
      status: property.status,
      priceLabel: hidePrice ? null : priceOf(Number(property.price), property.currency, locale),
      hidePrice,
      locationLabel: location || null,
      showExactLocation,
      lat: showExactLocation ? property.lat : null,
      lng: showExactLocation ? property.lng : null,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parking: property.parking,
      builtM2: property.builtM2,
      lotSizeM2: property.lotSizeM2,
      amenities: property.amenities,
      media: property.media.map((m) => ({ id: m.id, url: m.url, alt: m.alt })),
      agentName: property.assignedMembership?.user.name ?? null,
      seoTitle: seo.title ?? `${property.title} | ${org.name}`,
      seoDescription: seo.description ?? property.description ?? `${property.title} en ${location}`,
      ogImage: cover,
      similar: similar.map((p) => toCard(p, locale)),
    };
  } catch (error) {
    console.error("getPublicProperty failed, falling back to demo data:", error);
    return demoPublicProperty(slug);
  }
}

export async function getPublicCompany(slug: string): Promise<PublicCompany | null> {
  if (isDemoMode()) return demoPublicCompany(slug);
  try {
    const org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) return null;
    const locale = org.defaultLocale;

    const [memberships, properties] = await Promise.all([
      prisma.membership.findMany({
        where: { organizationId: org.id, status: "active", role: { key: { in: ["owner", "team_leader", "broker", "agent"] } } },
        include: { user: true, role: true },
        orderBy: { createdAt: "asc" },
        take: 24,
      }),
      prisma.property.findMany({
        where: { organizationId: org.id, deletedAt: null, status: "available" },
        select: cardSelect,
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
    ]);

    const settings = (org.settings ?? {}) as OrgSettings;

    return {
      brand: brandOf(org),
      description: settings.description ?? null,
      agents: memberships.map((m) => ({
        name: m.user.name,
        roleLabel: ROLE_LABELS[m.role.key as Role] ?? m.role.name,
      })),
      properties: properties.map((p) => toCard(p, locale)),
      seoTitle: `${org.name} | Propiedades`,
      seoDescription: settings.description ?? `Descubre las propiedades de ${org.name}.`,
    };
  } catch (error) {
    console.error("getPublicCompany failed, falling back to demo data:", error);
    return demoPublicCompany(slug);
  }
}
