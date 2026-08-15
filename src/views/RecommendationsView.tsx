import React from 'react';
import { useApp } from '../context/AppContext';
import { PropertyCard } from '../components/PropertyCard';
import { SlidersHorizontal, Calculator } from 'lucide-react';

export const RecommendationsView: React.FC = () => {
  const { properties, preferences, getMatchExplanation, openModal } = useApp();

  const recommendedProperties = [...properties]
    .filter(p => p.isAvailable)
    .sort((a, b) => getMatchExplanation(b).totalScore - getMatchExplanation(a).totalScore);

  const topMatch = recommendedProperties[0];
  const topMatchScore = topMatch ? getMatchExplanation(topMatch).totalScore : 0;

  return (
    <div id="recommendations-view-container" className="space-y-8 text-left">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-sm text-cream-600">Matched to your preferences</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-navy-900 mt-1">
            Homes that fit your life
          </h1>
          <p className="text-sm text-cream-700 mt-3 leading-relaxed">
            Ranked by budget, neighborhood, bedrooms, and the amenities you care about.
            {topMatch && (
              <> Your strongest match is {topMatchScore}%.</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openModal('PREFERENCES')}
            className="btn-secondary text-xs flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Edit preferences
          </button>
          <button
            type="button"
            onClick={() => openModal('AFFORDABILITY_CALCULATOR')}
            className="btn-ghost text-xs flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Budget check
          </button>
        </div>
      </header>

      <p className="text-sm text-cream-700 border-y border-cream-200 py-4">
        Up to <strong className="font-semibold text-navy-900">{preferences.maxBudget.toLocaleString()} RWF</strong>
        {' · '}
        {preferences.preferredLocations.slice(0, 3).join(', ') || 'Any area'}
        {' · '}
        {preferences.minBedrooms}+ bedrooms
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendedProperties.map((property, idx) => (
          <div key={property.id} className="relative">
            {idx === 0 && (
              <p className="absolute -top-3 left-4 z-20 px-2.5 py-1 rounded-md bg-navy-900 text-white text-[11px] font-semibold">
                Strongest match · {topMatchScore}%
              </p>
            )}
            <PropertyCard property={property} />
          </div>
        ))}
      </div>
    </div>
  );
};
