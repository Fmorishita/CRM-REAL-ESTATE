import { QUALIFICATION_QUESTIONS, isQualified, leadTemperature } from "@/lib/leadops/qualification";
import type { LeadRow } from "@/modules/leadops/server/queries";

/**
 * Deterministic demo dataset for /leads (demo mode only): Legacy Capital's three
 * live ads, mixed answers, so every metric and filter can be explored. Spend is
 * illustrative, not real account data.
 */
const ADS = [
  { adId: "demo-ad-a", adName: "A — California" },
  { adId: "demo-ad-b", adName: "B — Doctor" },
  { adId: "demo-ad-c", adName: "C — Empresario" },
];

const NAMES = [
  "Mariana Ruiz", "Jorge Salinas", "Andrea Castillo", "Luis Ortega", "Paola Méndez", "Ricardo Vega",
  "Daniela Flores", "Héctor Ramírez", "Gabriela Soto", "Fernando Ibarra", "Claudia Navarro", "Miguel Ángel Torres",
  "Sofía Aguilar", "Raúl Domínguez",
];
const ADVISORS = ["Carlos Mendoza", "Mariana López"];

/** Picks option values by a fixed pattern (no randomness: stable renders). */
function answersFor(i: number): Record<string, string> {
  const facts: Record<string, string> = {};
  const answered = [5, 3, 5, 1, 4, 2, 5, 0, 4, 3, 5, 2, 1, 4][i % 14]!;
  QUALIFICATION_QUESTIONS.slice(0, answered).forEach((q, qi) => {
    const o = q.options[(i + qi * 2) % q.options.length]!;
    facts[q.key] = o.value;
  });
  if (facts.purpose && i % 4 === 0) facts.purpose = "own_use,investment";
  // A few leads ready to buy and asking to meet ("calientes").
  if (answered === 5 && i % 3 !== 1) {
    facts.timeline = i % 2 ? "immediate" : "1_3m";
    facts.contact_preference = i % 4 ? "video_call" : "in_person";
  }
  return facts;
}

export function buildDemoLeadOps(now: Date = new Date()): {
  leads: LeadRow[];
  spend: { adId: string; adName: string; spend: number; currency: string }[];
  capi: { sent: number; skipped: number; failed: number };
} {
  const leads: LeadRow[] = NAMES.map((name, i) => {
    const facts = answersFor(i);
    const answered = Object.keys(facts).length;
    const stars = i % 3 === 0 ? 4 : i % 5 === 0 ? 2 : null;
    const ad = i % 5 === 4 ? null : ADS[i % ADS.length]!;
    const hoursAgo = 2 + i * 7;
    const lastInboundAt = new Date(now.getTime() - hoursAgo * 3_600_000);
    return {
      id: `demo-lead-${i + 1}`,
      name,
      whatsappName: name.split(" ")[0] ?? null,
      phone: `52646${String(3000000 + i * 1371).padStart(7, "0")}`,
      origin: ad ? "ctwa_ad" : i % 2 ? "web_form" : "organic_whatsapp",
      adName: ad?.adName ?? null,
      adId: ad?.adId ?? null,
      facts,
      factsCompleted: answered,
      temperature: leadTemperature(facts),
      qualified: isQualified({ answered, stars }),
      stars,
      subStage: answered >= 4 ? "Visita por agendar" : answered > 0 ? "Precalificando" : null,
      outcome: i === 6 ? "won" : i === 11 ? "lost" : "open",
      assignee: i === 9 ? null : ADVISORS[i % 2]!,
      botEnabled: i % 3 !== 0,
      reactEnabled: true,
      windowOpen: hoursAgo < 24,
      attention: i === 0 || i === 4,
      blocked: false,
      archived: false,
      conversationId: null,
      lastInboundAt,
      createdAt: new Date(lastInboundAt.getTime() - 3_600_000),
    };
  });
  return {
    leads,
    spend: [
      { ...ADS[0]!, spend: 1240, currency: "MXN" },
      { ...ADS[1]!, spend: 860, currency: "MXN" },
      { ...ADS[2]!, spend: 1015, currency: "MXN" },
    ],
    capi: { sent: 0, skipped: 14, failed: 0 },
  };
}
