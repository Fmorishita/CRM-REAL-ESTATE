export interface LandingBrand {
  organizationId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  whatsapp: string | null;
}

export interface LandingMedia {
  id: string;
  url: string;
  alt: string | null;
}

export interface PublicProperty {
  brand: LandingBrand;
  id: string;
  title: string;
  slug: string;
  description: string | null;
  typeLabel: string;
  operationLabel: string;
  status: string;
  priceLabel: string | null;
  hidePrice: boolean;
  locationLabel: string | null;
  showExactLocation: boolean;
  lat: number | null;
  lng: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  builtM2: number | null;
  lotSizeM2: number | null;
  amenities: string[];
  media: LandingMedia[];
  agentName: string | null;
  seoTitle: string;
  seoDescription: string;
  ogImage: string | null;
  similar: PublicPropertyCard[];
}

export interface PublicPropertyCard {
  slug: string;
  title: string;
  priceLabel: string | null;
  coverUrl: string | null;
  typeLabel: string;
  operationLabel: string;
  locationLabel: string | null;
}

export interface PublicAgent {
  name: string;
  roleLabel: string;
}

export interface PublicCompany {
  brand: LandingBrand;
  description: string | null;
  agents: PublicAgent[];
  properties: PublicPropertyCard[];
  seoTitle: string;
  seoDescription: string;
}
