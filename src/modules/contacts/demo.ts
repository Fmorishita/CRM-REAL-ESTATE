import type { TenantContext } from "@/lib/auth/types";
import { contactTypeLabel } from "@/config/stages";
import { formatCurrency } from "@/lib/format";
import type {
  ContactDetail,
  ContactFormOptions,
  ContactListItem,
} from "@/modules/contacts/types";

interface DemoSeed {
  id: string;
  first: string;
  last: string;
  type: string;
  email: string;
  phone: string;
  stage: string;
  score: number;
  assigned: string;
  lastDays: number;
  budget: [number, number] | null;
  zone: string | null;
  tags: { name: string; color: string }[];
}

const DEMO_SEEDS: DemoSeed[] = [
  { id: "d4000000-0000-4000-8000-000000000005", first: "Eduardo", last: "Villarreal", type: "investor", email: "eduardo.v@empresa.mx", phone: "+52 81 300 0005", stage: "negotiation", score: 95, assigned: "Carlos Mendoza", lastDays: 0, budget: [2500000, 4000000], zone: "San Antonio de las Minas", tags: [{ name: "Inversionista", color: "violet" }, { name: "VIP", color: "amber" }] },
  { id: "d4000000-0000-4000-8000-000000000002", first: "Patricia", last: "Núñez", type: "investor", email: "paty.nunez@outlook.com", phone: "+52 55 300 0002", stage: "searching", score: 91, assigned: "Mariana López", lastDays: 0, budget: [3000000, 5000000], zone: "Zona Río", tags: [{ name: "Inversionista", color: "violet" }] },
  { id: "d4000000-0000-4000-8000-000000000010", first: "Fernanda", last: "Aguirre", type: "investor", email: "fer.aguirre@gmail.com", phone: "+52 81 300 0010", stage: "searching", score: 88, assigned: "Carlos Mendoza", lastDays: 0, budget: [4000000, 7000000], zone: "Cumbres", tags: [{ name: "Inversionista", color: "violet" }] },
  { id: "d4000000-0000-4000-8000-000000000009", first: "Andrés", last: "Castro", type: "buyer", email: "andres.castro@gmail.com", phone: "+52 646 300 0009", stage: "visit_done", score: 84, assigned: "Mariana López", lastDays: 0, budget: null, zone: "Polanco", tags: [] },
  { id: "d4000000-0000-4000-8000-000000000001", first: "Roberto", last: "Gómez", type: "buyer", email: "roberto.gomez@gmail.com", phone: "+52 646 300 0001", stage: "qualified", score: 82, assigned: "Carlos Mendoza", lastDays: 1, budget: [8000000, 13000000], zone: "Playa Hermosa", tags: [{ name: "Urgente", color: "red" }] },
  { id: "d4000000-0000-4000-8000-000000000003", first: "Luis", last: "Fernández", type: "buyer", email: "luisfer@gmail.com", phone: "+52 664 300 0003", stage: "visit_scheduled", score: 75, assigned: "Mariana López", lastDays: 0, budget: [7000000, 9500000], zone: "Polanco", tags: [{ name: "Primera compra", color: "sky" }] },
  { id: "d4000000-0000-4000-8000-000000000008", first: "Carmen", last: "Ruiz", type: "seller", email: "carmen.ruiz@gmail.com", phone: "+52 664 300 0008", stage: "qualified", score: 70, assigned: "Carlos Mendoza", lastDays: 3, budget: null, zone: null, tags: [] },
  { id: "d4000000-0000-4000-8000-000000000006", first: "María", last: "Torres", type: "buyer", email: "maria.torres@gmail.com", phone: "+52 646 300 0006", stage: "contacted", score: 63, assigned: "Mariana López", lastDays: 1, budget: null, zone: null, tags: [] },
  { id: "d4000000-0000-4000-8000-000000000004", first: "Gabriela", last: "Sánchez", type: "buyer", email: "gaby.sanchez@gmail.com", phone: "+52 646 300 0004", stage: "new", score: 48, assigned: "Carlos Mendoza", lastDays: 8, budget: null, zone: null, tags: [] },
  { id: "d4000000-0000-4000-8000-000000000007", first: "Jorge", last: "Mendoza", type: "renter", email: "jorge.m@gmail.com", phone: "+52 55 300 0007", stage: "new", score: 38, assigned: "Mariana López", lastDays: 10, budget: null, zone: null, tags: [] },
];

function lastLabel(days: number): string {
  if (days === 0) return "hoy";
  if (days === 1) return "hace 1 día";
  return `hace ${days} días`;
}

export function demoContactList(ctx: TenantContext): ContactListItem[] {
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });
  return DEMO_SEEDS.map((s, i) => ({
    id: s.id,
    name: `${s.first} ${s.last}`,
    type: s.type,
    typeLabel: contactTypeLabel(s.type),
    email: s.email,
    phone: s.phone,
    whatsapp: s.phone,
    stage: s.stage,
    score: s.score,
    assignedName: s.assigned,
    lastContactLabel: lastLabel(s.lastDays),
    budgetLabel: s.budget ? `${cur(s.budget[0])} – ${cur(s.budget[1])}` : null,
    zone: s.zone,
    tags: s.tags.map((t, j) => ({ id: `tag-${i}-${j}`, name: t.name, color: t.color })),
  }));
}

export function demoContactDetail(ctx: TenantContext, id: string): ContactDetail | null {
  const item = demoContactList(ctx).find((c) => c.id === id);
  const seed = DEMO_SEEDS.find((s) => s.id === id);
  if (!item || !seed) return null;
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });
  return {
    ...item,
    createdAtLabel: "hace 2 días",
    nextFollowUpLabel: "mañana",
    closeProbability: Math.min(95, seed.score - 10),
    preference: seed.budget
      ? {
          budgetLabel: `${cur(seed.budget[0])} – ${cur(seed.budget[1])}`,
          zones: seed.zone ? [seed.zone] : [],
          propertyTypes: ["house", "apartment"],
          bedroomsMin: 2,
          bathroomsMin: 2,
          amenities: ["Alberca", "Seguridad 24/7"],
          purchaseReason: "Inversión / plusvalía",
          urgency: "high",
        }
      : null,
    notes: [],
    timeline: [
      { id: "t1", kind: "created", title: "Contacto creado", at: new Date().toISOString(), atLabel: "hace 2 días" },
      { id: "t2", kind: "opportunity", title: "Oportunidad abierta", detail: item.name, at: new Date().toISOString(), atLabel: "hace 1 día" },
    ],
    properties: [],
    openOpportunities: 1,
  };
}

export const DEMO_FORM_OPTIONS: ContactFormOptions = {
  leadSources: [
    { id: "ls-fb", name: "Facebook Lead Ads" },
    { id: "ls-google", name: "Google Ads" },
    { id: "ls-portal", name: "Inmuebles24" },
    { id: "ls-ref", name: "Referido" },
    { id: "ls-landing", name: "Landing Page" },
  ],
  members: [
    { id: "m-carlos", name: "Carlos Mendoza" },
    { id: "m-mariana", name: "Mariana López" },
    { id: "m-sofia", name: "Sofía Hernández" },
  ],
  tags: [
    { id: "tg-inv", name: "Inversionista", color: "violet" },
    { id: "tg-first", name: "Primera compra", color: "sky" },
    { id: "tg-urgent", name: "Urgente", color: "red" },
    { id: "tg-vip", name: "VIP", color: "amber" },
  ],
};
