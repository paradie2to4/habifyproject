import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Search, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { deleteSavedSearchApi, fetchSavedSearchesApi, SavedSearch, updateSavedSearchApi } from '../services/featuresApi';
import { FilterState } from '../types';

/** The tenant's saved searches, with alert switches and a quick way to run each one again. */
export const SavedSearchesSection: React.FC = () => {
  const { isLive, setFilters, resetFilters, setCurrentTab, addToast } = useApp();
  const [items, setItems] = useState<SavedSearch[] | null>(null);

  useEffect(() => {
    if (!isLive) return;
    fetchSavedSearchesApi().then(setItems).catch(() => setItems([]));
  }, [isLive]);

  if (!isLive || !items || items.length === 0) return null;

  const run = (s: SavedSearch) => {
    resetFilters();
    setFilters(prev => ({
      ...prev,
      selectedProvince: s.province || '',
      selectedDistrict: s.district || '',
      selectedLocation: s.sectors.length === 1 ? s.sectors[0] : '',
      searchQuery: s.sectors.length > 1 ? s.sectors[0] : '',
      propertyType: s.propertyType || '',
      maxPrice: s.maxRent ?? 2000000,
      minBedrooms: s.minBedrooms ?? 0,
      isFurnished: s.furnished || undefined,
      hasParking: s.parking || undefined,
      selectedAmenities: s.amenities,
      sortBy: 'NEWEST' as FilterState['sortBy']
    }));
    setCurrentTab('BROWSE');
    setTimeout(() => document.getElementById('explore-results')?.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  const toggle = async (s: SavedSearch) => {
    try {
      const u = await updateSavedSearchApi(s.id, { alertsEnabled: !s.alertsEnabled });
      setItems(list => list!.map(x => (x.id === s.id ? { ...x, alertsEnabled: u.alertsEnabled } : x)));
    } catch (e) {
      addToast('error', (e as Error).message);
    }
  };

  const remove = async (s: SavedSearch) => {
    try {
      await deleteSavedSearchApi(s.id);
      setItems(list => list!.filter(x => x.id !== s.id));
    } catch (e) {
      addToast('error', (e as Error).message);
    }
  };

  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-section">Saved searches</h2>
          <p className="text-sm text-stone-600 mt-1">We’ll tell you when a new home matches one with alerts on.</p>
        </div>
      </div>
      <ul className="divide-y divide-stone-200 border-y border-stone-200">
        {items.map(s => (
          <li key={s.id} className="py-3.5 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-tea-50 text-tea-700 inline-flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" />
            </span>
            <button type="button" onClick={() => run(s)} className="min-w-0 flex-1 text-left group">
              <span className="block text-sm font-semibold text-ink-900 truncate group-hover:text-tea-700">{s.name}</span>
              <span className="block text-xs text-stone-600">
                {s.matchCount != null ? `${s.matchCount} ${s.matchCount === 1 ? 'home matches' : 'homes match'} now` : 'Tap to see matches'}
                {s.amenities.length > 0 && ` · ${s.amenities.slice(0, 3).join(', ')}`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => toggle(s)}
              aria-pressed={s.alertsEnabled}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${
                s.alertsEnabled ? 'bg-tea-700 border-tea-700 text-white' : 'border-stone-300 text-stone-700 hover:border-ink-400'
              }`}
              title={s.alertsEnabled ? 'Alerts on — tap to turn off' : 'Alerts off — tap to turn on'}
            >
              {s.alertsEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              {s.alertsEnabled ? 'Alerts on' : 'Alerts off'}
            </button>
            <button type="button" onClick={() => remove(s)} className="p-2 rounded-full text-stone-600 hover:text-red-700 hover:bg-red-50" aria-label={`Delete saved search ${s.name}`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
