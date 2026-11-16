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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/55 backdrop-blur-[3px] overflow-y-auto">
      <div
        className="animate-pop bg-white rounded-3xl max-w-5xl w-full w-full border border-stone-200 overflow-hidden my-4 sm:my-8 text-left flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="palette-light topo p-5 sm:p-6 bg-tea-700 text-white flex items-center justify-between border-b border-tea-600">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-tea-700/30 border border-tea-500/40 flex items-center justify-center text-saffron-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Compare Properties</h2>
              <p className="text-xs text-stone-400">{properties.length} properties side-by-side</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-tea-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="p-5 sm:p-6 overflow-x-auto flex-1 text-ink-800">
          <div className="min-w-[650px] grid grid-cols-4 gap-4">
            
            {/* Metric Labels Column */}
            <div className="space-y-6 pt-36 text-xs font-bold uppercase tracking-wider text-stone-600">
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
                <div key={property.id} className="bg-stone-50 rounded-lg p-3 border border-stone-200 flex flex-col space-y-6">
                  
                  {/* Top image & title card */}
                  <div className="h-32 flex flex-col">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-20 rounded-lg object-cover"
                    />
                    <h4 className="text-xs font-bold text-ink-900 mt-2 line-clamp-1 truncate" title={property.title}>
                      {property.title}
                    </h4>
                  </div>

                  {/* Rent */}
                  <div className="h-8 flex items-center font-bold text-ink-900 text-sm font-mono">
                    {property.monthlyRent.toLocaleString()} RWF
                  </div>

                  {/* Smart Match */}
                  <div className="h-8 flex items-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-tea-600 text-white flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {match.totalScore}%
                    </span>
                  </div>

                  {/* Neighborhood */}
                  <div className="h-8 flex items-center text-xs font-semibold text-ink-700">
                    <MapPin className="w-3.5 h-3.5 text-tea-600 mr-1" />
                    {property.locationSector}
                  </div>

                  {/* Type */}
                  <div className="h-8 flex items-center text-xs font-medium uppercase text-ink-700">
                    {property.propertyType}
                  </div>

                  {/* Beds */}
                  <div className="h-8 flex items-center text-xs font-medium text-ink-700">
                    <Bed className="w-3.5 h-3.5 text-stone-600 mr-1" />
                    {property.bedrooms} Beds
                  </div>

                  {/* Baths */}
                  <div className="h-8 flex items-center text-xs font-medium text-ink-700">
                    <Bath className="w-3.5 h-3.5 text-stone-600 mr-1" />
                    {property.bathrooms} Baths
                  </div>

                  {/* Size */}
                  <div className="h-8 flex items-center text-xs font-medium text-ink-700">
                    <Maximize2 className="w-3.5 h-3.5 text-stone-600 mr-1" />
                    {property.sizeSqm} m²
                  </div>

                  {/* Furnished */}
                  <div className="h-8 flex items-center text-xs font-medium text-ink-700">
                    {property.isFurnished ? '✓ Furnished' : '— Unfurnished'}
                  </div>

                  {/* Parking */}
                  <div className="h-8 flex items-center text-xs font-medium text-ink-700">
                    {property.hasParking ? '✓ Dedicated' : '— Street Only'}
                  </div>

                  {/* Listing Quality */}
                  <div className="h-8 flex items-center text-xs font-bold text-ink-900">
                    {quality.score}% ({quality.tier})
                  </div>

                  {/* Booking Action */}
                  <div className="h-10 flex items-center">
                    <button
                      onClick={() => {
                        closeModal();
                        openModal('VIEWING_REQUEST', { property });
                      }}
                      className="w-full py-2 rounded-lg text-xs font-bold bg-tea-700 hover:bg-tea-800 text-white transition-colors flex items-center justify-center gap-1"
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
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={closeModal}
            className="px-5 py-2 text-xs font-bold bg-tea-700 hover:bg-tea-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
