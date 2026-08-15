import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Property } from '../types';
import {
  X,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Heart,
  Share2,
  Sparkles,
  Shield,
  Phone,
  Mail,
  Flag,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldCheck,
  Check
} from 'lucide-react';

interface PropertyDetailsModalProps {
  property: Property;
}

export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({ property }) => {
  const {
    currentUser,
    closeModal,
    openModal,
    isFavorite,
    toggleFavorite,
    getMatchExplanation,
    getListingQuality,
    addToast
  } = useApp();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const isFav = isFavorite(property.id);
  const match = getMatchExplanation(property);
  const quality = getListingQuality(property);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('success', 'Property listing link copied to clipboard!');
  };

  const handleBooking = () => {
    if (!currentUser) {
      openModal('AUTH');
    } else {
      openModal('VIEWING_REQUEST', { property });
    }
  };

  const handleInquiry = () => {
    if (!currentUser) {
      openModal('AUTH');
    } else {
      openModal('INQUIRY', { property });
    }
  };

  const handleReport = () => {
    if (!currentUser) {
      openModal('AUTH');
    } else {
      openModal('REPORT_PROPERTY', { property });
    }
  };

  const nextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-white rounded-xl max-w-4xl w-full shadow-xl border border-cream-200 overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-terra-600/20 text-terra-400 border border-terra-500/30">
              {property.propertyType}
            </span>
            <span className="text-xs text-cream-400 hidden sm:inline">•</span>
            <span className="text-xs text-cream-300 hidden sm:flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-terra-400" />
              {property.locationSector}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(property.id)}
              className={`p-2 rounded-lg transition-colors ${
                isFav ? 'bg-terra-600 text-white' : 'bg-navy-800 hover:bg-navy-700 text-cream-300'
              }`}
              title={isFav ? 'Remove Favorite' : 'Save Property'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-cream-300 transition-colors"
              title="Share Link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={closeModal}
              className="p-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-cream-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Main Gallery Carousel */}
          <div className="relative rounded-lg overflow-hidden bg-navy-900 aspect-16/9 group">
            <img
              src={property.images[activeImageIdx] || property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />

            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur text-white text-xs font-mono">
              {activeImageIdx + 1} / {property.images.length}
            </div>
          </div>

          {/* Thumbnails Row */}
          {property.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    activeImageIdx === idx ? 'border-terra-600 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Smart Match Banner */}
          <div
            onClick={() => openModal('SMART_MATCH', { property, matchExplanation: match })}
            className="p-4 rounded-lg bg-gradient-to-r from-navy-900 to-navy-800 text-white cursor-pointer hover:shadow-lg transition-all flex flex-wrap items-center justify-between gap-4 border border-navy-700"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-lg bg-terra-600/20 flex items-center justify-center flex-shrink-0 text-terra-400 border border-terra-600/40">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{match.totalScore}% Match</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-sage-600/80 text-white">
                    Smart Match
                  </span>
                </div>
                <p className="text-xs text-cream-300 mt-0.5">
                  {match.matchedReasons[0] || 'Matches your preferences'}
                </p>
              </div>
            </div>

            <button className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cream-50 text-navy-900 hover:bg-cream-100 transition-colors">
              Details →
            </button>
          </div>

          {/* Title & Key Specs Grid */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-navy-900 leading-tight">
                  {property.title}
                </h1>
                <p className="text-sm text-cream-600 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-terra-600 flex-shrink-0" />
                  <span>{property.address}</span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-2xl font-black text-navy-900">
                  {property.monthlyRent.toLocaleString()} <span className="text-sm font-semibold text-cream-600">RWF/mo</span>
                </div>
                <div className="text-xs text-cream-600">
                  Deposit: {property.securityDeposit.toLocaleString()} RWF
                </div>
              </div>
            </div>

            {/* Spec chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-cream-200 text-navy-700 text-sm">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cream-50 border border-cream-200">
                <Bed className="w-5 h-5 text-terra-600" />
                <div>
                  <div className="text-[10px] text-cream-600 font-semibold uppercase">Bedrooms</div>
                  <strong className="text-navy-900">{property.bedrooms} Beds</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cream-50 border border-cream-200">
                <Bath className="w-5 h-5 text-terra-600" />
                <div>
                  <div className="text-[10px] text-cream-600 font-semibold uppercase">Bathrooms</div>
                  <strong className="text-navy-900">{property.bathrooms} Baths</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cream-50 border border-cream-200">
                <Maximize2 className="w-5 h-5 text-terra-600" />
                <div>
                  <div className="text-[10px] text-cream-600 font-semibold uppercase">Floor Space</div>
                  <strong className="text-navy-900">{property.sizeSqm} m²</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cream-50 border border-cream-200">
                <ShieldCheck className="w-5 h-5 text-sage-600" />
                <div>
                  <div className="text-[10px] text-cream-600 font-semibold uppercase">Furnishing</div>
                  <strong className="text-navy-900">{property.isFurnished ? 'Furnished' : 'Unfurnished'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-base font-bold text-navy-900 mb-2">About this home</h3>
            <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities Grid */}
          <div>
            <h3 className="text-base font-bold text-navy-900 mb-3">Amenities & Features</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {property.amenities.map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-cream-50 border border-cream-200 text-xs font-medium text-navy-800"
                >
                  <Check className="w-4 h-4 text-sage-600 flex-shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Landlord Contact & Verification Card */}
          <div className="p-5 rounded-lg bg-navy-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-navy-800">
            <div className="flex items-center gap-3.5">
              <img
                src={property.landlordAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                alt={property.landlordName}
                className="w-12 h-12 rounded-lg object-cover ring-2 ring-terra-600"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">{property.landlordName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-sage-600 text-white font-bold border border-sage-500">
                    Verified
                  </span>
                </div>
                <div className="text-xs text-cream-400 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {property.landlordPhone || '+250 788 123 456'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {property.landlordEmail || 'landlord@habify.rw'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleInquiry}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-terra-600 hover:bg-terra-700 text-white transition-colors"
            >
              Message
            </button>
          </div>

          {/* Listing Quality Rating info */}
          <div className="p-3.5 rounded-lg bg-cream-50 border border-cream-200 text-xs text-navy-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-terra-600 flex-shrink-0" />
              <span>Listing Quality: <strong className="text-navy-900">{quality.score}/100</strong></span>
            </div>
            <button
              onClick={handleReport}
              className="text-cream-600 hover:text-terra-600 flex items-center gap-1 font-medium text-[11px] transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          </div>

        </div>

        {/* Modal Footer Fixed Bar */}
        <div className="p-4 sm:p-5 bg-cream-50 border-t border-cream-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-bold text-navy-900">
              {property.monthlyRent.toLocaleString()} <span className="text-xs font-normal text-cream-600">RWF/month</span>
            </div>
            <span className="text-[11px] text-cream-600">All fees included</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInquiry}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-navy-900 bg-cream-100 hover:bg-cream-200 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-terra-600" />
              <span>Ask Question</span>
            </button>

            <button
              onClick={handleBooking}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-terra-600 hover:bg-terra-700 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Viewing</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
