export interface ContactTagView {
  id: string;
  name: string;
  color: string;
}

export interface ContactListItem {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  stage: string;
  score: number;
  assignedName: string | null;
  lastContactLabel: string | null;
  budgetLabel: string | null;
  zone: string | null;
  tags: ContactTagView[];
}

export interface TimelineEntry {
  id: string;
  kind: "created" | "note" | "opportunity" | "visit" | "conversation" | "favorite" | "stage";
  title: string;
  detail?: string;
  at: string; // ISO
  atLabel: string;
}

export interface ContactNoteView {
  id: string;
  body: string;
  authorName: string | null;
  atLabel: string;
}

export interface ContactPropertyView {
  id: string;
  title: string;
  relation: string;
  relationLabel: string;
  priceLabel: string;
}

export interface ContactDetail extends ContactListItem {
  createdAtLabel: string;
  nextFollowUpLabel: string | null;
  closeProbability: number | null;
  preference: {
    budgetLabel: string | null;
    zones: string[];
    propertyTypes: string[];
    bedroomsMin: number | null;
    bathroomsMin: number | null;
    amenities: string[];
    purchaseReason: string | null;
    urgency: string;
  } | null;
  notes: ContactNoteView[];
  timeline: TimelineEntry[];
  properties: ContactPropertyView[];
  openOpportunities: number;
}

export interface ContactFilters {
  search?: string;
  type?: string;
  stage?: string;
  assignedMembershipId?: string;
  tag?: string;
}

export interface ContactListResult {
  items: ContactListItem[];
  total: number;
}

/** Option lists for the contact form and filters. */
export interface ContactFormOptions {
  leadSources: { id: string; name: string }[];
  members: { id: string; name: string }[];
  tags: ContactTagView[];
}
