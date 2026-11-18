/**
 * Commute times (OSRM table) and nearby places (OpenStreetMap via Overpass).
 *
 * Both use free public servers that are meant for light use. For heavy traffic point
 * VITE_ROUTING_URL / VITE_OVERPASS_URL at your own or a paid instance.
 */
import { LatLng } from './routing';

const ROUTING_URL = ((import.meta.env.VITE_ROUTING_URL as string | undefined) || 'https://router.project-osrm.org').replace(/\/$/, '');
const OVERPASS_URLS = [
  (import.meta.env.VITE_OVERPASS_URL as string | undefined) || 'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

// ---------------------------------------------------------------------------
// Workplace (stored on this device)
// ---------------------------------------------------------------------------

export interface Workplace { label: string; lat: number; lng: number }

const WORK_KEY = 'habify_workplace';
export const WORKPLACE_EVENT = 'habify:workplace';

export function loadWorkplace(): Workplace | null {
  try {
    const raw = localStorage.getItem(WORK_KEY);
    const w = raw ? JSON.parse(raw) : null;
    return w && typeof w.lat === 'number' && typeof w.lng === 'number' ? w : null;
  } catch {
    return null;
  }
}

export function saveWorkplace(w: Workplace | null) {
  try {
    if (w) localStorage.setItem(WORK_KEY, JSON.stringify(w));
    else localStorage.removeItem(WORK_KEY);
  } catch {
    /* private mode — still works for this page */
  }
  window.dispatchEvent(new CustomEvent(WORKPLACE_EVENT, { detail: w }));
}

export interface GeocodeHit { label: string; lat: number; lng: number }

/** Address search limited to Rwanda (OpenStreetMap Nominatim). */
export async function geocodeRwanda(query: string, signal?: AbortSignal): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=rw&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Address search is unavailable right now');
  const rows = (await res.json()) as { display_name: string; lat: string; lon: string; name?: string }[];
  return rows.map(r => ({
    label: (r.name || r.display_name.split(',')[0]) + ', ' + r.display_name.split(',').slice(1, 3).join(',').trim(),
    lat: Number(r.lat),
    lng: Number(r.lon)
  }));
}

// ---------------------------------------------------------------------------
// Commute times
// ---------------------------------------------------------------------------

const commuteCache = new Map<string, number | null>();
const key = (w: Workplace, id: string) => `${w.lat.toFixed(5)},${w.lng.toFixed(5)}|${id}`;

/**
 * Driving seconds from each home to the workplace (null when no road route).
 * Batches up to 90 homes per request and caches results for this page load.
 */
export async function commuteTimes(
  work: Workplace,
  homes: { id: string; lat: number; lng: number }[],
  signal?: AbortSignal
): Promise<Record<string, number | null>> {
  const out: Record<string, number | null> = {};
  const todo = homes.filter(h => {
    const k = key(work, h.id);
    if (commuteCache.has(k)) {
      out[h.id] = commuteCache.get(k)!;
      return false;
    }
    return Number.isFinite(h.lat) && Number.isFinite(h.lng);
  });

  for (let i = 0; i < todo.length; i += 90) {
    const batch = todo.slice(i, i + 90);
    // OSRM wants lng,lat. Index 0..n-1 are homes, n is the workplace.
    const coords = [...batch.map(h => `${h.lng},${h.lat}`), `${work.lng},${work.lat}`].join(';');
    const sources = batch.map((_, idx) => idx).join(';');
    const res = await fetch(`${ROUTING_URL}/table/v1/driving/${coords}?sources=${sources}&destinations=${batch.length}&annotations=duration`, { signal });
    if (!res.ok) throw new Error('Commute times are unavailable right now');
    const data = (await res.json()) as { code: string; durations?: (number | null)[][] };
    if (data.code !== 'Ok' || !data.durations) throw new Error('Commute times are unavailable right now');
    batch.forEach((h, idx) => {
      const s = data.durations![idx]?.[0];
      const v = typeof s === 'number' ? s : null;
      commuteCache.set(key(work, h.id), v);
      out[h.id] = v;
    });
  }
  return out;
}

export const formatCommute = (s: number) => (s < 60 ? '1 min' : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`);

// ---------------------------------------------------------------------------
// Nearby places
// ---------------------------------------------------------------------------

export type PlaceKind = 'school' | 'health' | 'market' | 'bus' | 'pharmacy' | 'bank';

export const PLACE_KINDS: { kind: PlaceKind; label: string; plural: string; color: string }[] = [
  { kind: 'school', label: 'School', plural: 'Schools', color: '#2F7D5B' },
  { kind: 'health', label: 'Hospital / clinic', plural: 'Hospitals & clinics', color: '#C2453D' },
  { kind: 'market', label: 'Market / shop', plural: 'Markets & shops', color: '#C98A1B' },
  { kind: 'bus', label: 'Bus stop', plural: 'Bus stops', color: '#3B6FB6' },
  { kind: 'pharmacy', label: 'Pharmacy', plural: 'Pharmacies', color: '#8A4FB0' },
  { kind: 'bank', label: 'Bank / ATM', plural: 'Banks & ATMs', color: '#5A6B63' }
];

export interface Place { id: string; kind: PlaceKind; name: string; lat: number; lng: number; distanceM: number }

function kindOf(tags: Record<string, string>): PlaceKind | null {
  const a = tags.amenity, s = tags.shop;
  if (a === 'school' || a === 'kindergarten' || a === 'college' || a === 'university') return 'school';
  if (a === 'hospital' || a === 'clinic' || a === 'doctors' || tags.healthcare === 'hospital' || tags.healthcare === 'clinic' || tags.healthcare === 'centre') return 'health';
  if (a === 'pharmacy' || tags.healthcare === 'pharmacy') return 'pharmacy';
  if (a === 'marketplace' || s === 'supermarket' || s === 'convenience' || s === 'mall' || s === 'greengrocer') return 'market';
  if (tags.highway === 'bus_stop' || a === 'bus_station' || tags.public_transport === 'platform') return 'bus';
  if (a === 'bank' || a === 'atm') return 'bank';
  return null;
}

export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]), dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const placeCache = new Map<string, Place[]>();

/** Schools, health, markets, bus stops, pharmacies and banks within {@code radiusM} of a point. */
export async function nearbyPlaces(at: LatLng, radiusM = 1500, signal?: AbortSignal): Promise<Place[]> {
  const ck = `${at[0].toFixed(4)},${at[1].toFixed(4)},${radiusM}`;
  if (placeCache.has(ck)) return placeCache.get(ck)!;
  const around = `(around:${radiusM},${at[0]},${at[1]})`;
  const query = `[out:json][timeout:20];(
    nwr["amenity"~"^(school|kindergarten|college|university|hospital|clinic|doctors|pharmacy|marketplace|bus_station|bank|atm)$"]${around};
    nwr["healthcare"~"^(hospital|clinic|centre|pharmacy)$"]${around};
    nwr["shop"~"^(supermarket|convenience|mall|greengrocer)$"]${around};
    node["highway"="bus_stop"]${around};
  );out center 300;`;
  // The public servers are often busy, so try each in turn with a time limit
  let data: unknown = null;
  for (const url of OVERPASS_URLS) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const ctrl = new AbortController();
    const stop = () => ctrl.abort();
    signal?.addEventListener('abort', stop);
    const timer = setTimeout(stop, 15000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: ctrl.signal
      });
      if (res.ok) {
        data = await res.json();
        break;
      }
    } catch {
      /* try the next server */
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', stop);
    }
  }
  if (!data) throw new Error('Nearby places are unavailable right now');
  const parsed = data as { elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] };

  const seen = new Set<string>();
  const places: Place[] = [];
  for (const e of parsed.elements || []) {
    const tags = e.tags || {};
    const kind = kindOf(tags);
    const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon;
    if (!kind || lat == null || lng == null) continue;
    const name = tags.name || tags['name:en'] || (kind === 'bus' ? 'Bus stop' : PLACE_KINDS.find(k => k.kind === kind)!.label);
    // Bus stops come in pairs on both sides of the road; keep one per name
    const dedupe = kind === 'bus' ? `bus:${name}` : `${e.type}:${e.id}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    places.push({ id: `${e.type}/${e.id}`, kind, name, lat, lng, distanceM: distanceM(at, [lat, lng]) });
  }
  places.sort((a, b) => a.distanceM - b.distanceM);
  placeCache.set(ck, places);
  return places;
}

/** Rough walking time at 4.8 km/h. */
export const walkMinutes = (m: number) => Math.max(1, Math.round(m / 80));
