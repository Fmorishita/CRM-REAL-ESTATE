/**
 * Maps provider abstraction. Real Google Maps / Mapbox routing plugs in at
 * Phase 19 (when GOOGLE_MAPS_API_KEY is configured); until then route legs are
 * estimated with the haversine distance, and the directions link uses the public
 * Google Maps URL scheme (no API key required).
 */

export interface RouteStop {
  id: string;
  label: string;
  lat: number | null;
  lng: number | null;
  /** Free-text location used when coordinates are missing. */
  query?: string | null;
}

export interface RouteLeg {
  stop: RouteStop;
  distanceKm: number | null;
  durationMin: number | null;
}

export interface PlannedRoute {
  legs: RouteLeg[];
  totalDistanceKm: number;
  totalDurationMin: number;
  /** Public Google Maps directions URL for the ordered stops. */
  directionsUrl: string | null;
  /** Whether ordering/distances are estimated (mock) vs from a real provider. */
  estimated: boolean;
}

const EARTH_RADIUS_KM = 6371;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Average city driving speed assumption for mock ETAs. */
const AVG_KMH = 35;

function mapsQuery(stop: RouteStop): string {
  if (stop.lat != null && stop.lng != null) return `${stop.lat},${stop.lng}`;
  return stop.query ?? stop.label;
}

function buildDirectionsUrl(ordered: RouteStop[]): string | null {
  if (ordered.length === 0) return null;
  const destination = encodeURIComponent(mapsQuery(ordered[ordered.length - 1]!));
  const waypoints = ordered
    .slice(0, -1)
    .map((s) => encodeURIComponent(mapsQuery(s)))
    .join("|");
  const base = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  return waypoints ? `${base}&waypoints=${waypoints}` : base;
}

/**
 * Plans a route over the day's stops. When coordinates exist it orders them
 * greedily by nearest-neighbour from the first stop and estimates leg distance
 * and time; otherwise it keeps the given order with no distances.
 */
export function planMockRoute(stops: RouteStop[]): PlannedRoute {
  if (stops.length === 0) {
    return { legs: [], totalDistanceKm: 0, totalDurationMin: 0, directionsUrl: null, estimated: true };
  }

  const geo = stops.filter((s) => s.lat != null && s.lng != null);
  let ordered: RouteStop[];

  if (geo.length === stops.length && stops.length > 2) {
    // Nearest-neighbour ordering starting from the first stop.
    const remaining = [...stops];
    ordered = [remaining.shift()!];
    while (remaining.length) {
      const last = ordered[ordered.length - 1]!;
      let bestIdx = 0;
      let bestDist = Infinity;
      remaining.forEach((s, i) => {
        const d = haversineKm({ lat: last.lat!, lng: last.lng! }, { lat: s.lat!, lng: s.lng! });
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
      ordered.push(remaining.splice(bestIdx, 1)[0]!);
    }
  } else {
    ordered = stops;
  }

  const legs: RouteLeg[] = ordered.map((stop, i) => {
    if (i === 0) return { stop, distanceKm: null, durationMin: null };
    const prev = ordered[i - 1]!;
    if (prev.lat != null && prev.lng != null && stop.lat != null && stop.lng != null) {
      const distanceKm = haversineKm({ lat: prev.lat, lng: prev.lng }, { lat: stop.lat, lng: stop.lng });
      return { stop, distanceKm: Math.round(distanceKm * 10) / 10, durationMin: Math.round((distanceKm / AVG_KMH) * 60) };
    }
    return { stop, distanceKm: null, durationMin: null };
  });

  const totalDistanceKm = Math.round(legs.reduce((s, l) => s + (l.distanceKm ?? 0), 0) * 10) / 10;
  const totalDurationMin = legs.reduce((s, l) => s + (l.durationMin ?? 0), 0);

  return {
    legs,
    totalDistanceKm,
    totalDurationMin,
    directionsUrl: buildDirectionsUrl(ordered),
    estimated: true,
  };
}
