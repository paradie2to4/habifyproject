import React from 'react';
import { Property } from '../types';
import { useApp } from '../context/AppContext';
import { PropertyImage } from './PropertyImage';
import { MapPin, Heart, BedDouble, Bath, Ruler, Sparkles, Sofa } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onSelect?: (property: Property) => void;
  showLandlordControls?: boolean;
  /** Highlighted because its map pin is hovered. */
  active?: boolean;
  onHoverChange?: (id: string | null) => void;
}

function matchTone(score: number) {
  if (score >= 80) return 'bg-tea-600 text-white';
  if (score >= 60) return 'bg-white/95 text-ink-900';
  return 'bg-black/55 text-white';
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSelect,
  showLandlordControls = false,
  active = false,
  onHoverChange
}) => {
  const { currentUser, isFavorite, toggleFavorite, getMatchExplanation, getListingQuality, openModal } = useApp();

  const isFav = isFavorite(property.id);
  const matchExplanation = getMatchExplanation(property);
  const matchScore = matchExplanation.totalScore;
  const showOwnerStats = currentUser?.role === 'LANDLORD' || currentUser?.role === 'ADMIN';

  const open = () => {
    if (onSelect) onSelect(property);
    else openModal('PROPERTY_DETAILS', { property });
  };

  const handleMatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('SMART_MATCH', { property, matchExplanation });
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(property.id);
  };

  void showLandlordControls;

  return (
    <article
      id={`property-card-${property.id}`}
      role="link"
      tabIndex={0}
      aria-label={`${property.title}, ${property.monthlyRent.toLocaleString()} RWF per month`}
      onClick={open}
      onKeyDown={e => {
        if (e.key === 'Enter') open();
      }}
      onMouseEnter={() => onHoverChange?.(property.id)}
      onMouseLeave={() => onHoverChange?.(null)}
      className={`group relative flex flex-col text-left cursor-pointer rounded-2xl bg-white border transition-all duration-300 overflow-hidden
        hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2
        ${active ? 'border-tea-700 shadow-md -translate-y-0.5' : 'border-stone-200 shadow-xs'}`}
    >
      <div className="palette-light relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <PropertyImage
          images={property.images}
          seedKey={property.id}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 pointer-events-none" />

        <button
          type="button"
          onClick={handleMatchClick}
          className={`absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-xs ${matchTone(matchScore)}`}
          aria-label={`${matchScore}% match — see why`}
        >
          <Sparkles className="w-3 h-3" />
          {matchScore}% match
        </button>

        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all active:scale-90 ${
            isFav ? 'bg-tea-700 text-white' : 'bg-white/90 text-ink-900 hover:bg-white'
          }`}
          aria-label={isFav ? 'Remove from saved' : 'Save property'}
          aria-pressed={isFav}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>

        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-white text-[11px] font-semibold z-10 pointer-events-none">
          <span className="uppercase tracking-wider bg-black/45 backdrop-blur-sm px-2 py-0.5 rounded-md">
            {property.propertyType.toLowerCase()}
          </span>
          {property.isFurnished && (
            <span className="inline-flex items-center gap-1 bg-black/45 backdrop-blur-sm px-2 py-0.5 rounded-md">
              <Sofa className="w-3 h-3" /> Furnished
            </span>
          )}
          {property.featured && (
            <span className="ml-auto bg-saffron-400 text-saffron-900 px-2 py-0.5 rounded-md">Featured</span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-[22px] font-bold text-ink-900 tabular-nums tracking-tight">
            {property.monthlyRent.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-stone-600">RWF / month</span>
        </div>

        <h3 className="font-semibold text-ink-900 text-[15px] leading-snug line-clamp-1 group-hover:text-tea-700 transition-colors">
          {property.title}
        </h3>

        <p className="text-xs text-stone-600 flex items-center gap-1 min-w-0">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-tea-600" />
          <span className="truncate">
            {property.locationSector}
            {property.district ? `, ${property.district}` : ''}
          </span>
        </p>

        <div className="mt-auto pt-3 flex items-center gap-4 text-xs text-ink-700 border-t border-stone-100">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-stone-600" />
            {property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath className="w-4 h-4 text-stone-600" />
            {property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}
          </span>
          {property.sizeSqm > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-stone-600" />
              {property.sizeSqm} m²
            </span>
          )}
        </div>
      </div>

      {showOwnerStats && (
        <div className="bg-stone-50 text-ink-700 text-[11px] px-4 py-2 flex items-center justify-between border-t border-stone-200">
          <span>
            Quality <span className="font-semibold text-ink-900">{getListingQuality(property).score}%</span>
          </span>
          <span className="text-stone-600">
            {property.viewsCount} views · {property.inquiriesCount} inquiries
          </span>
        </div>
      )}
    </article>
  );
};

export const PropertyCardSkeleton: React.FC = () => (
  <div className="rounded-2xl bg-white border border-stone-200 overflow-hidden" aria-hidden="true">
    <div className="skeleton aspect-[4/3]" />
    <div className="p-4 space-y-3">
      <div className="skeleton h-6 w-1/2 rounded-md" />
      <div className="skeleton h-4 w-4/5 rounded-md" />
      <div className="skeleton h-3 w-2/5 rounded-md" />
      <div className="pt-3 flex gap-4 border-t border-stone-100">
        <div className="skeleton h-4 w-14 rounded-md" />
        <div className="skeleton h-4 w-14 rounded-md" />
        <div className="skeleton h-4 w-14 rounded-md" />
      </div>
    </div>
  </div>
);
