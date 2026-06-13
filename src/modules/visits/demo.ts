import type { TenantContext } from "@/lib/auth/types";
import { formatDayMonth, formatTime } from "@/lib/format";
import type { VisitFilters, VisitFormOptions, VisitView } from "@/modules/visits/types";

interface DemoVisit {
  id: string;
  contactId: string;
  contactName: string;
  propertyId: string;
  propertyTitle: string;
  agentName: string;
  hour: number;
  minute: number;
  duration: number;
  status: string;
  location: string;
  lat: number;
  lng: number;
  notes?: string;
}

// A coherent northbound Baja route: Ensenada → Valle de Guadalupe → Tijuana.
const DEMO_VISITS: DemoVisit[] = [
  { id: "db000000-0000-4000-8000-000000000002", contactId: "d4000000-0000-4000-8000-000000000001", contactName: "Roberto Gómez", propertyId: "b2000000-0000-4000-8000-000000000001", propertyTitle: "Casa frente al mar en Ensenada", agentName: "Carlos Mendoza", hour: 10, minute: 0, duration: 90, status: "confirmed", location: "Playa Hermosa, Ensenada", lat: 31.8512, lng: -116.6312, notes: "Mostrar acceso a playa privada." },
  { id: "db000000-0000-4000-8000-000000000005", contactId: "d4000000-0000-4000-8000-000000000005", contactName: "Eduardo Villarreal", propertyId: "b2000000-0000-4000-8000-000000000003", propertyTitle: "Terreno en Valle de Guadalupe", agentName: "Carlos Mendoza", hour: 13, minute: 0, duration: 60, status: "confirmed", location: "San Antonio de las Minas, Ensenada", lat: 32.0738, lng: -116.5961, notes: "Llevar plano del terreno." },
  { id: "db000000-0000-4000-8000-000000000004", contactId: "d4000000-0000-4000-8000-000000000002", contactName: "Patricia Núñez", propertyId: "b2000000-0000-4000-8000-000000000004", propertyTitle: "Preventa Torre Altitude Tijuana", agentName: "Mariana López", hour: 16, minute: 0, duration: 45, status: "pending", location: "Zona Río, Tijuana", lat: 32.5149, lng: -117.0382, notes: "Visita a sala de ventas." },
];

function toView(ctx: TenantContext, v: DemoVisit): VisitView {
  const locale = ctx.organization.defaultLocale;
  const tz = ctx.organization.timezone;
  const date = new Date();
  date.setHours(v.hour, v.minute, 0, 0);
  return {
    id: v.id,
    contactId: v.contactId,
    contactName: v.contactName,
    propertyId: v.propertyId,
    propertyTitle: v.propertyTitle,
    agentName: v.agentName,
    scheduledAtIso: date.toISOString(),
    dayLabel: formatDayMonth(date, locale, tz),
    timeLabel: formatTime(date, locale, tz),
    durationMin: v.duration,
    status: v.status,
    notes: v.notes ?? null,
    feedback: null,
    locationLabel: v.location,
    lat: v.lat,
    lng: v.lng,
    mapsQuery: `${v.lat},${v.lng}`,
  };
}

function isToday(dateStr?: string): boolean {
  if (!dateStr) return true;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return dateStr === `${y}-${m}-${d}`;
}

export function demoVisits(ctx: TenantContext, filters: VisitFilters = {}): VisitView[] {
  if (!isToday(filters.date)) return [];
  return DEMO_VISITS.map((v) => toView(ctx, v)).sort((a, b) => a.scheduledAtIso.localeCompare(b.scheduledAtIso));
}

export const DEMO_VISIT_FORM_OPTIONS: VisitFormOptions = {
  contacts: [
    { id: "d4000000-0000-4000-8000-000000000001", name: "Roberto Gómez" },
    { id: "d4000000-0000-4000-8000-000000000002", name: "Patricia Núñez" },
    { id: "d4000000-0000-4000-8000-000000000005", name: "Eduardo Villarreal" },
  ],
  properties: [
    { id: "b2000000-0000-4000-8000-000000000001", title: "Casa frente al mar en Ensenada" },
    { id: "b2000000-0000-4000-8000-000000000003", title: "Terreno en Valle de Guadalupe" },
    { id: "b2000000-0000-4000-8000-000000000004", title: "Preventa Torre Altitude Tijuana" },
  ],
  members: [
    { id: "m-carlos", name: "Carlos Mendoza" },
    { id: "m-mariana", name: "Mariana López" },
  ],
};
