import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PropertyCard } from '../components/PropertyCard';
import { Pagination } from '../components/Pagination';
import { SlidersHorizontal, Calculator } from 'lucide-react';

const PAGE_SIZE = 6;

export const RecommendationsView: React.FC = () => {
  const { properties, preferences, getMatchExplanation, openModal } = useApp();
  const [page, setPage] = useState(1);

  const recommendedProperties = useMemo(
    () =>
      [...properties]
        .filter(p => p.isAvailable)
        .sort((a, b) => getMatchExplanation(b).totalScore - getMatchExplanation(a).totalScore),
    [properties, getMatchExplanation]
  );

  const totalPages = Math.max(1, Math.ceil(recommendedProperties.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [preferences, recommendedProperties.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return recommendedProperties.slice(start, start + PAGE_SIZE);
  }, [recommendedProperties, page]);

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
        {' · '}
        <strong className="font-semibold text-navy-900">{recommendedProperties.length}</strong> matches
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginated.map((property, idx) => {
          const absoluteIndex = (page - 1) * PAGE_SIZE + idx;
          return (
            <div key={property.id} className="relative">
              {absoluteIndex === 0 && (
                <p className="absolute -top-3 left-4 z-20 px-2.5 py-1 rounded-md bg-navy-900 text-white text-[11px] font-semibold">
                  Strongest match · {topMatchScore}%
                </p>
              )}
              <PropertyCard property={property} />
            </div>
          );
        })}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={recommendedProperties.length}
        pageSize={PAGE_SIZE}
        onPageChange={next => {
          setPage(next);
          document.getElementById('recommendations-view-container')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }}
      />
    </div>
  );
};
