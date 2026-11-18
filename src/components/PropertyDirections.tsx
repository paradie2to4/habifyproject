import React, { useEffect, useRef, useState } from 'react';
import { Navigation, Car, LoaderCircle, ExternalLink, ChevronDown, X, RotateCcw, MapPin, Flag } from 'lucide-react';
import { Property } from '../types';
import { ListingsMap } from './ListingsMap';
import {
  DrivingRoute,
  DirectionsError,
  LatLng,
  fetchDrivingRoute,
  formatDistance,
  formatDuration,
  getCurrentPosition,
  googleMapsDirectionsUrl
} from '../services/routing';

type Status =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'routing' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; route: DrivingRoute; origin: LatLng };

/** Map of the home plus on-demand driving directions from the visitor's location. */
export const PropertyDirections: React.FC<{ property: Property }> = ({ property }) => {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [showSteps, setShowSteps] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const destination: LatLng = [property.latitude, property.longitude];
  const hasLocation = Number.isFinite(property.latitude) && Number.isFinite(property.longitude) && (property.latitude !== 0 || property.longitude !== 0);

  useEffect(() => () => abortRef.current?.abort(), []);
  // New listing → forget the old route
  useEffect(() => {
    abortRef.current?.abort();
    setStatus({ kind: 'idle' });
    setShowSteps(false);
  }, [property.id]);

  const start = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setShowSteps(false);
    try {
      setStatus({ kind: 'locating' });
      const origin = await getCurrentPosition();
      if (controller.signal.aborted) return;
      setStatus({ kind: 'routing' });
      const route = await fetchDrivingRoute(origin, destination, controller.signal);
      if (!controller.signal.aborted) setStatus({ kind: 'done', route, origin });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setStatus({ kind: 'error', message: e instanceof DirectionsError ? e.message : 'Directions aren’t available right now. Try again in a moment.' });
    }
  };

  const clear = () => {
    abortRef.current?.abort();
    setStatus({ kind: 'idle' });
    setShowSteps(false);
  };

  const busy = status.kind === 'locating' || status.kind === 'routing';
  const done = status.kind === 'done' ? status : null;

  return (
    <section aria-labelledby="where-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 id="where-heading" className="text-xl font-semibold text-ink-900">Where you’ll be</h2>
          <p className="text-sm text-stone-700 mt-1">
            {property.locationSector}
            {property.district ? `, ${property.district}` : ''}
          </p>
        </div>
        {hasLocation && (
          <a
            href={googleMapsDirectionsUrl(destination, done?.origin)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-tea-700 hover:text-tea-800"
          >
            Open in Google Maps
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="relative h-80">
          <ListingsMap properties={[property]} single route={done ? { path: done.route.path, origin: done.origin } : null} />
          {done && (
            <div className="absolute top-3 left-3 z-[500] animate-pop rounded-2xl bg-white border border-stone-200 px-4 py-2.5 flex items-center gap-3" style={{ boxShadow: 'var(--shadow-lift)' }}>
              <span className="w-9 h-9 rounded-xl bg-tea-50 text-tea-700 inline-flex items-center justify-center">
                <Car className="w-5 h-5" />
              </span>
              <span>
                <span className="block font-display text-xl font-bold text-ink-900 leading-tight tabular-nums">{formatDuration(done.route.durationS)}</span>
                <span className="block text-xs text-stone-600">{formatDistance(done.route.distanceM)} by car</span>
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 sm:p-5 border-t border-stone-200">
          {!hasLocation ? (
            <p className="text-sm text-stone-600">The landlord hasn’t pinned an exact location for this home yet.</p>
          ) : done ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-800">
                  About <span className="font-semibold text-ink-900">{formatDuration(done.route.durationS)}</span> from you
                  ({formatDistance(done.route.distanceM)}).
                  <span className="block text-xs text-stone-600 mt-0.5">Typical drive time without live traffic.</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={googleMapsDirectionsUrl(destination, done.origin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary rounded-full no-underline hover:text-white"
                  >
                    <Navigation className="w-4 h-4" />
                    Start navigation
                  </a>
                  <button type="button" onClick={start} className="btn-secondary rounded-full w-10 px-0" aria-label="Refresh from my current location" title="Refresh">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={clear} className="btn-ghost rounded-full w-10 px-0" aria-label="Clear directions" title="Clear">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {done.route.steps.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowSteps(s => !s)}
                    aria-expanded={showSteps}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 hover:text-tea-700"
                  >
                    {showSteps ? 'Hide' : 'Show'} {done.route.steps.length} directions
                    <ChevronDown className={`w-4 h-4 transition-transform ${showSteps ? 'rotate-180' : ''}`} />
                  </button>
                  {showSteps && (
                    <ol className="mt-3 space-y-0 max-h-80 overflow-y-auto pr-1">
                      {done.route.steps.map((step, i) => {
                        const last = i === done.route.steps.length - 1;
                        const Icon = i === 0 ? MapPin : last ? Flag : Navigation;
                        return (
                          <li key={i} className="flex gap-3">
                            <span className="flex flex-col items-center">
                              <span className={`w-7 h-7 shrink-0 rounded-full inline-flex items-center justify-center ${last ? 'bg-tea-700 text-white' : 'bg-tea-50 text-tea-700'}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </span>
                              {!last && <span className="w-px flex-1 bg-stone-200 my-1" />}
                            </span>
                            <span className="pb-4 min-w-0">
                              <span className="block text-sm text-ink-900">{step.instruction}</span>
                              {!last && <span className="block text-xs text-stone-600 tabular-nums">{formatDistance(step.distanceM)}</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-700 min-w-0" role={status.kind === 'error' ? 'alert' : undefined}>
                {status.kind === 'error' ? (
                  <span className="text-red-800">{status.message}</span>
                ) : status.kind === 'locating' ? (
                  'Finding your location…'
                ) : status.kind === 'routing' ? (
                  'Planning the fastest route…'
                ) : (
                  'See how long the drive is from where you are now.'
                )}
              </p>
              <button type="button" onClick={start} disabled={busy} className="btn-primary rounded-full">
                {busy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
                {status.kind === 'error' ? 'Try again' : busy ? 'Getting directions' : 'Get driving directions'}
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-stone-600">
        Your location is sent only to the routing service (OSRM, OpenStreetMap data) to plan this route, and Habify doesn’t store it.
      </p>
    </section>
  );
};
