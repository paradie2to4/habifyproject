/**
 * Driving directions from the visitor's location to a listing.
 *
 * Routing uses OSRM (open-source, OpenStreetMap data, no API key). The public demo server
 * is fine for light use; point VITE_ROUTING_URL at your own OSRM instance (or a hosted one)
 * for production traffic. Drive times are free-flow estimates — they don't include live traffic.
 */

export type LatLng = [number, number];

export interface RouteStep {
  instruction: string;
  distanceM: number;
  durationS: number;
}

export interface DrivingRoute {
  durationS: number;
  distanceM: number;
  /** [lat, lng] points for drawing the line */
  path: LatLng[];
  steps: RouteStep[];
}

export class DirectionsError extends Error {
  constructor(
    public code: 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'no-route' | 'network',
    message: string
  ) {
    super(message);
  }
}

const ROUTING_URL = ((import.meta.env.VITE_ROUTING_URL as string | undefined) || 'https://router.project-osrm.org').replace(/\/$/, '');

/** Ask the browser for the visitor's position (only ever called from a click). */
export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new DirectionsError('unsupported', 'Your browser can’t share your location.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve([pos.coords.latitude, pos.coords.longitude]),
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new DirectionsError('denied', 'Location access was blocked. Allow it in your browser’s site settings and try again.'));
        } else if (err.code === err.TIMEOUT) {
          reject(new DirectionsError('timeout', 'Finding your location took too long. Try again.'));
        } else {
          reject(new DirectionsError('unavailable', 'Your location isn’t available right now.'));
        }
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 }
    );
  });
}

interface OsrmStep {
  distance: number;
  duration: number;
  name: string;
  ref?: string;
  maneuver: { type: string; modifier?: string; exit?: number };
}

const TURN: Record<string, string> = {
  left: 'Turn left',
  right: 'Turn right',
  'slight left': 'Bear left',
  'slight right': 'Bear right',
  'sharp left': 'Turn sharp left',
  'sharp right': 'Turn sharp right',
  straight: 'Continue straight',
  uturn: 'Make a U-turn'
};

const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]}`;

/** Turn an OSRM maneuver into a short, human instruction. */
export function describeStep(step: OsrmStep): string {
  const road = step.name || step.ref || '';
  const onto = road ? ` onto ${road}` : '';
  const { type, modifier, exit } = step.maneuver;
  switch (type) {
    case 'depart':
      return road ? `Head out on ${road}` : 'Start driving';
    case 'arrive':
      return 'Arrive at the home';
    case 'roundabout':
    case 'rotary':
      return `At the roundabout, take the ${exit ? ordinal(exit) + ' ' : ''}exit${onto}`;
    case 'merge':
      return `Merge${onto}`;
    case 'fork':
      return `Keep ${modifier?.includes('left') ? 'left' : 'right'} at the fork${onto}`;
    case 'end of road':
      return `At the end of the road, ${(TURN[modifier || ''] || 'turn').toLowerCase()}${onto}`;
    case 'continue':
    case 'new name':
      return road ? `Continue on ${road}` : 'Continue';
    default:
      return `${TURN[modifier || ''] || 'Continue'}${onto}`;
  }
}

export async function fetchDrivingRoute(from: LatLng, to: LatLng, signal?: AbortSignal): Promise<DrivingRoute> {
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  let res: Response;
  try {
    res = await fetch(`${ROUTING_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`, { signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new DirectionsError('network', 'Couldn’t reach the directions service. Check your connection and try again.');
  }
  const body = await res.json().catch(() => null);
  const route = body?.routes?.[0];
  if (!res.ok || body?.code !== 'Ok' || !route) {
    throw new DirectionsError('no-route', 'There’s no driving route between your location and this home.');
  }
  const steps: RouteStep[] = (route.legs?.[0]?.steps ?? [])
    .map((s: OsrmStep) => ({ instruction: describeStep(s), distanceM: s.distance, durationS: s.duration }))
    // Drop zero-length "continue" noise but keep the arrival step
    .filter((s: RouteStep, i: number, all: RouteStep[]) => s.distanceM > 5 || i === all.length - 1);

  return {
    durationS: route.duration,
    distanceM: route.distance,
    path: (route.geometry?.coordinates ?? []).map(([lng, lat]: [number, number]) => [lat, lng] as LatLng),
    steps
  };
}

export const formatDuration = (s: number) => {
  const m = Math.max(1, Math.round(s / 60));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60 ? `${m % 60} min` : ''}`.trim();
};

export const formatDistance = (m: number) => (m < 950 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`);

/** Google Maps link for live, turn-by-turn navigation on the visitor's phone. */
export const googleMapsDirectionsUrl = (to: LatLng, from?: LatLng) =>
  `https://www.google.com/maps/dir/?api=1${from ? `&origin=${from[0]},${from[1]}` : ''}&destination=${to[0]},${to[1]}&travelmode=driving`;
