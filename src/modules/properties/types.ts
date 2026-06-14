export interface PropertyListItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  typeLabel: string;
  operation: string;
  operationLabel: string;
  status: string;
  priceLabel: string;
  zone: string | null;
  city: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  builtM2: number | null;
  coverUrl: string | null;
  interest: number;
}

export interface PropertyMediaView {
  id: string;
  url: string;
  alt: string | null;
  kind: string;
}

export interface InterestedLead {
  contactId: string;
  name: string;
  relation: string;
  relationLabel: string;
}

export interface PropertyDetail extends PropertyListItem {
  description: string | null;
  amenities: string[];
  media: PropertyMediaView[];
  lat: number | null;
  lng: number | null;
  state: string | null;
  country: string;
  parking: number | null;
  lotSizeM2: number | null;
  commissionPct: number | null;
  developerName: string | null;
  deliveryDateLabel: string | null;
  assignedName: string | null;
  createdAtLabel: string | null;
  interestedLeads: InterestedLead[];
}

export interface PropertyFilters {
  search?: string;
  type?: string;
  status?: string;
  operation?: string;
}

export interface PropertyListResult {
  items: PropertyListItem[];
  total: number;
}

export interface PropertyFormOptions {
  members: { id: string; name: string }[];
}
