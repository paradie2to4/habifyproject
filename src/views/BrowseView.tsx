import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PropertyCard, PropertyCardSkeleton } from '../components/PropertyCard';
import { ListingsMap } from '../components/ListingsMap';
import { FilterState } from '../types';
import {
  ALL_AMENITY_OPTIONS,
  RWANDA_PROVINCES,
  RWANDA_DISTRICTS_BY_PROVINCE
} from '../data/seedData';
import {
  Search,
  SlidersHorizontal,
  X,
  Map as MapIcon,
  LayoutGrid,
  Columns2,
  Building,
  ArrowDownWideNarrow,
  Wifi,
  WifiOff,
  Briefcase,
  BellPlus,
  Check
} from 'lucide-react';
import { WorkplacePicker } from '../components/WorkplacePicker';
import { commuteTimes, loadWorkplace, Workplace, WORKPLACE_EVENT } from '../services/places';
import { createSavedSearchApi } from '../services/featuresApi';

const PROPERTY_TYPES: Array<{ value: string; label: string }> = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'DUPLEX', label: 'Duplex' }
];

const BUDGETS = [
  { value: 2000000, label: 'Any price' },
  { value: 300000, label: 'Under 300k' },
  { value: 500000, label: 'Under 500k' },
  { value: 800000, label: 'Under 800k' },
  { value: 1200000, label: 'Under 1.2M' }
];

const SORTS: Array<{ value: FilterState['sortBy']; label: string }> = [
  { value: 'MATCH_SCORE', label: 'Best match' },
  { value: 'PRICE_ASC', label: 'Price: low to high' },
  { value: 'PRICE_DESC', label: 'Price: high to low' },
  { value: 'NEWEST', label: 'Newest' },
  { value: 'POPULARITY', label: 'Most popular' },
  { value: 'QUALITY_SCORE', label: 'Listing quality' }
];

const BATCH = 12;
const MAX_PRICE = 2000000;

type Layout = 'split' | 'grid' | 'map';

const chipBase =
  'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap';
const chipIdle = 'bg-white border-stone-300 text-ink-800 hover:border-ink-400 hover:text-ink-900';
const chipOn = 'bg-tea-700 border-tea-700 text-white';

/** A select styled as a filter chip. */
const ChipSelect: React.FC<{
  label: string;
  value: string | number;
  active: boolean;
  onChange: (v: string) => void;
  children: React.ReactNode;
}> = ({ label, value, active, onChange, children }) => (
  <label className={`${chipBase} ${active ? chipOn : chipIdle} relative cursor-pointer pr-8`}>
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="appearance-none bg-transparent border-0 p-0 pr-1 text-sm font-medium focus:ring-0 cursor-pointer text-inherit"
    >
      {children}
    </select>
    <svg aria-hidden className="w-3.5 h-3.5 absolute right-3 pointer-events-none opacity-70" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  </label>
);

export const BrowseView: React.FC = () => {
  const {
    filteredAndSortedProperties: results,
    filters,
    setFilters,
    resetFilters,
    openModal,
    currentUser,
    setCurrentTab,
    backendStatus,
    properties,
    isLive,
    addToast
  } = useApp();

  // ---- Commute: drive time from each home to the visitor's workplace
  const [workplace, setWorkplace] = useState<Workplace | null>(() => loadWorkplace());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [commute, setCommute] = useState<Record<string, number | null>>({});
  const [commuteError, setCommuteError] = useState('');
  const [sortCommute, setSortCommute] = useState(false);

  useEffect(() => {
    const onChange = (e: Event) => {
      const w = (e as CustomEvent<Workplace | null>).detail;
      setWorkplace(w);
      setCommute({});
      setSortCommute(!!w);
    };
    window.addEventListener(WORKPLACE_EVENT, onChange);
    return () => window.removeEventListener(WORKPLACE_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!workplace) return;
    const todo = results
      .filter(p => !(p.id in commute) && Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .slice(0, 270)
      .map(p => ({ id: p.id, lat: p.latitude, lng: p.longitude }));
    if (!todo.length) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      commuteTimes(workplace, todo, ctrl.signal)
        .then(r => {
          setCommuteError('');
          setCommute(prev => ({ ...prev, ...r }));
        })
        .catch(e => !ctrl.signal.aborted && setCommuteError((e as Error).message));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workplace, results]);

  const ordered = useMemo(() => {
    if (!sortCommute || !workplace) return results;
    const v = (id: string) => (commute[id] == null ? Infinity : commute[id]!);
    return [...results].sort((a, b) => v(a.id) - v(b.id));
  }, [results, sortCommute, workplace, commute]);

  // ---- Save this search (alerts when a new home matches)
  const [savingSearch, setSavingSearch] = useState(false);
  const [savedSearchKey, setSavedSearchKey] = useState('');
  const knownSectors = useMemo(() => new Map(properties.map(p => [p.locationSector.toLowerCase(), p.locationSector])), [properties]);
  const filtersKey = JSON.stringify({ ...filters, sortBy: '' });

  const saveSearch = async () => {
    if (!currentUser) {
      addToast('info', 'Sign in to save this search and get alerts for new homes.');
      setCurrentTab('LOGIN');
      return;
    }
    if (!isLive) {
      addToast('warning', 'Saved searches need the live server. Please try again in a moment.');
      return;
    }
    const sectors = new Set<string>();
    if (filters.selectedLocation) sectors.add(filters.selectedLocation);
    const q = knownSectors.get(filters.searchQuery.trim().toLowerCase());
    if (q) sectors.add(q);
    setSavingSearch(true);
    try {
      const s = await createSavedSearchApi({
        sectors: [...sectors],
        province: filters.selectedProvince || undefined,
        district: filters.selectedDistrict || undefined,
        propertyType: filters.propertyType || undefined,
        maxRent: filters.maxPrice < MAX_PRICE ? filters.maxPrice : undefined,
        minBedrooms: filters.minBedrooms || undefined,
        furnished: filters.isFurnished || undefined,
        parking: filters.hasParking || undefined,
        amenities: filters.selectedAmenities
      });
      setSavedSearchKey(filtersKey);
      addToast('success', `Saved “${s.name}”. We’ll let you know when a new home matches.`);
    } catch (e) {
      addToast('error', (e as Error).message);
    } finally {
      setSavingSearch(false);
    }
  };

  const [layout, setLayout] = useState<Layout>('split');
  const [mobileMap, setMobileMap] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visible, setVisible] = useState(BATCH);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const loading = backendStatus === 'connecting';
  const shown = useMemo(() => ordered.slice(0, visible), [ordered, visible]);
  const hasMore = visible < results.length;

  // New filters → start from the first batch
  useEffect(() => setVisible(BATCH), [filters]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) setVisible(v => v + BATCH);
      },
      { rootMargin: '600px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shown.length]);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const toggleAmenity = (amenity: string) =>
    setFilters(prev => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenity)
        ? prev.selectedAmenities.filter(a => a !== amenity)
        : [...prev.selectedAmenities, amenity]
    }));

  const districts = filters.selectedProvince
    ? RWANDA_DISTRICTS_BY_PROVINCE[filters.selectedProvince as keyof typeof RWANDA_DISTRICTS_BY_PROVINCE] || []
    : [];

  // Removable chips for everything that narrows the results
  const activeChips: Array<{ key: string; label: string; clear: () => void }> = [];
  if (filters.searchQuery.trim()) activeChips.push({ key: 'q', label: `“${filters.searchQuery.trim()}”`, clear: () => set('searchQuery', '') });
  if (filters.selectedProvince) activeChips.push({ key: 'prov', label: filters.selectedProvince, clear: () => setFilters(p => ({ ...p, selectedProvince: '', selectedDistrict: '', selectedLocation: '' })) });
  if (filters.selectedDistrict) activeChips.push({ key: 'dist', label: `${filters.selectedDistrict} District`, clear: () => set('selectedDistrict', '') });
  if (filters.selectedLocation) activeChips.push({ key: 'loc', label: filters.selectedLocation, clear: () => set('selectedLocation', '') });
  if (filters.propertyType) activeChips.push({ key: 'type', label: PROPERTY_TYPES.find(t => t.value === filters.propertyType)?.label || filters.propertyType, clear: () => set('propertyType', '') });
  if (filters.maxPrice < MAX_PRICE) activeChips.push({ key: 'price', label: `Under ${filters.maxPrice.toLocaleString()} RWF`, clear: () => set('maxPrice', MAX_PRICE) });
  if (filters.minBedrooms > 0) activeChips.push({ key: 'beds', label: `${filters.minBedrooms}+ beds`, clear: () => set('minBedrooms', 0) });
  if (filters.isFurnished) activeChips.push({ key: 'furn', label: 'Furnished', clear: () => set('isFurnished', undefined) });
  if (filters.hasParking) activeChips.push({ key: 'park', label: 'Parking', clear: () => set('hasParking', undefined) });
  filters.selectedAmenities.forEach(a => activeChips.push({ key: `a-${a}`, label: a, clear: () => toggleAmenity(a) }));

  const moreCount =
    (filters.selectedDistrict ? 1 : 0) +
    (filters.isFurnished ? 1 : 0) +
    (filters.hasParking ? 1 : 0) +
    filters.selectedAmenities.length;

  const scrollToResults = () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const showMap = layout !== 'grid';
  const showList = layout !== 'map';
  const gridCols =
    layout === 'grid'
      ? 'sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
      : 'sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3';

  return (
    <div id="browse-view-container" className="space-y-6 text-left">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] bg-white border border-stone-200 topo-ink">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-4 p-6 sm:p-10 lg:p-12 xl:p-14">
          <div className="flex flex-col justify-center max-w-xl">
            <span className="eyebrow inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron-500" aria-hidden />
              {!loading && results.length > 0 ? `${results.length} homes across Rwanda` : 'Homes across Rwanda'}
            </span>
            <h1 className="mt-4 font-display font-bold text-ink-900 text-[2.6rem] leading-[1.02] sm:text-6xl xl:text-[4.25rem]">
              Find where you <span className="text-tea-700">belong</span><span className="text-saffron-500">.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-ink-600 leading-relaxed max-w-md">
              Homes matched to your budget, your neighborhood and the way you live, with an honest score for every one.
            </p>

            <form
              role="search"
              onSubmit={e => {
                e.preventDefault();
                scrollToResults();
              }}
              className="mt-8 flex items-center gap-2 bg-white rounded-2xl p-2 pl-4 border border-stone-300 focus-within:border-tea-600 focus-within:ring-4 focus-within:ring-tea-600/15 transition-[border-color,box-shadow]"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <Search className="w-5 h-5 text-stone-600 shrink-0" aria-hidden />
              <label htmlFor="hero-search" className="sr-only">Search by neighborhood, district or keyword</label>
              <input
                id="hero-search"
                type="search"
                value={filters.searchQuery}
                onChange={e => set('searchQuery', e.target.value)}
                placeholder="Kimihurura, Musanze, garden, generator…"
                className="flex-1 min-w-0 bg-transparent border-0 focus:ring-0 focus:outline-none text-ink-900 placeholder:text-stone-500 text-[15px] py-2"
              />
              <button type="submit" className="btn-primary h-11 px-5 sm:px-6">
                Search
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-stone-600 mr-1">Popular:</span>
              {['Kimihurura', 'Nyarutarama', 'Kacyiru', 'Kicukiro'].map(place => (
                <button
                  key={place}
                  type="button"
                  onClick={() => {
                    set('searchQuery', place);
                    scrollToResults();
                  }}
                  className="h-8 px-3 rounded-full bg-stone-100 text-ink-800 hover:bg-tea-50 hover:text-tea-800 transition-colors"
                >
                  {place}
                </button>
              ))}
            </div>
          </div>

          {/* Photo with floating proof points */}
          <div className="relative hidden sm:block min-h-[340px] lg:min-h-[460px]">
            <div className="palette-light absolute inset-0 lg:left-6 rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&auto=format&fit=crop&q=80"
                alt="Sunlit modern home with a garden"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/35 via-transparent to-transparent" />
            </div>

            <div
              className="animate-pop absolute left-0 bottom-8 w-64 rounded-2xl bg-white border border-stone-200 p-4"
              style={{ boxShadow: 'var(--shadow-lift)', animationDelay: '250ms' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-tea-800 bg-tea-50 px-2 py-1 rounded-full">92% match</span>
                <span className="text-xs text-stone-600">Kimihurura</span>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-ink-900 tabular-nums">
                350,000 <span className="font-sans text-xs font-medium text-stone-600">RWF / month</span>
              </p>
              <div className="mt-3 space-y-1.5">
                {['Within your budget', 'Water tank and backup power', 'Furnished, with a balcony'].map(t => (
                  <p key={t} className="text-xs text-ink-700 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-tea-100 text-tea-700 inline-flex items-center justify-center text-[10px]" aria-hidden>✓</span>
                    {t}
                  </p>
                ))}
              </div>
            </div>

            <div
              className="animate-pop absolute right-4 top-6 rounded-2xl bg-white/95 border border-stone-200 px-4 py-3 flex items-center gap-3"
              style={{ boxShadow: 'var(--shadow-card)', animationDelay: '400ms' }}
            >
              <span className="w-9 h-9 rounded-full bg-saffron-100 text-saffron-800 inline-flex items-center justify-center font-display font-bold">30%</span>
              <span className="text-xs leading-snug text-ink-700">
                Rule of thumb:
                <br />
                <span className="font-semibold text-ink-900">rent under 30% of income</span>
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-200 px-6 sm:px-10 lg:px-12 xl:px-14 py-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-ink-700">
          {[
            ['Verified landlords', 'Every listing tied to a real account'],
            ['Explainable scores', 'See exactly why a home fits'],
            ['Online viewings', 'Book a visit in a few taps']
          ].map(([title, sub]) => (
            <p key={title} className="flex items-baseline gap-2">
              <span className="font-semibold text-ink-900">{title}</span>
              <span className="hidden sm:inline text-stone-600">{sub}</span>
            </p>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => (currentUser?.role === 'LANDLORD' ? openModal('ADD_EDIT_PROPERTY') : setCurrentTab('SIGNUP'))}
              className="btn-ghost h-9 px-3 rounded-full"
            >
              List your home
            </button>
            <button type="button" onClick={() => openModal('AFFORDABILITY_CALCULATOR')} className="btn-secondary h-9 px-3.5 rounded-full">
              What can I afford?
            </button>
          </div>
        </div>
      </section>

      {/* Sticky filter toolbar */}
      <div
        ref={resultsRef}
        id="explore-results"
        className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-stone-50/85 backdrop-blur-xl border-b border-stone-200 scroll-mt-16"
      >
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <ChipSelect
            label="Province"
            value={filters.selectedProvince}
            active={!!filters.selectedProvince}
            onChange={v => setFilters(p => ({ ...p, selectedProvince: v, selectedDistrict: '', selectedLocation: '' }))}
          >
            <option value="">All Rwanda</option>
            {RWANDA_PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </ChipSelect>

          <ChipSelect label="Price" value={filters.maxPrice} active={filters.maxPrice < MAX_PRICE} onChange={v => set('maxPrice', Number(v))}>
            {BUDGETS.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </ChipSelect>

          <ChipSelect label="Property type" value={filters.propertyType} active={!!filters.propertyType} onChange={v => set('propertyType', v)}>
            <option value="">Any type</option>
            {PROPERTY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </ChipSelect>

          <ChipSelect label="Bedrooms" value={filters.minBedrooms} active={filters.minBedrooms > 0} onChange={v => set('minBedrooms', Number(v))}>
            <option value={0}>Any beds</option>
            {[1, 2, 3, 4].map(n => (
              <option key={n} value={n}>{n}+ beds</option>
            ))}
          </ChipSelect>

          <button
            type="button"
            onClick={() => set('isFurnished', filters.isFurnished ? undefined : true)}
            className={`${chipBase} ${filters.isFurnished ? chipOn : chipIdle}`}
            aria-pressed={!!filters.isFurnished}
          >
            Furnished
          </button>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={`${chipBase} ${workplace ? chipOn : chipIdle}`}
            title={workplace ? `Drive times to ${workplace.label}` : 'Show drive times to your work or school'}
          >
            <Briefcase className="w-4 h-4" />
            {workplace ? `Commute: ${workplace.label}` : 'Commute'}
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`${chipBase} ${moreCount ? chipOn : chipIdle}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {moreCount > 0 && (
              <span className="ml-0.5 min-w-5 h-5 px-1 rounded-full bg-tea-700 text-white text-[11px] font-bold inline-flex items-center justify-center">
                {moreCount}
              </span>
            )}
          </button>

          <div className="ml-auto flex items-center gap-2 pl-2">
            <ChipSelect
              label="Sort by"
              value={sortCommute && workplace ? 'COMMUTE' : filters.sortBy}
              active={false}
              onChange={v => {
                if (v === 'COMMUTE') {
                  if (workplace) setSortCommute(true);
                  else setPickerOpen(true);
                  return;
                }
                setSortCommute(false);
                set('sortBy', v as FilterState['sortBy']);
              }}
            >
              {SORTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
              <option value="COMMUTE">Shortest commute</option>
            </ChipSelect>

            <div className="hidden lg:flex items-center p-1 rounded-full bg-white border border-stone-300" role="group" aria-label="Layout">
              {([
                ['grid', LayoutGrid, 'Grid'],
                ['split', Columns2, 'List and map'],
                ['map', MapIcon, 'Map']
              ] as const).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLayout(value)}
                  aria-pressed={layout === value}
                  title={label}
                  className={`h-7 w-8 rounded-full inline-flex items-center justify-center transition-colors ${
                    layout === value ? 'bg-tea-700 text-white' : 'text-stone-700 hover:text-ink-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="sr-only">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result summary + active filter chips */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap text-sm">
          <span className="font-semibold text-ink-900" aria-live="polite">
            {loading ? 'Loading homes…' : `${results.length} ${results.length === 1 ? 'home' : 'homes'}`}
          </span>
          {backendStatus === 'online' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tea-700">
              <Wifi className="w-3 h-3" /> Live
            </span>
          ) : backendStatus === 'offline' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700" title="The API is unreachable — showing demo data">
              <WifiOff className="w-3 h-3" /> Demo data
            </span>
          ) : null}
          {activeChips.map(chip => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex items-center gap-1 h-7 pl-3 pr-2 rounded-full bg-saffron-50 text-saffron-900 border border-saffron-200 text-xs font-medium hover:bg-saffron-100"
              aria-label={`Remove filter ${chip.label}`}
            >
              {chip.label}
              <X className="w-3.5 h-3.5" />
            </button>
          ))}
          {activeChips.length > 1 && (
            <button type="button" onClick={resetFilters} className="text-xs font-semibold text-stone-700 hover:text-tea-700 underline-offset-2 hover:underline">
              Clear all
            </button>
          )}
          {commuteError && workplace && <span className="text-xs text-stone-600">{commuteError}</span>}
          {!loading && activeChips.length > 0 && (
            <button
              type="button"
              onClick={saveSearch}
              disabled={savingSearch || savedSearchKey === filtersKey}
              className="ml-auto inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold border border-tea-600 text-tea-800 hover:bg-tea-50 disabled:opacity-70"
              title="Get an alert when a new home matches these filters"
            >
              {savedSearchKey === filtersKey ? <Check className="w-3.5 h-3.5" /> : <BellPlus className="w-3.5 h-3.5" />}
              {savedSearchKey === filtersKey ? 'Search saved' : savingSearch ? 'Saving…' : 'Save search'}
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className={`grid gap-6 ${showMap && showList ? 'lg:grid-cols-[minmax(0,1fr)_minmax(380px,42%)]' : ''}`}>
        <div className={`${showList ? '' : 'hidden'} ${mobileMap ? 'hidden lg:block' : ''}`}>
          {loading ? (
            <div className={`grid grid-cols-1 gap-5 ${gridCols}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <div className={`grid grid-cols-1 gap-5 ${gridCols}`}>
                {shown.map(property => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    active={hoveredId === property.id}
                    onHoverChange={setHoveredId}
                    commuteS={workplace && property.id in commute ? commute[property.id] : undefined}
                    commuteLabel={workplace?.label}
                  />
                ))}
              </div>
              <div ref={sentinelRef} className="h-px" />
              {hasMore ? (
                <div className="flex justify-center pt-6">
                  <button type="button" onClick={() => setVisible(v => v + BATCH)} className="btn-secondary rounded-full">
                    Show more homes
                  </button>
                </div>
              ) : results.length > BATCH ? (
                <p className="text-center text-xs text-stone-600 pt-6">You’ve seen all {results.length} homes.</p>
              ) : null}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white topo-ink p-10 sm:p-14 text-center">
              <Building className="w-10 h-10 text-stone-500 mx-auto" aria-hidden />
              <h2 className="mt-4 text-lg font-semibold text-ink-900">No homes match these filters</h2>
              <p className="mt-1.5 text-sm text-stone-600 max-w-sm mx-auto">
                Try a higher budget, fewer must-have features, or a wider area.
              </p>
              <button type="button" onClick={resetFilters} className="btn-primary rounded-full mt-5">
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {showMap && (
          <aside
            className={`${mobileMap ? 'block' : 'hidden'} lg:block ${
              layout === 'map' ? 'h-[calc(100vh-12rem)]' : 'h-[calc(100vh-12rem)] lg:sticky lg:top-40'
            } rounded-2xl overflow-hidden border border-stone-200`}
          >
            <ListingsMap
              properties={loading ? [] : results}
              activeId={hoveredId}
              onHover={setHoveredId}
              onSelect={p => openModal('PROPERTY_DETAILS', { property: p })}
            />
          </aside>
        )}
      </div>

      {/* Mobile list/map switch */}
      <button
        type="button"
        onClick={() => setMobileMap(m => !m)}
        className="lg:hidden fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 px-5 h-11 rounded-full bg-tea-700 text-white text-sm font-semibold shadow-lg active:scale-95 transition-transform"
      >
        {mobileMap ? <LayoutGrid className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
        {mobileMap ? 'Show list' : 'Show map'}
      </button>

      {pickerOpen && <WorkplacePicker current={workplace} onClose={() => setPickerOpen(false)} />}

      {/* More-filters drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="filters-title">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col animate-[slideIn_200ms_ease-out]">
            <div className="flex items-center justify-between px-6 h-16 border-b border-stone-200">
              <h2 id="filters-title" className="text-lg font-semibold text-ink-900">Filters</h2>
              <button type="button" onClick={() => setDrawerOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-stone-100" aria-label="Close filters">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              <section>
                <h3 className="text-sm font-semibold text-ink-900 mb-3">Maximum monthly rent</h3>
                <input
                  type="range"
                  min={100000}
                  max={MAX_PRICE}
                  step={50000}
                  value={filters.maxPrice}
                  onChange={e => set('maxPrice', Number(e.target.value))}
                  className="w-full accent-tea-600"
                  aria-valuetext={filters.maxPrice >= MAX_PRICE ? 'Any' : `${filters.maxPrice.toLocaleString()} RWF`}
                />
                <p className="mt-1 text-sm font-semibold text-tea-700 tabular-nums">
                  {filters.maxPrice >= MAX_PRICE ? 'Any price' : `Up to ${filters.maxPrice.toLocaleString()} RWF`}
                </p>
              </section>

              {districts.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-ink-900 mb-3">District in {filters.selectedProvince}</h3>
                  <div className="flex flex-wrap gap-2">
                    {districts.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => set('selectedDistrict', filters.selectedDistrict === d ? '' : d)}
                        className={`${chipBase} ${filters.selectedDistrict === d ? chipOn : chipIdle}`}
                        aria-pressed={filters.selectedDistrict === d}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-sm font-semibold text-ink-900 mb-3">Essentials</h3>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => set('isFurnished', filters.isFurnished ? undefined : true)} className={`${chipBase} ${filters.isFurnished ? chipOn : chipIdle}`} aria-pressed={!!filters.isFurnished}>
                    Furnished
                  </button>
                  <button type="button" onClick={() => set('hasParking', filters.hasParking ? undefined : true)} className={`${chipBase} ${filters.hasParking ? chipOn : chipIdle}`} aria-pressed={!!filters.hasParking}>
                    Parking
                  </button>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-ink-900 mb-3">Must-have features</h3>
                <div className="flex flex-wrap gap-2">
                  {ALL_AMENITY_OPTIONS.map(a => {
                    const on = filters.selectedAmenities.includes(a);
                    return (
                      <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`${chipBase} ${on ? chipOn : chipIdle}`} aria-pressed={on}>
                        {a}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between gap-3">
              <button type="button" onClick={resetFilters} className="text-sm font-semibold text-ink-900 underline underline-offset-2">
                Clear all
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  scrollToResults();
                }}
                className="btn-primary rounded-full px-6 inline-flex items-center gap-2"
              >
                <ArrowDownWideNarrow className="w-4 h-4" />
                Show {results.length} {results.length === 1 ? 'home' : 'homes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
