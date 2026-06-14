import { propertyTypeLabel } from "@/config/properties";

export interface MatchPreference {
  budgetMin?: number | null;
  budgetMax?: number | null;
  zones: string[];
  propertyTypes: string[];
  bedroomsMin?: number | null;
  bathroomsMin?: number | null;
  amenities: string[];
  urgency?: "low" | "medium" | "high";
}

export interface MatchProperty {
  price: number;
  zone?: string | null;
  city?: string | null;
  propertyType: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  amenities: string[];
}

export interface MatchReason {
  text: string;
  positive: boolean;
}

export interface MatchScore {
  score: number;
  tier: "alta" | "media" | "baja";
  reasons: MatchReason[];
  objections: string[];
}

const lower = (s: string) => s.trim().toLowerCase();

/**
 * Deterministic compatibility score (0–100) between a client's preferences and a
 * property, with human-readable reasons and possible objections.
 * Weights: budget 30 · zone 20 · type 20 · amenities 15 · bedrooms 10 · bathrooms 5.
 */
export function computeMatch(pref: MatchPreference, property: MatchProperty): MatchScore {
  const reasons: MatchReason[] = [];
  const objections: string[] = [];
  let score = 0;

  // Budget (30)
  if (pref.budgetMax != null) {
    const min = pref.budgetMin ?? 0;
    if (property.price <= pref.budgetMax && property.price >= min * 0.9) {
      score += 30;
      reasons.push({ text: "Dentro del presupuesto", positive: true });
    } else if (property.price <= pref.budgetMax * 1.1) {
      score += 18;
      reasons.push({ text: "Ligeramente sobre el presupuesto", positive: true });
    } else {
      objections.push("Por encima del presupuesto del cliente");
    }
  } else {
    score += 18;
  }

  // Zone (20)
  if (pref.zones.length > 0) {
    const zones = pref.zones.map(lower);
    if (property.zone && zones.includes(lower(property.zone))) {
      score += 20;
      reasons.push({ text: `En zona de interés (${property.zone})`, positive: true });
    } else if (property.city && zones.includes(lower(property.city))) {
      score += 12;
      reasons.push({ text: `En la ciudad de interés (${property.city})`, positive: true });
    } else {
      objections.push("Fuera de las zonas de interés");
    }
  } else {
    score += 12;
  }

  // Property type (20)
  if (pref.propertyTypes.length > 0) {
    if (pref.propertyTypes.map(lower).includes(lower(property.propertyType))) {
      score += 20;
      reasons.push({ text: `Tipo de propiedad coincide (${propertyTypeLabel(property.propertyType)})`, positive: true });
    } else {
      objections.push("Tipo de propiedad distinto al buscado");
    }
  } else {
    score += 12;
  }

  // Amenities (15)
  if (pref.amenities.length > 0) {
    const propAmenities = property.amenities.map(lower);
    const matched = pref.amenities.filter((a) => propAmenities.includes(lower(a)));
    score += Math.round((matched.length / pref.amenities.length) * 15);
    if (matched.length > 0) {
      reasons.push({ text: `Incluye: ${matched.join(", ")}`, positive: true });
    }
  } else {
    score += 9;
  }

  // Bedrooms (10)
  if (pref.bedroomsMin != null) {
    if (property.bedrooms != null && property.bedrooms >= pref.bedroomsMin) {
      score += 10;
      reasons.push({ text: `${pref.bedroomsMin}+ recámaras`, positive: true });
    } else if (property.bedrooms != null) {
      score += Math.max(0, 10 - (pref.bedroomsMin - property.bedrooms) * 5);
    } else {
      score += 5;
    }
  } else {
    score += 6;
  }

  // Bathrooms (5)
  if (pref.bathroomsMin != null) {
    if (property.bathrooms != null && property.bathrooms >= pref.bathroomsMin) {
      score += 5;
    } else {
      score += 2;
    }
  } else {
    score += 3;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const tier: MatchScore["tier"] = score >= 75 ? "alta" : score >= 50 ? "media" : "baja";

  return { score, tier, reasons, objections };
}
