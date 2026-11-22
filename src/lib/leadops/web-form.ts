/**
 * Maps a lead from the Punta Pacífico website form ("Agenda tu cita") into the
 * CRM's pre-qualification answers. Accepts the row of the website's `leads`
 * table (Supabase database webhook: { type, table, record }) or a flat JSON
 * body, and tolerates both stored codes ("3R", "0-3", "credito", "presencial")
 * and visible labels ("3 recámaras", "1-3 meses", "Crédito hipotecario").
 *
 * Pure module: unit-tested.
 */

import { foldText, normalizeFactValue, type QualificationKey } from "@/lib/leadops/qualification";
import { normalizePhone } from "@/lib/leadops/rules";

export interface WebFormLead {
  name: string | null;
  phone: string | null;
  email: string | null;
  facts: Partial<Record<QualificationKey, string>>;
  visitDate: string | null;
  utm: Record<string, string>;
  fbclid: string | null;
  gclid: string | null;
  page: string | null;
  origin: string | null;
  externalId: string | null;
}

type Row = Record<string, unknown>;

const s = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : typeof v === "number" ? String(v) : null);

/** First non-empty value among several possible column names. */
function pick(row: Row, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (Array.isArray(v)) {
      const joined = v.map(s).filter(Boolean).join(",");
      if (joined) return joined;
    }
    const value = s(v);
    if (value) return value;
  }
  return null;
}

const SYNONYMS: Record<QualificationKey, [RegExp, string][]> = {
  bedrooms: [
    [/^2\s*r?$|^2r$|\b2 (recamaras|habitaciones|rec)\b|\bdos recamaras\b/, "2"],
    [/^3\s*r?$|^3r$|\b3 (recamaras|habitaciones|rec)\b|\btres recamaras\b/, "3"],
  ],
  purpose: [
    [/uso propio|uso_propio|propio|vivir|habitar|segunda casa|segunda_casa|familia/, "own_use"],
    [/inversion|invertir|renta|rentar|airbnb|plusvalia/, "investment"],
    [/retiro|jubil/, "retirement"],
  ],
  financing: [
    [/ambos|mixto|combinado/, "both"],
    [/credito|hipotec|infonavit|fovissste|financiamiento|bancario/, "mortgage"],
    [/capital|contado|propios|efectivo|cash/, "own_capital"],
  ],
  timeline: [
    [/inmediato|\bya\b|ahora|^0$/, "immediate"],
    [/^0-3$|^1-3$|1 ?a ?3|1-3 meses|0-3 meses/, "1_3m"],
    [/^3-6$|3 ?a ?6|3-6 meses/, "3_6m"],
    [/6\+|\+6|mas de 6|mas_6|6-12|12\+|^6m/, "6m_plus"],
  ],
  contact_preference: [
    [/presencial|fisic|en persona|visita/, "in_person"],
    [/video|zoom|meet/, "video_call"],
    [/whats/, "whatsapp"],
    [/email|correo|mail/, "email"],
  ],
};

function mapValue(key: QualificationKey, raw: string | null): string | null {
  if (!raw) return null;
  const hits: string[] = [];
  for (const part of raw.split(/[,;|/]/)) {
    const t = foldText(part).replace(/_/g, " ").trim();
    if (!t) continue;
    for (const [re, value] of SYNONYMS[key]) {
      // Codes keep their underscores for exact patterns such as "segunda_casa".
      if (re.test(t) || re.test(foldText(part))) {
        hits.push(value);
        break;
      }
    }
  }
  return normalizeFactValue(key, hits);
}

/** Extracts the lead from a Supabase webhook envelope or a flat body. */
export function unwrapWebFormBody(body: unknown): Row | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Row;
  if (b.record && typeof b.record === "object") {
    // Supabase database webhook: only new rows (or updates that add answers).
    if (b.type && b.type !== "INSERT" && b.type !== "UPDATE") return null;
    return b.record as Row;
  }
  return b;
}

export function mapWebFormLead(row: Row): WebFormLead {
  // The website stores bedrooms in `interes` ("3R") and purpose in `uso`/`interes`.
  const interes = pick(row, "interes");
  const bedroomsRaw = pick(row, "recamaras", "bedrooms") ?? (interes && /^\s*[23]\s*r?\s*$/i.test(interes) ? interes : null);
  const purposeRaw =
    pick(row, "proposito", "purpose", "uso") ?? (interes && !/^\s*[23]\s*r?\s*$/i.test(interes) ? interes : null);

  const facts: Partial<Record<QualificationKey, string>> = {};
  const set = (key: QualificationKey, raw: string | null) => {
    const v = mapValue(key, raw);
    if (v) facts[key] = v;
  };
  set("bedrooms", bedroomsRaw);
  set("purpose", purposeRaw);
  set("financing", pick(row, "forma_pago", "esquema_pago", "financing", "adquisicion"));
  set("timeline", pick(row, "horizonte_compra", "plazo", "timeline"));
  set("contact_preference", pick(row, "modo_visita", "contacto_preferido", "contact_preference"));

  const utm: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = pick(row, k);
    if (v) utm[k] = v;
  }

  return {
    name: pick(row, "nombre", "name", "full_name"),
    phone: normalizePhone(pick(row, "telefono", "phone", "whatsapp")),
    email: pick(row, "email", "correo")?.toLowerCase() ?? null,
    facts,
    visitDate: pick(row, "fecha_visita", "visit_date"),
    utm,
    fbclid: pick(row, "fbclid"),
    gclid: pick(row, "gclid"),
    page: pick(row, "pagina", "page", "source_url"),
    origin: pick(row, "origen", "origin"),
    externalId: pick(row, "id"),
  };
}

/**
 * Mexican numbers arrive as 10 digits (form), 52 + 10 or 521 + 10 (WhatsApp).
 * Returns every spelling so one person is matched across channels.
 */
export function phoneVariants(digits: string | null): string[] {
  if (!digits) return [];
  const local =
    digits.length === 10 ? digits : digits.startsWith("521") && digits.length === 13 ? digits.slice(3) : digits.startsWith("52") && digits.length === 12 ? digits.slice(2) : null;
  if (!local) return [digits];
  return [`52${local}`, `521${local}`, local];
}
