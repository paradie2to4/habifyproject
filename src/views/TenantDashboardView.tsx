import React from 'react';
import { useApp } from '../context/AppContext';
import { PropertyCard } from '../components/PropertyCard';
import { EmptyState } from '../components/EmptyState';
import { DashboardHero, heroGhostBtn, heroPrimaryBtn, todayLabel } from '../components/DashboardHero';
import {
  Heart,
  Calendar,
  MessageSquare,
  SlidersHorizontal,
  Calculator,
  Clock,
  ArrowRight,
  Check,
  Sparkles
} from 'lucide-react';

const greetingForHour = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const TenantDashboardView: React.FC = () => {
  const {
    currentUser,
    favorites,
    properties,
    viewingRequests,
    inquiries,
    preferences,
    topRecommendations,
    openModal,
    setCurrentTab
  } = useApp();

  if (!currentUser || currentUser.role !== 'TENANT') {
    return (
      <EmptyState
        title="Tenant dashboard"
        description="Sign in with a tenant account to see recommendations, saved homes, and viewings."
        actionLabel="Sign in"
        onAction={() => setCurrentTab('LOGIN')}
      />
    );
  }

  const firstName = (currentUser.fullName || 'there').split(' ')[0];
  const greeting = greetingForHour(new Date().getHours());

  const savedProperties = properties.filter(p => favorites.includes(p.id));
  const myViewings = viewingRequests.filter(v => v.tenantId === currentUser.id);
  const myInquiries = inquiries.filter(i => i.tenantId === currentUser.id);
  const upcomingViewings = myViewings.filter(
    v => v.status === 'PENDING' || v.status === 'APPROVED' || (v.status as string) === 'CONFIRMED'
  );
  const recommended = topRecommendations.slice(0, 3);

  const locationSummary =
    preferences.preferredLocations.length > 0
      ? preferences.preferredLocations.slice(0, 2).join(', ')
      : 'Kigali';

  return (
    <div id="tenant-dashboard-container" className="space-y-10 text-left">
      <DashboardHero
        eyebrow={todayLabel()}
        title={<>{greeting}, {firstName}</>}
        subtitle={`Homes ranked for ${locationSummary}, up to ${preferences.maxBudget.toLocaleString()} RWF a month.`}
        actions={
          <>
            <button type="button" onClick={() => setCurrentTab('RECOMMENDATIONS')} className={heroPrimaryBtn}>
              See your matches
              <ArrowRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => openModal('PREFERENCES')} className={heroGhostBtn}>
              <SlidersHorizontal className="w-4 h-4" />
              Preferences
            </button>
            <button type="button" onClick={() => openModal('AFFORDABILITY_CALCULATOR')} className={heroGhostBtn}>
              <Calculator className="w-4 h-4" />
              Budget
            </button>
          </>
        }
        stats={[
          {
            label: 'Top match',
            value: recommended[0] ? `${recommended[0].match.totalScore}%` : '—',
            hint: recommended[0]?.property.locationSector ?? 'Set your preferences',
            icon: Sparkles,
            onClick: () => setCurrentTab('RECOMMENDATIONS')
          },
          {
            label: 'Saved homes',
            value: savedProperties.length,
            hint: savedProperties.length ? 'Ready to compare' : 'Tap the heart on any home',
            icon: Heart,
            onClick: () => setCurrentTab('FAVORITES')
          },
          {
            label: 'Upcoming viewings',
            value: upcomingViewings.length,
            hint: upcomingViewings.length ? 'Check times in Messages' : 'Nothing booked yet',
            icon: Calendar,
            attention: upcomingViewings.length > 0,
            onClick: () => setCurrentTab('INQUIRIES')
          },
          {
            label: 'Conversations',
            value: myInquiries.length,
            hint: myInquiries.some(i => i.reply) ? 'You have replies' : 'Ask landlords anything',
            icon: MessageSquare,
            attention: myInquiries.some(i => i.reply),
            onClick: () => setCurrentTab('INQUIRIES')
          }
        ]}
      />

      <section>
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-section">Recommended for you</h2>
            <p className="text-sm text-stone-600 mt-1">
              Ranked for {locationSummary} · up to {preferences.maxBudget.toLocaleString()} RWF
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentTab('RECOMMENDATIONS')}
            className="text-sm font-medium text-ink-900 hover:text-tea-700 flex items-center gap-1"
          >
            See all <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {recommended.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommended.map(({ property }) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="We need a little more to match you."
            description="Set your budget and preferred areas, then we'll surface homes that fit."
            actionLabel="Set preferences"
            onAction={() => openModal('PREFERENCES')}
          />
        )}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 mb-5">
          <h2 className="text-section">Your saved homes</h2>
          {savedProperties.length > 0 && (
            <button
              type="button"
              onClick={() => setCurrentTab('FAVORITES')}
              className="text-sm font-medium text-ink-900 hover:text-tea-700 flex items-center gap-1"
            >
              View saved <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        {savedProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedProperties.slice(0, 3).map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
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
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <h2 className="text-section">Upcoming viewings</h2>
            <button
              type="button"
              onClick={() => setCurrentTab('BROWSE')}
              className="text-sm font-medium text-ink-900 hover:text-tea-700"
            >
              Book another
            </button>
          </div>
          {upcomingViewings.length > 0 ? (
            <ul className="divide-y divide-stone-200 border-t border-stone-200">
              {upcomingViewings.map(v => (
                <li key={v.id} className="py-4 flex items-center gap-3">
                  <img
                    src={v.propertyImage}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 truncate">{v.propertyTitle}</p>
                    <p className="text-xs text-stone-600 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {v.requestedDate}
                      <Clock className="w-3 h-3 ml-1" />
                      {v.requestedTimeSlot}
                    </p>
                  </div>
                  <span className="text-xs text-stone-700 capitalize">{v.status.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Calendar className="w-5 h-5" />}
              title="No viewings scheduled."
              description="When you request a walkthrough, it will show up here."
              actionLabel="Explore properties"
              onAction={() => setCurrentTab('BROWSE')}
            />
          )}
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <h2 className="text-section">Recent inquiries</h2>
            {myInquiries.length > 0 && (
              <button
                type="button"
                onClick={() => setCurrentTab('INQUIRIES')}
                className="text-sm font-medium text-ink-900 hover:text-tea-700"
              >
                View all
              </button>
            )}
          </div>
          {myInquiries.length > 0 ? (
            <ul className="divide-y divide-stone-200 border-t border-stone-200">
              {myInquiries.slice(0, 4).map(inq => (
                <li key={inq.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-ink-900 truncate">{inq.subject}</p>
                    <span className="text-xs text-stone-500 flex-shrink-0">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 mt-1 line-clamp-2">{inq.message}</p>
                  <p className="text-xs text-stone-500 mt-1.5">To {inq.landlordName}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<MessageSquare className="w-5 h-5" />}
              title="No conversations yet."
              description="Ask a landlord a question from any listing."
              actionLabel="Explore properties"
              onAction={() => setCurrentTab('BROWSE')}
            />
          )}
        </section>
      </div>

      <section className="border-t border-stone-200 pt-8">
        <h2 className="text-section mb-3">What you&apos;re looking for</h2>
        <p className="text-sm text-stone-700 leading-relaxed max-w-2xl">
          {preferences.minBedrooms}+ bedrooms in {locationSummary}. Budget up to{' '}
          {preferences.maxBudget.toLocaleString()} RWF a month
          {preferences.parkingRequired ? ', with parking' : ''}
          {preferences.furnishedRequired ? ', furnished' : ''}.
          {preferences.preferredAmenities.length > 0 && (
            <> Amenities: {preferences.preferredAmenities.slice(0, 4).join(', ')}.</>
          )}
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-800">
          {preferences.parkingRequired && (
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-tea-700" /> Parking
            </li>
          )}
          {preferences.furnishedRequired && (
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-tea-700" /> Furnished
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-tea-700" />
            {((preferences.maxBudget / Math.max(preferences.monthlyIncome, 1)) * 100).toFixed(0)}% of income
          </li>
        </ul>
        <button
          type="button"
          onClick={() => openModal('PREFERENCES')}
          className="mt-4 text-sm font-medium text-ink-900 hover:text-tea-700"
        >
          Edit preferences
        </button>
      </section>
    </div>
  );
};
