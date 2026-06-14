import "server-only";

import { visitStatusLabel } from "@/config/visits";
import type { Organization, TenantContext } from "@/lib/auth/types";
import { isDemoMode } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatDayMonth, formatTime } from "@/lib/format";
import { DEMO_ORGANIZATIONS } from "@/lib/demo/session";
import { getPropertyMatches } from "@/modules/matching/server/queries";
import type { PortalSession } from "@/lib/portal/session";
import type { PortalData, PortalPropertyCard, PortalStep } from "@/modules/portal/types";

const BUYER_STAGES = ["new", "qualified", "searching", "visit_scheduled", "negotiation", "won"];

function buildSteps(currentStage: string): PortalStep[] {
  const idx = Math.max(0, BUYER_STAGES.indexOf(currentStage));
  const labels = ["Búsqueda", "Calificación", "Selección", "Visitas", "Negociación", "Cierre"];
  return labels.map((label, i) => ({ label, done: i < idx, current: i === idx }));
}

function syntheticCtx(org: Organization, session: PortalSession): TenantContext {
  return {
    organization: org,
    user: { id: session.contactId, name: session.name, email: session.email },
    membership: { id: "portal", organizationId: org.id, userId: session.contactId, role: "client", status: "active" },
    role: "client",
    permissions: [],
    organizations: [org],
  };
}

export async function getPortalData(session: PortalSession): Promise<PortalData> {
  const demo = isDemoMode();
  const locale = "es-MX";

  // Resolve organization (brand) + a synthetic context for reused queries.
  let org: Organization;
  if (demo) {
    org = DEMO_ORGANIZATIONS[0]!;
  } else {
    try {
      const row = await prisma.organization.findUnique({ where: { id: session.organizationId } });
      org = row
        ? {
            id: row.id,
            name: row.name,
            slug: row.slug,
            plan: row.plan,
            country: row.country,
            defaultCurrency: row.defaultCurrency,
            defaultLocale: row.defaultLocale,
            timezone: row.timezone,
          }
        : DEMO_ORGANIZATIONS[0]!;
    } catch {
      org = DEMO_ORGANIZATIONS[0]!;
    }
  }

  const branding = !demo ? await loadBranding(org.id) : { primaryColor: "#0f172a", accentColor: "#2563eb" };
  const ctx = syntheticCtx(org, session);
  const cur = (n: number) => formatCurrency(n, org.defaultCurrency, org.defaultLocale, { maximumFractionDigits: 0 });

  const base: PortalData = {
    brand: { organizationId: org.id, name: org.name, primaryColor: branding.primaryColor, accentColor: branding.accentColor },
    clientName: session.name,
    portalType: session.portalType,
    agent: null,
    steps: [],
    recommended: [],
    favorites: [],
    visits: [],
    listedProperties: [],
    interestedLeadsCount: 0,
    visitFeedback: [],
    roi: [],
  };

  if (demo) return fillDemo(base, session, cur, locale);

  try {
    const contact = await prisma.contact.findFirst({
      where: { id: session.contactId, organizationId: org.id },
      include: {
        assignedMembership: { include: { user: true } },
        properties: { include: { property: { include: { media: { take: 1, orderBy: { position: "asc" } } } } } },
        visits: { include: { property: true }, orderBy: { scheduledAt: "asc" } },
      },
    });
    if (!contact) return base;

    base.agent = contact.assignedMembership
      ? {
          name: contact.assignedMembership.user.name,
          whatsapp: contact.assignedMembership.user.phone,
          email: contact.assignedMembership.user.email,
        }
      : null;
    base.steps = buildSteps(contact.stage);

    base.visits = contact.visits.map((v) => ({
      id: v.id,
      propertyTitle: v.property.title,
      dayLabel: formatDayMonth(v.scheduledAt, org.defaultLocale, org.timezone),
      timeLabel: formatTime(v.scheduledAt, org.defaultLocale, org.timezone),
      status: v.status,
      statusLabel: visitStatusLabel(v.status),
    }));

    const toCard = (p: { id: string; title: string; slug: string; price: unknown; currency: string; zone: string | null; city: string | null; media: { url: string }[] }, relation?: string): PortalPropertyCard => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      priceLabel: cur(Number(p.price)),
      coverUrl: p.media[0]?.url ?? null,
      locationLabel: [p.zone, p.city].filter(Boolean).join(", ") || null,
      relationLabel: relation,
    });

    base.favorites = contact.properties
      .filter((cp) => cp.relation === "favorite")
      .map((cp) => toCard(cp.property));

    if (session.portalType === "buyer" || session.portalType === "investor") {
      base.recommended = await getPropertyMatches(ctx, session.contactId);
    }

    if (session.portalType === "seller") {
      // Properties the client has shown ownership-like interest in (offered/visited).
      base.listedProperties = contact.properties
        .filter((cp) => cp.relation === "offered" || cp.relation === "visited")
        .map((cp) => toCard(cp.property));
      base.interestedLeadsCount = base.listedProperties.length * 2;
      base.visitFeedback = contact.visits
        .map((v) => v.feedback)
        .filter((f): f is string => Boolean(f));
    }

    if (session.portalType === "investor") {
      base.roi = [
        { label: "ROI estimado (3 años)", value: "+24%" },
        { label: "Plusvalía anual zona", value: "+8%" },
        { label: "Renta estimada", value: cur(18000) + "/mes" },
      ];
    }

    return base;
  } catch (error) {
    console.error("getPortalData failed, falling back to demo:", error);
    return fillDemo(base, session, cur, locale);
  }
}

async function loadBranding(orgId: string): Promise<{ primaryColor: string; accentColor: string }> {
  try {
    const row = await prisma.organization.findUnique({ where: { id: orgId }, select: { branding: true } });
    const b = (row?.branding ?? {}) as { primaryColor?: string; accentColor?: string };
    return { primaryColor: b.primaryColor ?? "#0f172a", accentColor: b.accentColor ?? "#2563eb" };
  } catch {
    return { primaryColor: "#0f172a", accentColor: "#2563eb" };
  }
}

function fillDemo(base: PortalData, session: PortalSession, cur: (n: number) => string, locale: string): PortalData {
  base.agent = { name: "Carlos Mendoza", whatsapp: "+52 646 100 0003", email: "carlos@morishitarealty.mx" };
  const now = new Date();
  const day = (h: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    d.setHours(h, 0, 0, 0);
    return d;
  };

  base.visits = [
    {
      id: "v1",
      propertyTitle: session.portalType === "investor" ? "Terreno en Valle de Guadalupe" : "Casa frente al mar en Ensenada",
      dayLabel: formatDayMonth(day(11), locale, "America/Tijuana"),
      timeLabel: formatTime(day(11), locale, "America/Tijuana"),
      status: "confirmed",
      statusLabel: visitStatusLabel("confirmed"),
    },
  ];

  base.steps =
    session.portalType === "buyer"
      ? buildSteps("searching")
      : session.portalType === "investor"
        ? buildSteps("negotiation")
        : [];

  base.favorites = [
    { id: "b2000000-0000-4000-8000-000000000001", title: "Casa frente al mar en Ensenada", slug: "casa-frente-al-mar-ensenada", priceLabel: cur(12500000), coverUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200", locationLabel: "Playa Hermosa, Ensenada" },
  ];

  if (session.portalType === "seller") {
    base.listedProperties = [
      { id: "b2000000-0000-4000-8000-000000000001", title: "Casa frente al mar en Ensenada", slug: "casa-frente-al-mar-ensenada", priceLabel: cur(12500000), coverUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200", locationLabel: "Playa Hermosa, Ensenada", relationLabel: "En venta" },
    ];
    base.interestedLeadsCount = 3;
    base.visitFeedback = [
      "Al cliente le encantó la vista al mar; consultó por el acceso a la playa.",
      "Interesado, pero pidió negociar el precio un 5%.",
    ];
  }

  if (session.portalType === "investor") {
    base.roi = [
      { label: "ROI estimado (3 años)", value: "+24%" },
      { label: "Plusvalía anual zona", value: "+8%" },
      { label: "Renta estimada", value: cur(18000) + "/mes" },
    ];
  }
  // Recommended is left empty in demo for buyer/investor (the agent app shows
  // the smart-matching surface); favorites + visits give a rich portal already.
  return base;
}
