import type { MatchReason } from "@/lib/matching/engine";

export interface PropertyMatch {
  propertyId: string;
  title: string;
  slug: string;
  priceLabel: string;
  coverUrl: string | null;
  typeLabel: string;
  operationLabel: string;
  locationLabel: string | null;
  score: number;
  tier: "alta" | "media" | "baja";
  reasons: MatchReason[];
  objections: string[];
  suggestedMessage: string;
}

export interface ClientMatch {
  contactId: string;
  name: string;
  typeLabel: string;
  score: number;
  tier: "alta" | "media" | "baja";
  budgetLabel: string | null;
  zone: string | null;
  reasons: MatchReason[];
  suggestedMessage: string;
}
