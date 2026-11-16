import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  RWANDA_PROVINCES,
  RWANDA_LOCATIONS_DATA,
  ALL_AMENITY_OPTIONS
} from '../data/seedData';
import { PropertyType } from '../types';
import {
  SlidersHorizontal,
  X,
  MapPin,
  Sparkles,
  Check
} from 'lucide-react';

const PROPERTY_TYPES: PropertyType[] = ['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'TOWNHOUSE', 'DUPLEX'];

export const TenantPreferencesModal: React.FC = () => {
  const { preferences, updatePreferences, closeModal, currentUser, setCurrentUser, addToast } = useApp();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
  const [maxBudget, setMaxBudget] = useState(preferences.maxBudget);
  const [monthlyIncome, setMonthlyIncome] = useState(preferences.monthlyIncome);
  const [minBedrooms, setMinBedrooms] = useState(preferences.minBedrooms);
  const [furnishedRequired, setFurnishedRequired] = useState(preferences.furnishedRequired);
  const [parkingRequired, setParkingRequired] = useState(preferences.parkingRequired);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(preferences.preferredLocations);
  const [selectedTypes, setSelectedTypes] = useState<PropertyType[]>(preferences.preferredPropertyTypes);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(preferences.preferredAmenities);
  const [activeProvinceTab, setActiveProvinceTab] = useState<string>('Kigali City');

  const toggleLocation = (sector: string) => {
    setSelectedLocations(prev =>
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  const toggleType = (type: PropertyType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSave = () => {
    if (currentUser) {
      const nameChanged = fullName.trim() !== currentUser.fullName;
      const phoneChanged = phone.trim() !== (currentUser.phoneNumber || '');
      if (nameChanged || phoneChanged) {
        setCurrentUser({
          ...currentUser,
          fullName: fullName.trim() || currentUser.fullName,
          phoneNumber: phone.trim() || undefined
        });
        addToast('success', 'Profile details updated.');
      }
    }

    if (currentUser?.role === 'TENANT' || !currentUser) {
      updatePreferences({
        maxBudget,
        monthlyIncome,
        minBedrooms,
        furnishedRequired,
        parkingRequired,
        preferredLocations: selectedLocations,
        preferredPropertyTypes: selectedTypes,
        preferredAmenities: selectedAmenities
      });
    }

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-[3px] overflow-y-auto">
      <div
        className="animate-pop bg-stone-50 rounded-3xl max-w-2xl w-full border border-stone-200 overflow-hidden my-6 text-left"
        onClick={e => e.stopPropagation()}
      >
        <div className="palette-light topo p-5 sm:p-6 bg-tea-700 text-white flex items-center justify-between border-b border-tea-600">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-tea-700/25 border border-tea-500/40 flex items-center justify-center text-saffron-300">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">
                {currentUser?.role === 'TENANT' ? 'Profile & preferences' : 'Your preferences'}
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Match homes to how you actually live
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-tea-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto text-ink-900">
          {currentUser && (
            <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-3">
              <p className="text-label">Account profile</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-label block mb-1.5">Full name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="input-base w-full"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-label block mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="input-base w-full"
                    placeholder="+250 788 000 000"
                  />
                </div>
              </div>
              <p className="text-xs text-stone-600">
                Signed in as <span className="font-semibold text-ink-900">{currentUser.email}</span>
              </p>
            </div>
          )}

          {(currentUser?.role === 'TENANT' || !currentUser) && (
            <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-label flex items-center justify-between">
                <span>Maximum budget</span>
                <span className="font-mono text-tea-600 text-sm font-bold normal-case tracking-normal">
                  {maxBudget.toLocaleString()} RWF
                </span>
              </label>
              <input
                type="range"
                min={100000}
                max={2000000}
                step={25000}
                value={maxBudget}
                onChange={e => setMaxBudget(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-tea-600"
              />
              <div className="flex justify-between text-[10px] text-stone-600 font-mono">
                <span>100k</span>
                <span>1M</span>
                <span>2M</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-label flex items-center justify-between">
                <span>Monthly income</span>
                <span className="font-mono text-ink-700 text-sm font-bold normal-case tracking-normal">
                  {monthlyIncome.toLocaleString()} RWF
                </span>
              </label>
              <input
                type="range"
                min={200000}
                max={4000000}
                step={50000}
                value={monthlyIncome}
                onChange={e => setMonthlyIncome(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-tea-600"
              />
              <div className="flex justify-between text-[10px] text-stone-600 font-mono">
                <span>200k</span>
                <span>2M</span>
                <span>4M</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-label">
                Preferred locations ({selectedLocations.length})
              </label>
              {selectedLocations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedLocations([])}
                  className="text-[11px] text-tea-600 hover:underline font-semibold"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {RWANDA_PROVINCES.map(prov => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setActiveProvinceTab(prov)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    activeProvinceTab === prov
                      ? 'bg-tea-700 text-white'
                      : 'bg-stone-100 text-ink-700 hover:bg-stone-200'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 p-3 bg-white rounded-xl border border-stone-200">
              {Object.entries(RWANDA_LOCATIONS_DATA)
                .filter(([_, info]) => info.province === activeProvinceTab)
                .map(([locName, info]) => {
                  const active = selectedLocations.includes(locName);
                  return (
                    <button
                      key={locName}
                      type="button"
                      onClick={() => toggleLocation(locName)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        active
                          ? 'bg-tea-700 text-white'
                          : 'bg-stone-50 hover:bg-stone-100 border border-stone-200 text-ink-700'
                      }`}
                    >
                      <MapPin className={`w-3 h-3 ${active ? 'text-white' : 'text-stone-500'}`} />
                      <span>{locName}</span>
                      <span className="text-[10px] opacity-75 font-normal">({info.district})</span>
                      {active && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-label block mb-2">
                Minimum bedrooms: {minBedrooms}+
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMinBedrooms(num)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      minBedrooms === num
                        ? 'bg-tea-700 text-white'
                        : 'bg-stone-100 hover:bg-stone-200 text-ink-700'
                    }`}
                  >
                    {num}{num === 5 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-label block mb-2">Property styles</label>
              <div className="flex flex-wrap gap-1.5">
                {PROPERTY_TYPES.map(type => {
                  const active = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                        active
                          ? 'bg-tea-700 text-white'
                          : 'bg-stone-100 hover:bg-stone-200 text-ink-600'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-stone-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={furnishedRequired}
                onChange={e => setFurnishedRequired(e.target.checked)}
                className="w-4 h-4 rounded text-tea-600 focus:ring-tea-500 border-stone-300"
              />
              <div>
                <span className="text-xs font-bold text-ink-900 block">Furnished</span>
                <span className="text-[11px] text-stone-600">Ready-to-move homes</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={parkingRequired}
                onChange={e => setParkingRequired(e.target.checked)}
                className="w-4 h-4 rounded text-tea-600 focus:ring-tea-500 border-stone-300"
              />
              <div>
                <span className="text-xs font-bold text-ink-900 block">Parking required</span>
                <span className="text-[11px] text-stone-600">Garage or compound space</span>
              </div>
            </label>
          </div>

          <div>
            <label className="text-label block mb-2">
              Priority amenities ({selectedAmenities.length})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_AMENITY_OPTIONS.map(amenity => {
                const active = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`p-2 rounded-lg text-xs font-medium text-left transition-all flex items-center justify-between border ${
                      active
                        ? 'bg-saffron-50 border-tea-400 text-saffron-900 font-semibold'
                        : 'bg-white border-stone-200 text-ink-600 hover:bg-stone-100'
                    }`}
                  >
                    <span className="truncate mr-1">{amenity}</span>
                    {active && <Check className="w-3.5 h-3.5 text-tea-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
            </>
          )}
        </div>

        <div className="p-4 sm:p-5 bg-white border-t border-stone-200 flex items-center justify-between">
          <button
            type="button"
            onClick={closeModal}
            className="btn-ghost text-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn-accent flex items-center gap-1.5 text-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Save profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
