import React from 'react';
import { Property } from '../types';
import { useApp } from '../context/AppContext';
import {
  MapPin,
  Heart,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onSelect?: (property: Property) => void;
  showLandlordControls?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSelect,
  showLandlordControls = false
}) => {
  const {
    currentUser,
    isFavorite,
    toggleFavorite,
    getMatchExplanation,
    getListingQuality,
    openModal
  } = useApp();

  const isFav = isFavorite(property.id);
  const matchExplanation = getMatchExplanation(property);
  const quality = getListingQuality(property);
  const matchScore = matchExplanation.totalScore;

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(property);
    } else {
      openModal('PROPERTY_DETAILS', { property });
    }
  };

  const handleMatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('SMART_MATCH', { property, matchExplanation });
  };

  const handleViewingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      openModal('AUTH');
    } else {
      openModal('VIEWING_REQUEST', { property });
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(property.id);
  };

  void showLandlordControls;

  return (
    <div
      id={`property-card-${property.id}`}
      className="group bg-white rounded-xl border border-cream-200 hover:border-navy-300 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col overflow-hidden text-left cursor-pointer relative"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream-100">
        <img
          src={property.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/95 text-navy-900 shadow-xs">
            <MapPin className="w-3 h-3 text-terra-600" />
            {property.locationSector}
          </span>
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs z-10 pointer-events-none">
          <span className="font-semibold uppercase tracking-wider text-[10px] bg-navy-900/60 px-2 py-0.5 rounded-md">
            {property.propertyType}
          </span>
          {property.isFurnished && (
            <span className="bg-sage-700/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> Furnished
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 p-2 rounded-lg transition-all z-20 ${
            isFav
              ? 'bg-terra-600 text-white'
              : 'bg-white/90 text-navy-900 hover:bg-white'
          }`}
          aria-label={isFav ? 'Remove from saved' : 'Save property'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <button
            type="button"
            onClick={handleMatchClick}
            className={`text-xs font-semibold mb-1.5 ${
              matchScore >= 70 ? 'text-sage-700' : 'text-cream-700'
            }`}
          >
            {matchScore}% match
          </button>
          <h3 className="font-semibold text-navy-900 text-base leading-snug line-clamp-2">
            {property.title}
          </h3>
          <p className="text-xs text-cream-600 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cream-500 flex-shrink-0" />
            <span className="truncate">
              {property.locationSector}{property.district ? `, ${property.district}` : ''}
            </span>
          </p>
        </div>

        <p className="text-xs text-cream-700">
          {property.bedrooms} beds · {property.bathrooms} baths · {property.sizeSqm} m²
        </p>

        {property.amenities.length > 0 && (
          <p className="text-xs text-cream-600 line-clamp-1">
            {property.amenities.slice(0, 3).join(' · ')}
          </p>
        )}

        <div className="pt-2 flex items-center justify-between gap-3 border-t border-cream-100">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-navy-900">
              {property.monthlyRent.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-cream-600">RWF / month</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleViewingClick}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cream-100 text-navy-900 hover:bg-cream-200 transition-all"
              title="Request Viewing"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View</span>
            </button>
            <button
              type="button"
              onClick={handleCardClick}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-900 hover:bg-navy-800 text-white transition-all"
            >
              Details
            </button>
          </div>
        </div>
      </div>

      {(currentUser?.role === 'LANDLORD' || currentUser?.role === 'ADMIN') && (
        <div className="bg-cream-50 text-navy-700 text-[10px] px-4 py-2 flex items-center justify-between border-t border-cream-200">
          <span>Quality: <span className="font-semibold text-navy-900">{quality.score}%</span></span>
          <span className="text-cream-600">{property.viewsCount} views · {property.inquiriesCount} inquiries</span>
        </div>
      )}
    </div>
  );
};
