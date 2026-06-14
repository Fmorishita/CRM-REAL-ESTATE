import type { TenantContext } from "@/lib/auth/types";
import { formatCurrency } from "@/lib/format";
import { buildInsights } from "@/modules/dashboard/insights";
import type { DashboardData } from "@/modules/dashboard/types";

/**
 * In-memory dashboard data mirroring the seeded "Morishita Realty Group" dataset.
 * Used in demo mode and as a fallback when the database is unreachable, so the
 * dashboard always renders realistic content.
 */
export function demoDashboardData(ctx: TenantContext): DashboardData {
  const { defaultCurrency: currency, defaultLocale: locale, timezone } = ctx.organization;
  const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });

  const totalValue = 12500000 + 11550000 + 8900000 + 8900000 + 3200000;
  const weightedForecast = 5625000 + 6590000 + 4895000 + 6230000 + 2560000;

  return {
    currency,
    locale,
    timezone,
    stats: {
      newLeads: 10,
      pendingConversations: 3,
      upcomingVisits: 3,
      pipelineValue: totalValue,
      weightedForecast,
    },
    commandCenter: [
      {
        id: "task-stale",
        kind: "overdue_task",
        title: "Recontactar a Gabriela Sánchez",
        hint: "Tarea vencida",
        priority: "high",
        href: "/contacts",
      },
      {
        id: "task-today",
        kind: "today_task",
        title: "Enviar brochure a Patricia Núñez",
        hint: "Vence hoy",
        priority: "high",
        href: "/inbox",
      },
      {
        id: "stale-leads",
        kind: "stale_leads",
        title: "2 leads sin seguimiento en más de 7 días",
        hint: "Recontactar para no perderlos",
        priority: "medium",
        href: "/contacts",
      },
    ],
    hotLeads: [
      {
        id: "lead-1",
        name: "Eduardo Villarreal",
        type: "Inversionista",
        score: 95,
        budgetLabel: `${cur(2500000)} – ${cur(4000000)}`,
        zone: "San Antonio de las Minas",
        lastContactLabel: "hace 6 horas",
        recommendedAction: "Enviar contrato de promesa de compraventa",
      },
      {
        id: "lead-2",
        name: "Patricia Núñez",
        type: "Inversionista",
        score: 91,
        budgetLabel: `${cur(3000000)} – ${cur(5000000)}`,
        zone: "Zona Río",
        lastContactLabel: "hace 2 horas",
        recommendedAction: "Agendar visita a sala de ventas esta semana",
      },
      {
        id: "lead-3",
        name: "Fernanda Aguirre",
        type: "Inversionista",
        score: 88,
        budgetLabel: `${cur(4000000)} – ${cur(7000000)}`,
        zone: "Cumbres",
        lastContactLabel: "hace 4 horas",
        recommendedAction: "Compartir brochure y tabla de precios",
      },
      {
        id: "lead-4",
        name: "Andrés Castro",
        type: "Comprador",
        score: 84,
        budgetLabel: `Hasta ${cur(9500000)}`,
        zone: "Polanco",
        lastContactLabel: "hace 12 horas",
        recommendedAction: "Llamar para feedback post-visita",
      },
      {
        id: "lead-5",
        name: "Roberto Gómez",
        type: "Comprador",
        score: 82,
        budgetLabel: `${cur(8000000)} – ${cur(13000000)}`,
        zone: "Playa Hermosa",
        lastContactLabel: "hace 1 día",
        recommendedAction: "Enviar 3 propiedades similares por WhatsApp",
      },
    ],
    pipeline: {
      stages: [
        { id: "s3", name: "Calificado", count: 1, value: 12500000 },
        { id: "s4", name: "Buscando propiedad", count: 2, value: 11550000 },
        { id: "s5", name: "Visita agendada", count: 1, value: 8900000 },
        { id: "s6", name: "Visita realizada", count: 1, value: 8900000 },
        { id: "s7", name: "Oferta / negociación", count: 1, value: 3200000 },
      ],
      totalValue,
      weightedForecast,
      openCount: 6,
    },
    conversations: [
      {
        id: "conv-1",
        contactName: "Patricia Núñez",
        channel: "whatsapp",
        status: "needs_attention",
        snippet: "Sí por favor, y también las formas de pago disponibles.",
        lastMessageLabel: "hace 20 minutos",
        unreadCount: 2,
        priority: "high",
      },
      {
        id: "conv-2",
        contactName: "Roberto Gómez",
        channel: "whatsapp",
        status: "open",
        snippet: "Me encantó la casa de Ensenada. ¿Tienen más fotos del interior?",
        lastMessageLabel: "hace 1 día",
        unreadCount: 0,
        priority: "normal",
      },
      {
        id: "conv-3",
        contactName: "Luis Fernández",
        channel: "email",
        status: "waiting_customer",
        snippet: "Confirmamos tu visita al depto de Polanco el viernes a las 5pm.",
        lastMessageLabel: "hace 5 horas",
        unreadCount: 0,
        priority: "normal",
      },
    ],
    visits: [
      {
        id: "visit-1",
        contactName: "Roberto Gómez",
        propertyTitle: "Casa frente al mar en Ensenada",
        dayLabel: "mañana",
        timeLabel: "10:00 a.m.",
        status: "pending",
        locationLabel: "Playa Hermosa, Ensenada",
        mapsQuery: "31.8512,-116.6312",
      },
      {
        id: "visit-2",
        contactName: "Luis Fernández",
        propertyTitle: "Departamento en Polanco CDMX",
        dayLabel: "en 3 días",
        timeLabel: "5:00 p.m.",
        status: "confirmed",
        locationLabel: "Polanco, Ciudad de México",
        mapsQuery: "19.4326,-99.1956",
      },
      {
        id: "visit-3",
        contactName: "Patricia Núñez",
        propertyTitle: "Preventa Torre Altitude Tijuana",
        dayLabel: "en 4 días",
        timeLabel: "12:00 p.m.",
        status: "confirmed",
        locationLabel: "Zona Río, Tijuana",
        mapsQuery: "32.5149,-117.0382",
      },
    ],
    propertyPerformance: [
      { id: "p1", title: "Preventa Torre Altitude Tijuana", type: "presale", status: "available", priceLabel: cur(4750000), interest: 4 },
      { id: "p2", title: "Casa frente al mar en Ensenada", type: "house", status: "available", priceLabel: cur(12500000), interest: 3 },
      { id: "p3", title: "Departamento en Polanco CDMX", type: "apartment", status: "available", priceLabel: cur(8900000), interest: 3 },
      { id: "p4", title: "Desarrollo Residencial Cumbres Monterrey", type: "development", status: "available", priceLabel: cur(6800000), interest: 2 },
      { id: "p5", title: "Terreno en Valle de Guadalupe", type: "land", status: "available", priceLabel: cur(3200000), interest: 1 },
    ],
    insights: buildInsights({
      staleLeadsCount: 2,
      needsAttentionCount: 1,
      overdueCount: 1,
      weightedForecast,
      forecastLabel: cur(weightedForecast),
      topSourceCount: 3,
    }),
  };
}
