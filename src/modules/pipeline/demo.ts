import type { TenantContext } from "@/lib/auth/types";
import { formatCurrency } from "@/lib/format";
import type {
  OpportunityCard,
  OpportunityFormOptions,
  OpportunityRow,
  PipelineBoard,
  PipelineColumn,
} from "@/modules/pipeline/types";

interface DemoOpp {
  id: string;
  title: string;
  stageKey: string;
  contact: string;
  property: string;
  amount: number;
  commission: number;
  probability: number;
  assigned: string;
  closeInDays: number;
  risk: "low" | "medium" | "high";
}

const DEMO_OPPS: DemoOpp[] = [
  { id: "f6000000-0000-4000-8000-000000000001", title: "Casa Ensenada - Roberto Gómez", stageKey: "qualified", contact: "Roberto Gómez", property: "Casa frente al mar en Ensenada", amount: 12500000, commission: 437500, probability: 45, assigned: "Carlos Mendoza", closeInDays: 30, risk: "medium" },
  { id: "f6000000-0000-4000-8000-000000000002", title: "Preventa Tijuana - Patricia Núñez", stageKey: "searching", contact: "Patricia Núñez", property: "Preventa Torre Altitude Tijuana", amount: 4750000, commission: 190000, probability: 60, assigned: "Mariana López", closeInDays: 20, risk: "low" },
  { id: "f6000000-0000-4000-8000-000000000006", title: "Desarrollo Cumbres - Fernanda Aguirre", stageKey: "searching", contact: "Fernanda Aguirre", property: "Desarrollo Residencial Cumbres Monterrey", amount: 6800000, commission: 238000, probability: 55, assigned: "Carlos Mendoza", closeInDays: 35, risk: "medium" },
  { id: "f6000000-0000-4000-8000-000000000003", title: "Depto Polanco - Luis Fernández", stageKey: "visit_scheduled", contact: "Luis Fernández", property: "Departamento en Polanco CDMX", amount: 8900000, commission: 267000, probability: 55, assigned: "Mariana López", closeInDays: 25, risk: "medium" },
  { id: "f6000000-0000-4000-8000-000000000005", title: "Depto Polanco - Andrés Castro", stageKey: "visit_done", contact: "Andrés Castro", property: "Departamento en Polanco CDMX", amount: 8900000, commission: 267000, probability: 70, assigned: "Mariana López", closeInDays: 18, risk: "low" },
  { id: "f6000000-0000-4000-8000-000000000004", title: "Terreno Valle - Eduardo Villarreal", stageKey: "negotiation", contact: "Eduardo Villarreal", property: "Terreno en Valle de Guadalupe", amount: 3200000, commission: 160000, probability: 80, assigned: "Carlos Mendoza", closeInDays: 10, risk: "low" },
];

const STAGES = [
  { key: "new", name: "Nuevo lead", probability: 5, isWon: false, isLost: false },
  { key: "contacted", name: "Contactado", probability: 15, isWon: false, isLost: false },
  { key: "qualified", name: "Calificado", probability: 30, isWon: false, isLost: false },
  { key: "searching", name: "Buscando propiedad", probability: 40, isWon: false, isLost: false },
  { key: "visit_scheduled", name: "Visita agendada", probability: 55, isWon: false, isLost: false },
  { key: "visit_done", name: "Visita realizada", probability: 65, isWon: false, isLost: false },
  { key: "negotiation", name: "Oferta / negociación", probability: 80, isWon: false, isLost: false },
  { key: "documentation", name: "Documentación", probability: 90, isWon: false, isLost: false },
  { key: "closing", name: "Cierre", probability: 95, isWon: false, isLost: false },
  { key: "won", name: "Ganado", probability: 100, isWon: true, isLost: false },
  { key: "lost", name: "Perdido", probability: 0, isWon: false, isLost: true },
];

function closeLabel(days: number): string {
  return days <= 0 ? "vencida" : `en ${days} días`;
}

export function demoPipelineBoard(ctx: TenantContext): PipelineBoard {
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });

  const columns: PipelineColumn[] = STAGES.map((stage) => {
    const opps = DEMO_OPPS.filter((o) => o.stageKey === stage.key);
    const total = opps.reduce((sum, o) => sum + o.amount, 0);
    const cards: OpportunityCard[] = opps.map((o) => ({
      id: o.id,
      title: o.title,
      stageId: `stage-${stage.key}`,
      contactId: "demo",
      contactName: o.contact,
      propertyTitle: o.property,
      amount: o.amount,
      amountLabel: cur(o.amount),
      commissionLabel: cur(o.commission),
      probability: o.probability,
      assignedName: o.assigned,
      closeDateLabel: closeLabel(o.closeInDays),
      aiRisk: o.risk,
    }));
    return {
      id: `stage-${stage.key}`,
      key: stage.key,
      name: stage.name,
      probability: stage.probability,
      isWon: stage.isWon,
      isLost: stage.isLost,
      totalValueLabel: cur(total),
      cards,
    };
  });

  const totalValue = DEMO_OPPS.reduce((s, o) => s + o.amount, 0);
  const weighted = DEMO_OPPS.reduce((s, o) => s + (o.amount * o.probability) / 100, 0);

  return {
    columns,
    summary: {
      openCount: DEMO_OPPS.length,
      totalValueLabel: cur(totalValue),
      weightedForecastLabel: cur(weighted),
      wonValueLabel: cur(0),
    },
    currency,
    locale,
  };
}

export function demoPipelineRows(ctx: TenantContext): OpportunityRow[] {
  const { defaultCurrency: currency, defaultLocale: locale } = ctx.organization;
  const cur = (n: number) => formatCurrency(n, currency, locale, { notation: "compact" });
  return DEMO_OPPS.map((o) => ({
    id: o.id,
    title: o.title,
    contactName: o.contact,
    contactId: "demo",
    propertyTitle: o.property,
    stageName: STAGES.find((s) => s.key === o.stageKey)?.name ?? o.stageKey,
    stageKey: o.stageKey,
    amountLabel: cur(o.amount),
    commissionLabel: cur(o.commission),
    probability: o.probability,
    assignedName: o.assigned,
    closeDateLabel: closeLabel(o.closeInDays),
  }));
}

export const DEMO_OPP_FORM_OPTIONS: OpportunityFormOptions = {
  pipelineId: "demo-pipeline",
  stages: STAGES.filter((s) => !s.isWon && !s.isLost).map((s) => ({ id: `stage-${s.key}`, name: s.name })),
  contacts: [
    { id: "c1", name: "Roberto Gómez" },
    { id: "c2", name: "Patricia Núñez" },
    { id: "c3", name: "Luis Fernández" },
    { id: "c4", name: "Eduardo Villarreal" },
  ],
  properties: [
    { id: "p1", title: "Casa frente al mar en Ensenada" },
    { id: "p2", title: "Departamento en Polanco CDMX" },
    { id: "p3", title: "Preventa Torre Altitude Tijuana" },
  ],
  members: [
    { id: "m1", name: "Carlos Mendoza" },
    { id: "m2", name: "Mariana López" },
  ],
  defaultCurrency: "MXN",
};
