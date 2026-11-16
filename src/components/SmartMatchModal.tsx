import React from 'react';
import { useApp } from '../context/AppContext';
import { Property, MatchScoreExplanation } from '../types';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
  DollarSign,
  Bed,
  Home,
  Wifi,
  Car,
  Armchair,
  Sliders,
  Calendar,
  MessageSquare,
  X,
  ShieldCheck
} from 'lucide-react';

interface SmartMatchModalProps {
  property: Property;
  matchExplanation?: MatchScoreExplanation;
}

export const SmartMatchModal: React.FC<SmartMatchModalProps> = ({
  property,
  matchExplanation: initialExplanation
}) => {
  const {
    preferences,
    getMatchExplanation,
    getAffordability,
    closeModal,
    openModal,
    currentUser
  } = useApp();

  const explanation = initialExplanation || getMatchExplanation(property);
  const affordability = getAffordability(property.monthlyRent);

  const getCriterionIcon = (criterion: string) => {
    switch (criterion) {
      case 'BUDGET': return <DollarSign className="w-4 h-4 text-tea-600" />;
      case 'LOCATION': return <MapPin className="w-4 h-4 text-tea-600" />;
      case 'BEDROOMS': return <Bed className="w-4 h-4 text-ink-700" />;
      case 'PROPERTY_TYPE': return <Home className="w-4 h-4 text-ink-700" />;
      case 'AMENITIES': return <Wifi className="w-4 h-4 text-ink-700" />;
      case 'FURNISHED': return <Armchair className="w-4 h-4 text-ink-700" />;
      case 'PARKING': return <Car className="w-4 h-4 text-ink-700" />;
      default: return <Sparkles className="w-4 h-4 text-tea-600" />;
    }
  };

  const score = explanation.totalScore;
  let ringColor = 'text-stone-400';
  let badgeLabel = 'Low Compatibility';

  if (score >= 85) {
    ringColor = 'text-tea-600';
    badgeLabel = 'Exceptional Match';
  } else if (score >= 70) {
    ringColor = 'text-tea-500';
    badgeLabel = 'Strong Match';
  } else if (score >= 50) {
    ringColor = 'text-saffron-400';
    badgeLabel = 'Moderate Match';
  }

  const handleBookingClick = () => {
    closeModal();
    if (!currentUser) {
      openModal('AUTH');
    } else {
      openModal('VIEWING_REQUEST', { property });
    }
  };

  const handleInquiryClick = () => {
    closeModal();
    if (!currentUser) {
      openModal('AUTH');
    } else {
      openModal('INQUIRY', { property });
    }
  };

  const handleAdjustPreferences = () => {
    closeModal();
    openModal('PREFERENCES');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[3px] overflow-y-auto">
      <div
        className="animate-pop bg-white rounded-3xl max-w-2xl w-full w-full border border-stone-200 overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header with Gradient Banner */}
        <div className={`palette-light topo p-6 sm:p-8 bg-tea-700 text-white relative`}>
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Score Ring */}
            <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center bg-white/5 rounded-lg p-2 border border-white/10 shadow-inner">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={ringColor}
                  strokeDasharray={`${score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold tracking-tight">{score}%</span>
                <span className="text-[10px] uppercase font-bold text-stone-200">Match</span>
              </div>
            </div>

            {/* Header Content */}
            <div className="text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/15 text-white backdrop-blur mb-2">
                <Sparkles className="w-3.5 h-3.5 text-saffron-300" />
                {badgeLabel}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold leading-tight line-clamp-1">
                {property.title}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 mt-1 flex items-center justify-center sm:justify-start gap-2">
                <span>{property.locationSector}</span>
                <span>•</span>
                <span className="font-semibold text-saffron-300">
                  {property.monthlyRent.toLocaleString()} RWF/mo
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[68vh] overflow-y-auto">
          
          {/* Section: Why this property matches you */}
          <div>
            <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-tea-600" />
              Why this property matches:
            </h3>
            <div className="bg-tea-50/70 border border-tea-200/80 rounded-lg p-4 space-y-2">
              {explanation.matchedReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-tea-900 font-medium">
                  <span className="text-tea-600 font-bold text-base leading-none">✓</span>
                  <span>{reason}</span>
                </div>
              ))}
              {explanation.matchedReasons.length === 0 && (
                <p className="text-xs text-stone-600 italic">No strong matches yet.</p>
              )}
            </div>
          </div>

          {/* Section: What could be better */}
          {explanation.improvementSuggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-tea-600" />
                What could be better:
              </h3>
              <div className="bg-saffron-50/70 border border-saffron-200/80 rounded-lg p-4 space-y-2">
                {explanation.improvementSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-saffron-900 font-medium">
                    <span className="text-tea-600 font-bold text-base leading-none">•</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: 7 Weighted Criteria Mathematical Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-tea-600" />
                Scoring Breakdown
              </h3>
              <span className="text-xs text-stone-600 font-mono">100%</span>
            </div>

            <div className="space-y-3">
              {explanation.criteriaBreakdown.map((item, idx) => {
                let barBg = 'bg-stone-300';
                if (item.status === 'MATCH') barBg = 'bg-tea-500';
                else if (item.status === 'PARTIAL') barBg = 'bg-tea-600';
                else barBg = 'bg-tea-400';

                return (
                  <div key={idx} className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-ink-800 mb-1">
                      <div className="flex items-center gap-2">
                        {getCriterionIcon(item.criterion)}
                        <span>{item.label}</span>
                        <span className="text-[10px] text-stone-600 font-normal">({item.weightPercentage}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-ink-900 font-bold">
                          {item.weightedScore} / {item.weightPercentage}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden my-1.5">
                      <div
                        className={`h-full ${barBg} rounded-full transition-all duration-500`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-700">
                      <span>{item.detail}</span>
                      <span className="font-medium uppercase text-[10px] px-1.5 py-0.5 rounded bg-white border border-stone-200">
                        {item.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Affordability Sanity Check */}
          <div className="palette-light bg-tea-700 text-white rounded-lg p-5 border border-tea-600 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-tea-400" />
                <h4 className="font-bold text-sm">Rent Affordability</h4>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                affordability.status === 'SAFE'
                  ? 'bg-tea-600 text-white'
                  : affordability.status === 'MODERATE'
                  ? 'bg-tea-600 text-white'
                  : 'bg-tea-500 text-ink-900'
              }`}>
                {affordability.status}
              </span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {affordability.adviceMessage}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-tea-600 text-xs">
              <div>
                <span className="text-stone-400 block text-[10px]">Rent/Income Ratio</span>
                <strong className="text-white font-mono text-sm">{affordability.rentToIncomeRatioPercentage}%</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Your Monthly Income</span>
                <strong className="text-white font-mono text-sm">{preferences.monthlyIncome.toLocaleString()} RWF</strong>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-stone-400 block text-[10px]">Max Safe Rent (30%)</span>
                <strong className="text-tea-400 font-mono text-sm">{affordability.maxRecommendedRent.toLocaleString()} RWF</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleAdjustPreferences}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-ink-900 bg-white border border-stone-300 hover:bg-stone-100 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-tea-600" />
            <span>Adjust Criteria</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInquiryClick}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-ink-900 bg-white border border-stone-300 hover:bg-stone-100 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-tea-600" />
              <span>Ask Question</span>
            </button>

            <button
              onClick={handleBookingClick}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-tea-700 hover:bg-tea-800 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Viewing</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
