export interface VisitView {
  id: string;
  contactId: string;
  contactName: string;
  propertyId: string;
  propertyTitle: string;
  agentName: string | null;
  scheduledAtIso: string;
  dayLabel: string;
  timeLabel: string;
  durationMin: number;
  status: string;
  notes: string | null;
  feedback: string | null;
  locationLabel: string | null;
  lat: number | null;
  lng: number | null;
  mapsQuery: string | null;
}

export interface VisitFilters {
  date?: string; // YYYY-MM-DD
  agentId?: string;
}

export interface VisitFormOptions {
  contacts: { id: string; name: string }[];
  properties: { id: string; title: string }[];
  members: { id: string; name: string }[];
}
