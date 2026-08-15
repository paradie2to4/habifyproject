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
  DollarSign,
  Bed,
  Home,
  Wifi,
  Sparkles,
  Check,
  Globe2
} from 'lucide-react';

const PROPERTY_TYPES: PropertyType[] = ['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'TOWNHOUSE', 'DUPLEX'];

export const TenantPreferencesModal: React.FC = () => {
  const { preferences, updatePreferences, closeModal } = useApp();

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
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-white rounded-xl max-w-2xl w-full shadow-xl border border-cream-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-terra-600/30 border border-terra-500/40 flex items-center justify-center text-terra-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Your Preferences</h2>
              <p className="text-xs text-cream-400">Customize your rental search criteria</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 text-cream-400 hover:text-white rounded-lg hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto text-navy-800">
          
          {/* Budget & Income */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 flex items-center justify-between">
                <span>Maximum Budget</span>
                <span className="font-mono text-terra-600 text-sm font-extrabold">{maxBudget.toLocaleString()} RWF</span>
              </label>
              <input
                type="range"
                min="100000"
                max="2000000"
                step="25000"
                value={maxBudget}
                onChange={e => setMaxBudget(Number(e.target.value))}
                className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-terra-600"
              />
              <div className="flex justify-between text-[10px] text-cream-600 font-mono">
                <span>100k</span>
                <span>1M</span>
                <span>2M</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 flex items-center justify-between">
                <span>Monthly Income</span>
                <span className="font-mono text-sage-600 text-sm font-extrabold">{monthlyIncome.toLocaleString()} RWF</span>
              </label>
              <input
                type="range"
                min="200000"
                max="4000000"
                step="50000"
                value={monthlyIncome}
                onChange={e => setMonthlyIncome(Number(e.target.value))}
                className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-sage-600"
              />
              <div className="flex justify-between text-[10px] text-cream-600 font-mono">
                <span>200k</span>
                <span>2M</span>
                <span>4M</span>
              </div>
            </div>
          </div>

          {/* Preferred Locations across Rwanda */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block">
                Preferred Locations ({selectedLocations.length} selected)
              </label>
              {selectedLocations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedLocations([])}
                  className="text-[11px] text-terra-600 hover:underline font-semibold"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Province sub-tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {RWANDA_PROVINCES.map(prov => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setActiveProvinceTab(prov)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    activeProvinceTab === prov
                      ? 'bg-navy-900 text-white'
                      : 'bg-cream-100 text-navy-700 hover:bg-cream-200'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>

            {/* Location buttons for selected province */}
            <div className="flex flex-wrap gap-2 p-3 bg-cream-50 rounded-lg border border-cream-200">
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
                          ? 'bg-terra-600 text-white shadow-xs'
                          : 'bg-white hover:bg-cream-100 border border-cream-200 text-navy-700'
                      }`}
                    >
                      <MapPin className={`w-3 h-3 ${active ? 'text-white' : 'text-cream-500'}`} />
                      <span>{locName}</span>
                      <span className="text-[10px] opacity-75 font-normal">({info.district})</span>
                      {active && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Bedrooms & Property Archetypes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block mb-2">
                Minimum Bedrooms: {minBedrooms}+
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMinBedrooms(num)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      minBedrooms === num
                        ? 'bg-navy-900 text-white shadow-sm'
                        : 'bg-cream-100 hover:bg-cream-200 text-navy-700'
                    }`}
                  >
                    {num}{num === 5 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block mb-2">
                Property Styles
              </label>
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
                          ? 'bg-terra-600 text-white'
                          : 'bg-cream-100 hover:bg-cream-200 text-navy-600'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Furnished & Parking Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-cream-50 border border-cream-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={furnishedRequired}
                onChange={e => setFurnishedRequired(e.target.checked)}
                className="w-4 h-4 rounded text-terra-600 focus:ring-terra-500 border-cream-300"
              />
              <div>
                <span className="text-xs font-bold text-navy-900 block">Furnished Property</span>
                <span className="text-[11px] text-cream-600">Prioritize ready-to-move homes</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={parkingRequired}
                onChange={e => setParkingRequired(e.target.checked)}
                className="w-4 h-4 rounded text-terra-600 focus:ring-terra-500 border-cream-300"
              />
              <div>
                <span className="text-xs font-bold text-navy-900 block">Parking Required</span>
                <span className="text-[11px] text-cream-600">Secure garage or compound space</span>
              </div>
            </label>
          </div>

          {/* Priority Amenities Checklist */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block mb-2">
              Priority Amenities ({selectedAmenities.length} selected)
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
                        ? 'bg-sage-50 border-sage-400 text-sage-900 font-semibold'
                        : 'bg-cream-50 border-cream-200 text-navy-600 hover:bg-cream-100'
                    }`}
                  >
                    <span className="truncate mr-1">{amenity}</span>
                    {active && <Check className="w-3.5 h-3.5 text-sage-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-cream-50 border-t border-cream-200 flex items-center justify-between">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-xs font-semibold text-navy-600 hover:text-navy-900 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold bg-terra-600 hover:bg-terra-700 text-white transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>

      </div>
    </div>
  );
};
