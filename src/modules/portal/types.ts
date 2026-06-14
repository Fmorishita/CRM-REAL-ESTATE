import type { PropertyMatch } from "@/modules/matching/types";

export interface PortalBrand {
  organizationId: string;
  name: string;
  primaryColor: string;
  accentColor: string;
}

export interface PortalAgent {
  name: string;
  whatsapp: string | null;
  email: string | null;
}

export interface PortalPropertyCard {
  id: string;
  title: string;
  slug: string;
  priceLabel: string;
  coverUrl: string | null;
  locationLabel: string | null;
  relationLabel?: string;
}

export interface PortalVisit {
  id: string;
  propertyTitle: string;
  dayLabel: string;
  timeLabel: string;
  status: string;
  statusLabel: string;
}

export interface PortalStep {
  label: string;
  done: boolean;
  current: boolean;
}

export interface PortalData {
  brand: PortalBrand;
  clientName: string;
  portalType: "buyer" | "seller" | "investor";
  agent: PortalAgent | null;
  steps: PortalStep[];
  recommended: PropertyMatch[];
  favorites: PortalPropertyCard[];
  visits: PortalVisit[];
  // Seller-specific
  listedProperties: PortalPropertyCard[];
  interestedLeadsCount: number;
  visitFeedback: string[];
  // Investor-specific
  roi: { label: string; value: string }[];
}
