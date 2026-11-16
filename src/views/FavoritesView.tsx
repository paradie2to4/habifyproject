import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PropertyCard } from '../components/PropertyCard';
import { EmptyState } from '../components/EmptyState';
import { Heart, Layers, CheckSquare, Square } from 'lucide-react';

export const FavoritesView: React.FC = () => {
  const { properties, favorites, openModal, setCurrentTab } = useApp();
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const savedProperties = properties.filter(p => favorites.includes(p.id));

  const toggleSelectCompare = (id: string) => {
    setSelectedForCompare(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(-3)
    );
  };

  const handleLaunchCompare = () => {
    const compared = properties.filter(p => selectedForCompare.includes(p.id));
    if (compared.length >= 2) {
      openModal('COMPARE_PROPERTIES', { properties: compared });
    }
  };

  return (
    <div id="favorites-view-container" className="space-y-8 text-left">
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900">Saved homes</h1>
          <p className="text-sm text-stone-600 mt-2">
            {savedProperties.length > 0
              ? `${savedProperties.length} shortlisted ${savedProperties.length === 1 ? 'home' : 'homes'}. Select two or three to compare.`
              : 'Properties you save will live here.'}
          </p>
        </div>
        {savedProperties.length >= 2 && (
          <button
            type="button"
            onClick={handleLaunchCompare}
            disabled={selectedForCompare.length < 2}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              selectedForCompare.length >= 2
                ? 'bg-tea-700 hover:bg-tea-600 text-white'
                : 'bg-stone-100 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Layers className="w-4 h-4" />
            Compare ({selectedForCompare.length}/3)
          </button>
        )}
      </header>

      {savedProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProperties.map(property => {
            const isSelected = selectedForCompare.includes(property.id);
            return (
              <div key={property.id} className="relative">
                <button
                  type="button"
                  onClick={() => toggleSelectCompare(property.id)}
                  className={`absolute top-3 left-3 z-20 p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-tea-700 text-white'
                      : 'bg-white/90 text-ink-900 border border-stone-200'
                  }`}
                  aria-pressed={isSelected}
                >
                  {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  Compare
                </button>
                <PropertyCard property={property} />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Heart className="w-5 h-5" />}
          title="Your future home starts here."
          description="Save properties you love and we'll keep them here."
          actionLabel="Explore properties"
          onAction={() => setCurrentTab('BROWSE')}
        />
      )}
    </div>
  );
};
