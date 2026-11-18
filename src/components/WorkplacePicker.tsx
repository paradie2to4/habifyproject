import React, { useEffect, useRef, useState } from 'react';
import { Briefcase, LocateFixed, Loader2, MapPin, X } from 'lucide-react';
import { geocodeRwanda, GeocodeHit, saveWorkplace, Workplace } from '../services/places';
import { getCurrentPosition } from '../services/routing';

/** Dialog for setting where you work or study, so every home shows its drive time. */
export const WorkplacePicker: React.FC<{ current: Workplace | null; onClose: () => void }> = ({ current, onClose }) => {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [label, setLabel] = useState(current?.label || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Search as you type (debounced, and polite to the free geocoder)
  useEffect(() => {
    if (query.trim().length < 3) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      setError('');
      try {
        const r = await geocodeRwanda(query, ctrl.signal);
        setHits(r);
        if (!r.length) setError('No places found in Rwanda for that. Try a street, building or neighborhood.');
      } catch (e) {
        if (!ctrl.signal.aborted) setError((e as Error).message);
      } finally {
        if (!ctrl.signal.aborted) setBusy(false);
      }
    }, 450);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const choose = (w: Workplace) => {
    saveWorkplace({ ...w, label: (label.trim() || w.label).slice(0, 40) });
    onClose();
  };

  const useMyLocation = async () => {
    setBusy(true);
    setError('');
    try {
      const [lat, lng] = await getCurrentPosition();
      choose({ label: label.trim() || 'my location', lat, lng });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="workplace-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-pop relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-stone-200 shadow-xl p-6">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <span className="w-11 h-11 rounded-2xl bg-tea-50 text-tea-700 inline-flex items-center justify-center">
          <Briefcase className="w-5 h-5" />
        </span>
        <h2 id="workplace-title" className="mt-3 font-display text-xl font-bold text-ink-900">Where do you go every day?</h2>
        <p className="mt-1 text-sm text-stone-600">
          Add your work or school and every home shows how long the drive is. It stays on this device.
        </p>

        <label className="block mt-5 text-xs font-semibold text-ink-800" htmlFor="wp-name">Call it</label>
        <input
          id="wp-name"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="work, school, office…"
          maxLength={40}
          className="mt-1 w-full h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-ink-900 focus:border-tea-600 focus:ring-4 focus:ring-tea-600/15 outline-none"
        />

        <label className="block mt-4 text-xs font-semibold text-ink-800" htmlFor="wp-search">Address</label>
        <div className="mt-1 relative">
          <input
            id="wp-search"
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. Kigali Heights, KN 5 Rd, Kigali Convention Centre"
            className="w-full h-11 rounded-xl border border-stone-300 bg-white pl-3 pr-9 text-sm text-ink-900 focus:border-tea-600 focus:ring-4 focus:ring-tea-600/15 outline-none"
          />
          {busy && <Loader2 className="w-4 h-4 animate-spin text-stone-500 absolute right-3 top-3.5" aria-label="Searching" />}
        </div>

        {hits.length > 0 && (
          <ul className="mt-2 rounded-xl border border-stone-200 divide-y divide-stone-100 max-h-56 overflow-y-auto">
            {hits.map(h => (
              <li key={`${h.lat},${h.lng}`}>
                <button type="button" onClick={() => choose(h)} className="w-full text-left px-3 py-2.5 text-sm text-ink-800 hover:bg-tea-50 flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-tea-600 shrink-0" />
                  {h.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-2 text-xs text-red-700" role="alert">{error}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" onClick={useMyLocation} disabled={busy} className="btn-secondary rounded-full inline-flex items-center gap-2">
            <LocateFixed className="w-4 h-4" /> Use where I am now
          </button>
          {current && (
            <button
              type="button"
              onClick={() => {
                saveWorkplace(null);
                onClose();
              }}
              className="ml-auto text-sm font-semibold text-stone-700 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
        <p className="mt-4 text-[11px] text-stone-500">Address search by OpenStreetMap. Drive times are estimates without traffic.</p>
      </div>
    </div>
  );
};
