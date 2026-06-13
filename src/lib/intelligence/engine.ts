export interface IntelSignals {
  lastContactAt: Date | null;
  stage: string;
  hasBudget: boolean;
  sourceKind: string | null;
  conversations: number;
  unresponded: number;
  visits: number;
  visitsDone: number;
  favorites: number;
  urgency: "low" | "medium" | "high" | null;
  whatsapp: boolean;
}

export interface IntelFactor {
  label: string;
  impact: "positive" | "negative" | "neutral";
}

export interface Intelligence {
  leadScore: number;
  dealScore: number;
  closeProbability: number;
  risk: "low" | "medium" | "high";
  riskLabel: string;
  nextBestAction: string;
  bestChannel: string;
  bestTime: string;
  factors: IntelFactor[];
}

const STAGE_PROBABILITY: Record<string, number> = {
  new: 5,
  contacted: 15,
  qualified: 30,
  searching: 40,
  visit_scheduled: 55,
  visit_done: 65,
  negotiation: 80,
  documentation: 90,
  closing: 95,
  won: 100,
  lost: 0,
};

const SOURCE_QUALITY: Record<string, number> = {
  referral: 15,
  walk_in: 12,
  landing: 10,
  portal: 8,
  google: 8,
  facebook: 5,
  other: 4,
};

function daysSince(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / (24 * 3600 * 1000));
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Computes lead/deal scores, abandonment risk and the next best action. */
export function computeIntelligence(signals: IntelSignals): Intelligence {
  const factors: IntelFactor[] = [];
  const days = daysSince(signals.lastContactAt);

  // ── Lead score ──────────────────────────────────────────────────────────────
  let lead = 25;
  if (signals.hasBudget) {
    lead += 15;
    factors.push({ label: "Presupuesto definido", impact: "positive" });
  }
  const sourceBoost = signals.sourceKind ? (SOURCE_QUALITY[signals.sourceKind] ?? 4) : 4;
  lead += sourceBoost;
  if (sourceBoost >= 12) factors.push({ label: "Fuente de alta calidad", impact: "positive" });

  lead += Math.min(15, signals.conversations * 3);
  if (signals.conversations >= 3) factors.push({ label: "Conversación activa", impact: "positive" });

  lead += Math.min(20, signals.visits * 10);
  if (signals.visits > 0) factors.push({ label: `${signals.visits} visita(s)`, impact: "positive" });

  lead += Math.min(10, signals.favorites * 5);
  if (signals.favorites > 0) factors.push({ label: "Propiedades favoritas", impact: "positive" });

  if (days != null) {
    if (days <= 2) {
      lead += 12;
      factors.push({ label: "Contacto reciente", impact: "positive" });
    } else if (days <= 7) {
      lead += 4;
    } else if (days > 14) {
      lead -= 12;
      factors.push({ label: `${days} días sin contacto`, impact: "negative" });
    } else {
      factors.push({ label: `${days} días sin contacto`, impact: "neutral" });
    }
  }

  if (signals.urgency === "high") {
    lead += 10;
    factors.push({ label: "Urgencia alta", impact: "positive" });
  } else if (signals.urgency === "medium") {
    lead += 5;
  }

  if (signals.unresponded > 0) {
    factors.push({ label: "Mensaje sin responder", impact: "negative" });
  }

  const leadScore = clamp(lead);

  // ── Deal score (stage-weighted + lead engagement) ────────────────────────────
  const stageProb = STAGE_PROBABILITY[signals.stage] ?? 20;
  const dealScore = clamp(stageProb * 0.55 + leadScore * 0.45);
  const closeProbability = clamp((stageProb + dealScore) / 2);

  // ── Risk ──────────────────────────────────────────────────────────────────
  let risk: Intelligence["risk"] = "low";
  const terminal = signals.stage === "won" || signals.stage === "lost";
  if (!terminal) {
    if ((days != null && days > 14) || (signals.unresponded > 0 && days != null && days > 5)) risk = "high";
    else if ((days != null && days > 7) || signals.unresponded > 0) risk = "medium";
  }
  const riskLabel = risk === "high" ? "Alto riesgo de abandono" : risk === "medium" ? "Riesgo medio" : "Bajo riesgo";

  // ── Next best action ─────────────────────────────────────────────────────────
  let nextBestAction: string;
  if (signals.unresponded > 0) {
    nextBestAction = "Responder la conversación pendiente hoy mismo.";
  } else if (days != null && days > 7 && !terminal) {
    nextBestAction = `Recontactar: lleva ${days} días sin seguimiento.`;
  } else if (signals.stage === "negotiation") {
    nextBestAction = "Enviar propuesta/contrato y cerrar términos.";
  } else if (signals.stage === "visit_done") {
    nextBestAction = "Llamar para feedback post-visita y avanzar a negociación.";
  } else if ((signals.stage === "searching" || signals.stage === "qualified") && signals.favorites >= 0) {
    nextBestAction = "Enviar 3 propiedades recomendadas y agendar una visita.";
  } else if (signals.stage === "visit_scheduled") {
    nextBestAction = "Confirmar la visita y preparar opciones de respaldo.";
  } else {
    nextBestAction = "Dar seguimiento y agendar la próxima interacción.";
  }

  const bestChannel = signals.whatsapp ? "WhatsApp" : "Email";
  const bestTime = signals.urgency === "high" ? "Hoy por la tarde" : days != null && days > 7 ? "Hoy" : "Esta semana";

  return {
    leadScore,
    dealScore,
    closeProbability,
    risk,
    riskLabel,
    nextBestAction,
    bestChannel,
    bestTime,
    factors: factors.slice(0, 6),
  };
}
