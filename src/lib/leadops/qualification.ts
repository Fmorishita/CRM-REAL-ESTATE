/**
 * Legacy Capital pre-qualification: the five questions of the "Agenda tu cita"
 * form (puntapacifico.vercel.app). One catalog shared by the web form intake,
 * the WhatsApp keyword extractor, the AI extractor, the lead card and metrics,
 * so every channel stores the same keys and the same option values.
 *
 * Pure module (no I/O): unit-tested.
 */

export interface QualificationOption {
  value: string;
  label: string;
  /** Lower-case, accent-free phrases that imply this option in free text. */
  aliases: string[];
}

export interface QualificationQuestion {
  key: string;
  /** Short label for chips/columns. */
  label: string;
  /** Question as asked to the customer. */
  question: string;
  /** Max options a lead can hold (purpose allows 2). */
  max: number;
  options: QualificationOption[];
}

export const QUALIFICATION_QUESTIONS = [
  {
    key: "bedrooms",
    label: "Recámaras",
    question: "¿Buscas casa de 2 o 3 recámaras?",
    max: 1,
    options: [
      { value: "2", label: "2 recámaras", aliases: ["2 recamaras", "dos recamaras", "2 habitaciones", "dos habitaciones", "2 cuartos", "dos cuartos", "2 rec"] },
      { value: "3", label: "3 recámaras", aliases: ["3 recamaras", "tres recamaras", "3 habitaciones", "tres habitaciones", "3 cuartos", "tres cuartos", "3 rec"] },
    ],
  },
  {
    key: "purpose",
    label: "Propósito",
    question: "Propósito de la casa (elige hasta 2)",
    max: 2,
    options: [
      { value: "own_use", label: "Uso propio", aliases: ["uso propio", "para vivir", "vivir ahi", "vivir alli", "para mi familia", "para habitar", "mudarme", "casa propia"] },
      { value: "investment", label: "Inversión", aliases: ["inversion", "invertir", "para rentar", "rentarla", "airbnb", "plusvalia", "renta vacacional"] },
      { value: "retirement", label: "Retiro", aliases: ["retiro", "retirarme", "jubilacion", "jubilarme", "pensionado"] },
    ],
  },
  {
    key: "financing",
    label: "Forma de pago",
    question: "¿Cómo la vas a adquirir?",
    max: 1,
    options: [
      { value: "both", label: "Ambos", aliases: ["ambos", "las dos", "credito y capital", "parte credito", "enganche y credito", "mitad credito"] },
      { value: "mortgage", label: "Crédito hipotecario", aliases: ["credito hipotecario", "hipoteca", "hipotecario", "infonavit", "fovissste", "credito bancario", "con credito", "financiamiento"] },
      { value: "own_capital", label: "Capital propio", aliases: ["capital propio", "contado", "de contado", "recursos propios", "efectivo", "cash", "sin credito"] },
    ],
  },
  {
    key: "timeline",
    label: "Plazo",
    question: "¿En qué plazo te interesa adquirir?",
    max: 1,
    options: [
      { value: "immediate", label: "De inmediato", aliases: ["de inmediato", "inmediato", "ya mismo", "lo antes posible", "cuanto antes", "este mes", "urgente"] },
      { value: "1_3m", label: "1-3 meses", aliases: ["1-3 meses", "1 a 3 meses", "uno a tres meses", "1 y 3 meses", "en un par de meses", "en 2 meses", "en dos meses"] },
      { value: "3_6m", label: "3-6 meses", aliases: ["3-6 meses", "3 a 6 meses", "tres a seis meses", "3 y 6 meses", "medio ano", "en 4 meses", "en 5 meses"] },
      { value: "6m_plus", label: "+6 meses", aliases: ["+6 meses", "mas de 6 meses", "mas de seis meses", "el proximo ano", "el otro ano", "a largo plazo", "en un ano"] },
    ],
  },
  {
    key: "contact_preference",
    label: "Contacto",
    question: "¿Cómo prefieres que te contacte?",
    max: 1,
    options: [
      { value: "in_person", label: "Visita en físico", aliases: ["visita en fisico", "visita fisica", "en persona", "conocer el lugar", "ir a ver", "visitar", "presencial"] },
      { value: "video_call", label: "Videollamada", aliases: ["videollamada", "video llamada", "zoom", "meet", "por video"] },
      { value: "whatsapp", label: "WhatsApp", aliases: ["por whatsapp", "por este medio", "por mensaje", "por chat"] },
      { value: "email", label: "Email", aliases: ["email", "correo", "e-mail", "mail"] },
    ],
  },
] as const satisfies readonly QualificationQuestion[];

export type QualificationKey = (typeof QUALIFICATION_QUESTIONS)[number]["key"];

export const QUALIFICATION_KEYS = QUALIFICATION_QUESTIONS.map((q) => q.key) as QualificationKey[];

const BY_KEY = new Map<string, QualificationQuestion>(QUALIFICATION_QUESTIONS.map((q) => [q.key, q]));

export function getQuestion(key: string): QualificationQuestion | undefined {
  return BY_KEY.get(key);
}

/** Multi-value facts are stored as a comma-separated list of option values. */
export function parseFactValue(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Validates and canonicalizes option values for a key; null when nothing valid remains. */
export function normalizeFactValue(key: string, values: string[]): string | null {
  const q = BY_KEY.get(key);
  if (!q) return null;
  const allowed = new Set(q.options.map((o) => o.value));
  // Keep catalog order so "investment,own_use" and "own_use,investment" are equal.
  const picked = q.options.map((o) => o.value).filter((v) => values.includes(v) && allowed.has(v));
  if (picked.length === 0) return null;
  return picked.slice(0, q.max).join(",");
}

/** Human label of a stored value ("own_use,investment" → "Uso propio, Inversión"). */
export function factValueLabel(key: string, value: string | null | undefined): string {
  const q = BY_KEY.get(key);
  if (!q || !value) return value ?? "";
  return parseFactValue(value)
    .map((v) => q.options.find((o) => o.value === v)?.label ?? v)
    .join(", ");
}

/** Lower-case, strips accents and collapses whitespace so aliases match free text. */
export function foldText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(haystack: string, phrase: string): boolean {
  // Word boundaries on both sides, so "mail" does not match inside "email…" twice
  // and "rec" does not match "recibir".
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(haystack);
}

const NUMBER_WORDS: Record<string, string> = { una: "1", uno: "1", dos: "2", tres: "3", cuatro: "4", cinco: "5" };

/**
 * "3 recámaras" → "3". Lists such as "2 o 3 recámaras" are ambiguous → null.
 * Only 2 and 3 exist in the catalog; other counts are not stored.
 */
function extractBedrooms(folded: string): string | null {
  const re = /((?:\b(?:\d+|una|uno|dos|tres|cuatro|cinco)\b\s*(?:o|y|a|-|,)?\s*)+)(?:recamaras?|habitacion(?:es)?|cuartos?|rec\b)/g;
  const found = new Set<string>();
  for (const m of folded.matchAll(re)) {
    for (const token of m[1]!.match(/\d+|una|uno|dos|tres|cuatro|cinco/g) ?? []) {
      found.add(NUMBER_WORDS[token] ?? token);
    }
  }
  if (found.size !== 1) return null;
  const [n] = [...found];
  return n === "2" || n === "3" ? n : null;
}

/**
 * Deterministic, free extractor for customer messages. Only matches explicit
 * phrases; anything ambiguous is left for the advisor or the AI extractor.
 * Returns canonical values per key (already normalized).
 */
export function extractFactsFromText(text: string): Partial<Record<QualificationKey, string>> {
  const t = foldText(text);
  if (!t) return {};
  const out: Partial<Record<QualificationKey, string>> = {};
  for (const q of QUALIFICATION_QUESTIONS) {
    if (q.key === "bedrooms") {
      const bedrooms = extractBedrooms(t);
      if (bedrooms) out.bedrooms = bedrooms;
      continue;
    }
    const hits: string[] = [];
    for (const o of q.options) {
      if (o.aliases.some((a) => containsPhrase(t, a))) hits.push(o.value);
    }
    if (hits.length === 0) continue;
    // Single-choice question with conflicting hits ("2 o 3 recámaras") stays unknown.
    if (q.max === 1 && hits.length > 1) {
      // "Ambos" is itself an answer for financing; anything else is ambiguous.
      if (q.key === "financing" && hits.includes("both")) out.financing = "both";
      continue;
    }
    const normalized = normalizeFactValue(q.key, hits);
    if (normalized) out[q.key as QualificationKey] = normalized;
  }
  return out;
}

export type LeadTemperature = "hot" | "warm" | "cold" | "unknown";

/**
 * Temperature from the answers alone (not stars, not stage):
 * - hot: buys now or within 3 months AND wants a visit or a video call.
 * - warm: buys within 6 months, or within 3 months but prefers chat/email.
 * - cold: more than 6 months.
 */
export function leadTemperature(facts: Record<string, string | undefined>): LeadTemperature {
  const timeline = facts.timeline;
  if (!timeline) return "unknown";
  if (timeline === "6m_plus") return "cold";
  const soon = timeline === "immediate" || timeline === "1_3m";
  const meeting = facts.contact_preference === "in_person" || facts.contact_preference === "video_call";
  if (soon && meeting) return "hot";
  return "warm";
}

export const TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  hot: "Caliente",
  warm: "Tibio",
  cold: "Frío",
  unknown: "Sin dato",
};

/** True when the lead asked to meet (visit or video call) — counts as "pidió cita". */
export function wantsMeeting(facts: Record<string, string | undefined>): boolean {
  return facts.contact_preference === "in_person" || facts.contact_preference === "video_call";
}

/**
 * Default "lead calificado" rule reported to Meta as QualifiedLead:
 * 4+ of the 5 answers, or 3+ human stars. Marking it by hand also counts.
 */
export function isQualified(input: { answered: number; stars: number | null }): boolean {
  return input.answered >= 4 || (input.stars ?? 0) >= 3;
}

/**
 * Parses the AI extractor's JSON answer. Only catalog keys and option values
 * survive; prose around the JSON, unknown keys and invented values are dropped.
 */
export function parseAiFacts(text: string): Partial<Record<QualificationKey, string>> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return {};
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return {};
  }
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<QualificationKey, string>> = {};
  for (const key of QUALIFICATION_KEYS) {
    const v = (raw as Record<string, unknown>)[key];
    const values = Array.isArray(v) ? v.map(String) : typeof v === "string" ? parseFactValue(v) : [];
    const normalized = normalizeFactValue(key, values);
    if (normalized) out[key] = normalized;
  }
  return out;
}
