import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bus, Footprints, GraduationCap, Landmark, Loader2, Pill, ShoppingBasket, Stethoscope } from 'lucide-react';
import { Property } from '../types';
import { ListingsMap } from './ListingsMap';
import { nearbyPlaces, Place, PlaceKind, PLACE_KINDS, walkMinutes } from '../services/places';
import { formatDistance } from '../services/routing';

const ICONS: Record<PlaceKind, React.ElementType> = {
  school: GraduationCap,
  health: Stethoscope,
  market: ShoppingBasket,
  bus: Bus,
  pharmacy: Pill,
  bank: Landmark
};

/** Schools, clinics, markets and bus stops around a home, from OpenStreetMap. Loads when scrolled into view. */
export const NearbyPlaces: React.FC<{ property: Property }> = ({ property }) => {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [error, setError] = useState('');
  const [kind, setKind] = useState<PlaceKind | 'all'>('all');
  const located = Number.isFinite(property.latitude) && Number.isFinite(property.longitude) && (property.latitude !== 0 || property.longitude !== 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(e => e.some(x => x.isIntersecting) && setVisible(true), { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || !located) return;
    const ctrl = new AbortController();
    setPlaces(null);
    setError('');
    nearbyPlaces([property.latitude, property.longitude], 1500, ctrl.signal)
      .then(setPlaces)
      .catch(e => !ctrl.signal.aborted && setError((e as Error).message));
    return () => ctrl.abort();
  }, [visible, located, property.latitude, property.longitude]);

  const byKind = useMemo(() => {
    const m = new Map<PlaceKind, Place[]>();
    (places || []).forEach(p => m.set(p.kind, [...(m.get(p.kind) || []), p]));
    return m;
  }, [places]);

  const pois = useMemo(
    () =>
      (places || [])
        .filter(p => kind === 'all' || p.kind === kind)
        .slice(0, 80)
        .map(p => ({
          id: p.id,
          lat: p.lat,
          lng: p.lng,
          color: PLACE_KINDS.find(k => k.kind === p.kind)!.color,
          title: `${p.name} · ${formatDistance(p.distanceM)}`
        })),
    [places, kind]
  );

  if (!located) return null;

  return (
    <section ref={ref} className="rounded-2xl border border-stone-200 bg-white overflow-hidden" aria-labelledby="nearby-title">
      <div className="p-6 pb-4">
        <h2 id="nearby-title" className="text-xl font-semibold text-ink-900">What’s nearby</h2>
        <p className="mt-1 text-sm text-stone-600">The closest schools, clinics, markets and bus stops within 1.5 km.</p>
      </div>

      {error ? (
        <p className="px-6 pb-6 text-sm text-stone-600">{error}. Please try again later.</p>
      ) : !places ? (
        <div className="px-6 pb-6 flex items-center gap-2 text-sm text-stone-600">
          <Loader2 className="w-4 h-4 animate-spin" /> Looking around the neighborhood…
        </div>
      ) : (
        <>
          <div className="px-6 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PLACE_KINDS.map(k => {
              const list = byKind.get(k.kind) || [];
              const nearest = list[0];
              const Icon = ICONS[k.kind];
              const on = kind === k.kind;
              return (
                <button
                  key={k.kind}
                  type="button"
                  onClick={() => setKind(on ? 'all' : k.kind)}
                  aria-pressed={on}
                  disabled={!nearest}
                  className={`text-left rounded-xl border p-3 transition-colors disabled:opacity-60 disabled:cursor-default ${
                    on ? 'border-tea-600 bg-tea-50' : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-ink-800">
                    <span className="w-6 h-6 rounded-lg inline-flex items-center justify-center text-white" style={{ background: k.color }}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    {k.plural}
                    {list.length > 0 && <span className="ml-auto text-stone-500 font-medium">{list.length}</span>}
                  </span>
                  {nearest ? (
                    <>
                      <span className="mt-2 block text-sm text-ink-900 truncate" title={nearest.name}>{nearest.name}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-stone-600">
                        <Footprints className="w-3 h-3" />
                        {formatDistance(nearest.distanceM)} · {walkMinutes(nearest.distanceM)} min walk
                      </span>
                    </>
                  ) : (
                    <span className="mt-2 block text-xs text-stone-500">None mapped within 1.5 km</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 h-72 border-t border-stone-200">
            <ListingsMap properties={[property]} single pois={pois} />
          </div>
          <p className="px-6 py-3 text-[11px] text-stone-500 border-t border-stone-100">
            Places from OpenStreetMap contributors. Some may be missing or out of date.
          </p>
        </>
      )}
    </section>
  );
};
