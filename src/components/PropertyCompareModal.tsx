import React from 'react';
import { useApp } from '../context/AppContext';
import { Property } from '../types';
import {
  X,
  Sparkles,
  Bed,
  Bath,
  Maximize2,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';

interface PropertyCompareModalProps {
  properties: Property[];
}

export const PropertyCompareModal: React.FC<PropertyCompareModalProps> = ({ properties }) => {
  const { closeModal, openModal, getMatchExplanation, getListingQuality } = useApp();

  if (!properties || properties.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-white rounded-xl max-w-5xl w-full shadow-xl border border-cream-200 overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200 text-left flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-terra-600/30 border border-terra-500/40 flex items-center justify-center text-terra-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Compare Properties</h2>
              <p className="text-xs text-cream-400">{properties.length} properties side-by-side</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 text-cream-400 hover:text-white rounded-lg hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="p-5 sm:p-6 overflow-x-auto flex-1 text-navy-800">
          <div className="min-w-[650px] grid grid-cols-4 gap-4">
            
            {/* Metric Labels Column */}
            <div className="space-y-6 pt-36 text-xs font-bold uppercase tracking-wider text-cream-600">
              <div className="h-8 flex items-center">Monthly Rent</div>
              <div className="h-8 flex items-center">Smart Match %</div>
              <div className="h-8 flex items-center">Neighborhood</div>
              <div className="h-8 flex items-center">Property Style</div>
              <div className="h-8 flex items-center">Bedrooms</div>
              <div className="h-8 flex items-center">Bathrooms</div>
              <div className="h-8 flex items-center">Floor Space</div>
              <div className="h-8 flex items-center">Furnished</div>
              <div className="h-8 flex items-center">Dedicated Parking</div>
              <div className="h-8 flex items-center">Listing Quality</div>
              <div className="h-10 flex items-center">Actions</div>
            </div>

            {/* Compared Properties Columns */}
            {properties.map(property => {
              const match = getMatchExplanation(property);
              const quality = getListingQuality(property);

              return (
                <div key={property.id} className="bg-cream-50 rounded-lg p-3 border border-cream-200 flex flex-col space-y-6">
                  
                  {/* Top image & title card */}
                  <div className="h-32 flex flex-col">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-20 rounded-lg object-cover"
                    />
                    <h4 className="text-xs font-bold text-navy-900 mt-2 line-clamp-1 truncate" title={property.title}>
                      {property.title}
                    </h4>
                  </div>

                  {/* Rent */}
                  <div className="h-8 flex items-center font-black text-navy-900 text-sm font-mono">
                    {property.monthlyRent.toLocaleString()} RWF
                  </div>

                  {/* Smart Match */}
                  <div className="h-8 flex items-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sage-600 text-white flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {match.totalScore}%
                    </span>
                  </div>

                  {/* Neighborhood */}
                  <div className="h-8 flex items-center text-xs font-semibold text-navy-700">
                    <MapPin className="w-3.5 h-3.5 text-terra-600 mr-1" />
                    {property.locationSector}
                  </div>

                  {/* Type */}
                  <div className="h-8 flex items-center text-xs font-medium uppercase text-navy-700">
                    {property.propertyType}
                  </div>

                  {/* Beds */}
                  <div className="h-8 flex items-center text-xs font-medium text-navy-700">
                    <Bed className="w-3.5 h-3.5 text-cream-600 mr-1" />
                    {property.bedrooms} Beds
                  </div>

                  {/* Baths */}
                  <div className="h-8 flex items-center text-xs font-medium text-navy-700">
                    <Bath className="w-3.5 h-3.5 text-cream-600 mr-1" />
                    {property.bathrooms} Baths
                  </div>

                  {/* Size */}
                  <div className="h-8 flex items-center text-xs font-medium text-navy-700">
                    <Maximize2 className="w-3.5 h-3.5 text-cream-600 mr-1" />
                    {property.sizeSqm} m²
                  </div>

                  {/* Furnished */}
                  <div className="h-8 flex items-center text-xs font-medium text-navy-700">
                    {property.isFurnished ? '✓ Furnished' : '— Unfurnished'}
                  </div>

                  {/* Parking */}
                  <div className="h-8 flex items-center text-xs font-medium text-navy-700">
                    {property.hasParking ? '✓ Dedicated' : '— Street Only'}
                  </div>

                  {/* Listing Quality */}
                  <div className="h-8 flex items-center text-xs font-bold text-navy-900">
                    {quality.score}% ({quality.tier})
                  </div>

                  {/* Booking Action */}
                  <div className="h-10 flex items-center">
                    <button
                      onClick={() => {
                        closeModal();
                        openModal('VIEWING_REQUEST', { property });
                      }}
                      className="w-full py-2 rounded-lg text-xs font-bold bg-terra-600 hover:bg-terra-700 text-white transition-colors flex items-center justify-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book</span>
                    </button>
                  </div>

                </div>
              );
            })}

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-cream-50 border-t border-cream-200 flex justify-end">
          <button
            onClick={closeModal}
            className="px-5 py-2 text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
