import React from 'react';
import { useApp } from '../context/AppContext';
import { PropertyCard } from '../components/PropertyCard';
import {
  ALL_AMENITY_OPTIONS,
  RWANDA_PROVINCES,
  RWANDA_DISTRICTS_BY_PROVINCE,
  RWANDA_LOCATIONS_DATA,
  ALL_RWANDA_LOCATIONS
} from '../data/seedData';
import { PropertyType } from '../types';
import {
  Search,
  MapPin,
  RotateCcw,
  Building,
  Filter,
  Check,
  LayoutGrid,
  Globe2
} from 'lucide-react';

const PROPERTY_TYPES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Styles' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'DUPLEX', label: 'Duplex' }
];

export const BrowseView: React.FC = () => {
  const {
    filteredAndSortedProperties,
    filters,
    setFilters,
    resetFilters,
    openModal,
    currentUser,
    setCurrentTab
  } = useApp();

  const handleProvinceSelect = (prov: string) => {
    setFilters(prev => ({
      ...prev,
      selectedProvince: prev.selectedProvince === prov ? '' : prov,
      selectedDistrict: '',
      selectedLocation: ''
    }));
  };

  const handleLocationToggle = (sector: string) => {
    setFilters(prev => ({
      ...prev,
      selectedLocation: prev.selectedLocation === sector ? '' : sector
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFilters(prev => {
      const exists = prev.selectedAmenities.includes(amenity);
      return {
        ...prev,
        selectedAmenities: exists
          ? prev.selectedAmenities.filter(a => a !== amenity)
          : [...prev.selectedAmenities, amenity]
      };
    });
  };

  // Available districts based on selected province
  const availableDistricts = filters.selectedProvince
    ? RWANDA_DISTRICTS_BY_PROVINCE[filters.selectedProvince as keyof typeof RWANDA_DISTRICTS_BY_PROVINCE] || []
    : [];

  return (
    <div id="browse-view-container" className="space-y-8">
      
      {/* Editorial landing hero */}
      <section className="relative rounded-xl overflow-hidden min-h-[420px] sm:min-h-[480px] flex items-end">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80"
          alt="Sunlit modern home with warm interiors"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/45 to-navy-950/20" />
        <div className="relative z-10 w-full p-6 sm:p-10 lg:p-12 text-left text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream-300 mb-3">
            Habify · Rwanda
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold tracking-tight leading-[1.1] max-w-xl">
            Find Where You Belong.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-cream-200 max-w-lg leading-relaxed">
            Discover rental homes matched to your budget, neighborhood, and the way you live.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => document.getElementById('browse-results')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-accent"
            >
              Explore properties
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentUser?.role === 'LANDLORD') openModal('ADD_EDIT_PROPERTY');
                else setCurrentTab('SIGNUP');
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/25 transition-colors"
            >
              List your property
            </button>
          </div>

          {/* Compact search strip */}
          <div className="mt-8 bg-white rounded-xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-navy-900 shadow-md max-w-4xl">
            <div className="lg:col-span-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-cream-600 px-1">Location</label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Kacyiru, Musanze…"
                className="w-full px-2 py-2 text-sm rounded-lg border-0 focus:ring-0 placeholder:text-cream-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-cream-600 px-1">Budget</label>
              <select
                value={filters.maxPrice}
                onChange={e => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                className="w-full px-2 py-2 text-sm rounded-lg bg-transparent border-0 focus:ring-0"
              >
                <option value={2000000}>Any budget</option>
                <option value={300000}>Up to 300k</option>
                <option value={500000}>Up to 500k</option>
                <option value={800000}>Up to 800k</option>
                <option value={1200000}>Up to 1.2M</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-cream-600 px-1">Type</label>
              <select
                value={filters.propertyType}
                onChange={e => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
                className="w-full px-2 py-2 text-sm rounded-lg bg-transparent border-0 focus:ring-0"
              >
                {PROPERTY_TYPES.map(t => (
                  <option key={t.value || 'all'} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-cream-600 px-1">Bedrooms</label>
              <select
                value={filters.minBedrooms}
                onChange={e => setFilters(prev => ({ ...prev, minBedrooms: Number(e.target.value) }))}
                className="w-full px-2 py-2 text-sm rounded-lg bg-transparent border-0 focus:ring-0"
              >
                <option value={0}>Any</option>
                <option value={1}>1+</option>
                <option value={2}>2+</option>
                <option value={3}>3+</option>
                <option value={4}>4+</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('browse-results')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary w-full self-end flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </section>

      <div className="text-left">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy-900">
          Find a home that fits your life.
        </h2>
        <p className="text-sm text-cream-600 mt-2 max-w-2xl">
          Browse curated listings across Rwanda — filter by province, budget, and the features that matter.
        </p>
      </div>

      {/* Rwanda Province Filter Tabs */}
      <div className="bg-white p-3 rounded-xl border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold uppercase tracking-wider text-cream-600 flex items-center gap-1 shrink-0 mr-1">
            <Globe2 className="w-3.5 h-3.5 text-terra-600" />
            Provinces:
          </span>

          <button
            onClick={() => handleProvinceSelect('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              filters.selectedProvince === ''
                ? 'bg-navy-900 text-white shadow-xs'
                : 'bg-cream-100 text-navy-900 hover:bg-cream-200'
            }`}
          >
            All Rwanda
          </button>

          {RWANDA_PROVINCES.map(prov => {
            const active = filters.selectedProvince === prov;
            return (
              <button
                key={prov}
                onClick={() => handleProvinceSelect(prov)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  active
                    ? 'bg-terra-600 text-white shadow-xs'
                    : 'bg-cream-100 text-navy-900 hover:bg-cream-200'
                }`}
              >
                <span>{prov}</span>
                {active && <Check className="w-3 h-3" />}
              </button>
            );
          })}
        </div>

        {/* Quick View on Spatial Map button */}
        <div className="flex items-center gap-2">
          {filters.selectedProvince && (
            <span className="text-xs font-semibold text-terra-900 bg-terra-100 px-2.5 py-1 rounded-lg border border-terra-200">
              Filtered: {filters.selectedProvince}
            </span>
          )}
        </div>
      </div>

      {/* Rwanda Secondary Cities & Key Sectors Quick Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-left">
        <span className="text-xs font-bold uppercase tracking-wider text-cream-600 flex items-center gap-1 shrink-0 mr-1">
          <MapPin className="w-3.5 h-3.5 text-terra-600" />
          Hubs:
        </span>

        <button
          onClick={() => setFilters(prev => ({ ...prev, selectedLocation: '' }))}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            filters.selectedLocation === ''
              ? 'bg-terra-600 text-white shadow-xs'
              : 'bg-white border border-cream-200 text-navy-900 hover:bg-cream-50'
          }`}
        >
          All Locations
        </button>

        {Object.entries(RWANDA_LOCATIONS_DATA)
          .filter(([_, info]) => !filters.selectedProvince || info.province === filters.selectedProvince)
          .map(([locName, info]) => {
            const active = filters.selectedLocation === locName;
            return (
              <button
                key={locName}
                onClick={() => handleLocationToggle(locName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
                  active
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-white border border-cream-200 text-navy-900 hover:bg-cream-50'
                }`}
              >
                <span>{locName}</span>
                <span className="text-[10px] text-cream-600 font-normal">({info.district})</span>
                {active && <Check className="w-3 h-3 text-terra-300" />}
              </button>
            );
          })}
      </div>

      {/* Main Layout Grid: Sidebar Filters + Property Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
        
        {/* Left Sidebar Filters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-cream-200 shadow-xs space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-cream-100">
              <div className="flex items-center gap-2 font-bold text-sm text-navy-900">
                <Filter className="w-4 h-4 text-terra-600" />
                <span>Filters</span>
              </div>
              <button
                onClick={resetFilters}
                className="text-xs text-cream-600 hover:text-terra-600 font-medium flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Province Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block">
                Rwanda Province
              </label>
              <select
                value={filters.selectedProvince}
                onChange={e => setFilters(prev => ({
                  ...prev,
                  selectedProvince: e.target.value,
                  selectedDistrict: '',
                  selectedLocation: ''
                }))}
                className="w-full px-3 py-2 rounded-lg border border-cream-300 text-xs font-semibold text-navy-900 bg-white focus:ring-2 focus:ring-terra-500"
              >
                <option value="">All Rwanda Provinces (5)</option>
                {RWANDA_PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* District Selector (Contextual) */}
            {availableDistricts.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block">
                  District ({filters.selectedProvince})
                </label>
                <select
                  value={filters.selectedDistrict}
                  onChange={e => setFilters(prev => ({ ...prev, selectedDistrict: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-cream-300 text-xs font-semibold text-navy-900 bg-white focus:ring-2 focus:ring-terra-500"
                >
                  <option value="">All {filters.selectedProvince} Districts</option>
                  {availableDistricts.map(d => (
                    <option key={d} value={d}>{d} District</option>
                  ))}
                </select>
              </div>
            )}

            {/* Monthly Rent Range */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 flex items-center justify-between">
                <span>Max Monthly Rent</span>
                <span className="font-mono text-terra-600 font-bold text-xs">
                  {filters.maxPrice >= 2000000 ? 'Any' : `${filters.maxPrice.toLocaleString()} RWF`}
                </span>
              </label>
              <input
                type="range"
                min="100000"
                max="2000000"
                step="50000"
                value={filters.maxPrice}
                onChange={e => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                className="w-full h-2 bg-cream-200 rounded-full appearance-none cursor-pointer accent-terra-600"
              />
              <div className="flex justify-between text-[10px] text-cream-600 font-mono">
                <span>100k RWF</span>
                <span>1M RWF</span>
                <span>2M+ RWF</span>
              </div>
            </div>

            {/* Property Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block">
                Property Style
              </label>
              <select
                value={filters.propertyType}
                onChange={e => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-cream-300 text-xs font-semibold text-navy-900 bg-white"
              >
                {PROPERTY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Bedrooms Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block">
                Bedrooms ({filters.minBedrooms > 0 ? `${filters.minBedrooms}+` : 'Any'})
              </label>
              <div className="grid grid-cols-5 gap-1">
                {[0, 1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setFilters(prev => ({ ...prev, minBedrooms: num }))}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filters.minBedrooms === num
                        ? 'bg-navy-900 text-white'
                        : 'bg-cream-100 hover:bg-cream-200 text-navy-900'
                    }`}
                  >
                    {num === 0 ? 'All' : `${num}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Must-Have Amenities */}
            <div className="space-y-2 pt-2 border-t border-cream-100">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block">
                Popular Features ({filters.selectedAmenities.length})
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {ALL_AMENITY_OPTIONS.slice(0, 8).map(amenity => {
                  const active = filters.selectedAmenities.includes(amenity);
                  return (
                    <label
                      key={amenity}
                      className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        active ? 'bg-terra-50 text-terra-900 font-semibold' : 'text-cream-700 hover:bg-cream-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="w-3.5 h-3.5 rounded text-terra-600 focus:ring-terra-500 border-cream-300"
                      />
                      <span className="truncate">{amenity}</span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Right Content: Property List & Sort Bar */}
        <div id="browse-results" className="lg:col-span-3 space-y-4">
          
          {/* Top Bar: Results Count & Sort Dropdown */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-cream-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-terra-600" />
              <span className="text-sm font-bold text-navy-900">
                {filteredAndSortedProperties.length} Properties Available
              </span>
              {(filters.selectedProvince || filters.selectedLocation) && (
                <span className="text-xs text-terra-600 font-medium hidden sm:inline">
                  in {filters.selectedLocation || filters.selectedProvince}
                </span>
              )}
            </div>

            {/* Sort Selection */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cream-600">Sort by:</span>
              <select
                value={filters.sortBy}
                onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="px-3 py-1.5 rounded-lg border border-cream-300 text-xs font-bold text-navy-900 bg-white focus:outline-none focus:ring-2 focus:ring-terra-500"
              >
                <option value="MATCH_SCORE">⚡ Highest Smart Match</option>
                <option value="PRICE_ASC">Price: Low to High</option>
                <option value="PRICE_DESC">Price: High to Low</option>
                <option value="QUALITY_SCORE">Listing Quality Score</option>
                <option value="POPULARITY">Most Popular & Viewed</option>
                <option value="NEWEST">Newest Listings</option>
              </select>
            </div>
          </div>

          {/* Properties Grid */}
          {filteredAndSortedProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredAndSortedProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-10 border border-cream-200 text-center space-y-3">
              <Building className="w-12 h-12 text-cream-300 mx-auto" />
              <h3 className="text-lg font-bold text-navy-900">No properties match your current filters</h3>
              <p className="text-xs text-cream-600 max-w-sm mx-auto">
                Try widening your budget range, clearing province/district filters, or relaxing bedroom constraints.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-terra-600 hover:bg-terra-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

