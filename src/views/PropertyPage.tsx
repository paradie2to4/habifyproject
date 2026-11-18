import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Property, AffordabilityStatus } from '../types';
import { fetchPropertyApi } from '../services/api';
import { normalizeImageList } from '../utils/images';
import { PropertyImage } from '../components/PropertyImage';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyDirections } from '../components/PropertyDirections';
import {
  ArrowLeft,
  Heart,
  Share2,
  Flag,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  Sofa,
  Car,
  Check,
  Calendar,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Images,
  Phone,
  Mail
} from 'lucide-react';

const AFFORD: Record<AffordabilityStatus, { label: string; tone: string }> = {
  SAFE: { label: 'Comfortable', tone: 'bg-tea-100 text-tea-800 border-tea-200' },
  MODERATE: { label: 'Manageable', tone: 'bg-stone-100 text-ink-800 border-stone-300' },
  HIGH_BURDEN: { label: 'Stretched', tone: 'bg-saffron-50 text-saffron-800 border-saffron-200' },
  UNREALISTIC: { label: 'High risk', tone: 'bg-saffron-100 text-saffron-900 border-saffron-300' }
};

const STATUS_BAR: Record<string, string> = {
  MATCH: 'bg-tea-600',
  PARTIAL: 'bg-tea-500',
  MISMATCH: 'bg-tea-800'
};

/** Tile spans for a 4×2 photo grid holding 1–5 photos (first photo is always the hero). */
function galleryTile(i: number, count: number): string {
  if (count === 1) return 'col-span-4 row-span-2';
  if (i === 0) return 'col-span-2 row-span-2';
  if (count === 2) return 'col-span-2 row-span-2';
  if (count === 3) return 'col-span-2';
  if (count === 4 && i === 1) return 'col-span-2';
  return '';
}

/** Circular score indicator. */
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 56 }) => {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const tone = score >= 80 ? 'var(--color-tea-600)' : score >= 60 ? 'var(--color-saffron-500)' : 'var(--color-saffron-700)';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${score}% match`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-stone-200)" strokeWidth="5" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={tone}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - score / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size / 4} fontWeight="700" fill="var(--color-ink-900)">
        {score}
      </text>
    </svg>
  );
};

const Lightbox: React.FC<{ images: string[]; start: number; seed: string; title: string; onClose: () => void }> = ({
  images,
  start,
  seed,
  title,
  onClose
}) => {
  const [idx, setIdx] = useState(start);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="palette-light fixed inset-0 z-[60] bg-black/95 flex flex-col" role="dialog" aria-modal="true" aria-label={`Photos of ${title}`}>
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm tabular-nums">{idx + 1} / {images.length}</span>
        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close photos">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 relative flex items-center justify-center px-4 sm:px-16 pb-6 min-h-0">
        <PropertyImage
          src={images[idx]}
          seedKey={`${seed}-${idx}`}
          alt={`${title} — photo ${idx + 1}`}
          className="max-h-full max-w-full object-contain rounded-lg"
        />
        {images.length > 1 && (
          <>
            <button type="button" onClick={prev} className="absolute left-2 sm:left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Previous photo">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button type="button" onClick={next} className="absolute right-2 sm:right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Next photo">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const PropertyPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const {
    properties,
    backendStatus,
    currentUser,
    openModal,
    isFavorite,
    toggleFavorite,
    getMatchExplanation,
    getListingQuality,
    getAffordability,
    addToast
  } = useApp();

  const fromList = properties.find(p => p.id === id);
  const [fetched, setFetched] = useState<Property | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [lightboxAt, setLightboxAt] = useState<number | null>(null);
  const property = fromList ?? fetched;

  // Shared links can point at listings that aren't in the loaded feed
  useEffect(() => {
    setNotFound(false);
    if (fromList || backendStatus === 'connecting') return;
    if (backendStatus === 'offline') {
      setNotFound(true);
      return;
    }
    let cancelled = false;
    fetchPropertyApi(id)
      .then(p => !cancelled && setFetched(p))
      .catch(() => !cancelled && setNotFound(true));
    return () => {
      cancelled = true;
    };
  }, [id, fromList, backendStatus]);

  // Tell floating buttons (chat) to clear the mobile booking bar
  useEffect(() => {
    document.body.dataset.bottomBar = 'true';
    return () => {
      delete document.body.dataset.bottomBar;
    };
  }, []);

  useEffect(() => {
    if (property) document.title = `${property.title} · Habify`;
    return () => {
      document.title = 'Habify | Find Where You Belong.';
    };
  }, [property]);

  const similar = useMemo(() => {
    if (!property) return [];
    return properties
      .filter(p => p.id !== property.id && p.isAvailable)
      .map(p => ({
        p,
        score:
          (p.locationSector === property.locationSector ? 3 : 0) +
          (p.district && p.district === property.district ? 1 : 0) +
          (p.propertyType === property.propertyType ? 1 : 0) +
          (Math.abs(p.monthlyRent - property.monthlyRent) / Math.max(property.monthlyRent, 1) < 0.25 ? 2 : 0)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.p);
  }, [properties, property]);

  if (!property) {
    if (notFound) {
      return (
        <div className="max-w-md mx-auto text-center py-24">
          <h1 className="font-display text-3xl font-semibold text-ink-900">Listing not found</h1>
          <p className="mt-2 text-sm text-stone-600">It may have been rented out or removed by the landlord.</p>
          <button type="button" onClick={() => navigate('/')} className="btn-primary rounded-full mt-6">
            Browse homes
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading listing">
        <div className="skeleton h-8 w-2/3 rounded-lg" />
        <div className="skeleton h-[420px] rounded-3xl" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            <div className="skeleton h-5 w-full rounded" />
            <div className="skeleton h-5 w-5/6 rounded" />
            <div className="skeleton h-5 w-4/6 rounded" />
          </div>
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const gallery = normalizeImageList(property.images, property.id);
  const match = getMatchExplanation(property);
  const quality = getListingQuality(property);
  const afford = getAffordability(property.monthlyRent);
  const affordMeta = AFFORD[afford.status];
  const isFav = isFavorite(property.id);
  const isOwner = currentUser?.id === property.landlordId;

  const requireUser = (then: () => void) => (currentUser ? then() : openModal('AUTH'));
  const book = () => requireUser(() => openModal('VIEWING_REQUEST', { property }));
  const message = () => requireUser(() => openModal('INQUIRY', { property }));
  const report = () => requireUser(() => openModal('REPORT_PROPERTY', { property }));

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      addToast('success', 'Link copied to clipboard');
    } catch {
      /* user cancelled share */
    }
  };

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

  const facts = [
    { icon: BedDouble, label: `${property.bedrooms} ${property.bedrooms === 1 ? 'bedroom' : 'bedrooms'}` },
    { icon: Bath, label: `${property.bathrooms} ${property.bathrooms === 1 ? 'bathroom' : 'bathrooms'}` },
    ...(property.sizeSqm > 0 ? [{ icon: Ruler, label: `${property.sizeSqm} m²` }] : []),
    { icon: Sofa, label: property.isFurnished ? 'Furnished' : 'Unfurnished' },
    ...(property.hasParking ? [{ icon: Car, label: 'Parking' }] : [])
  ];

  return (
    <article className="text-left pb-24 lg:pb-0 animate-[fadeUp_300ms_ease-out]">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button type="button" onClick={back} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900 hover:text-tea-700">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={share} className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-ink-900 hover:bg-stone-100">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            type="button"
            onClick={() => toggleFavorite(property.id)}
            aria-pressed={isFav}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-ink-900 hover:bg-stone-100"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-tea-600 text-tea-600' : ''}`} />
            <span className="hidden sm:inline">{isFav ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      <header className="mb-5">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900 leading-tight">
          {property.title}
        </h1>
        <p className="mt-2 text-sm text-stone-700 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-4 h-4 text-tea-600" />
            {property.address}
          </span>
          {property.district && <span>· {property.district}{property.province ? `, ${property.province}` : ''}</span>}
          {!property.isAvailable && (
            <span className="px-2 py-0.5 rounded-full bg-stone-200 text-ink-800 text-xs font-semibold">Currently occupied</span>
          )}
        </p>
      </header>

      {/* Gallery */}
      <div className="palette-light relative">
        <div className="hidden sm:grid grid-cols-4 grid-rows-2 gap-2 h-[460px] rounded-3xl overflow-hidden">
          {gallery.slice(0, 5).map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxAt(i)}
              className={`relative overflow-hidden bg-stone-200 group ${galleryTile(i, Math.min(gallery.length, 5))}`}
              aria-label={`Open photo ${i + 1}`}
            >
              <PropertyImage src={src} seedKey={`${property.id}-${i}`} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            </button>
          ))}
        </div>
        {/* Mobile: swipeable strip */}
        <div className="sm:hidden -mx-4 flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
          {gallery.map((src, i) => (
            <button key={i} type="button" onClick={() => setLightboxAt(i)} className="snap-center shrink-0 w-full aspect-[4/3] bg-stone-200" aria-label={`Open photo ${i + 1}`}>
              <PropertyImage src={src} seedKey={`${property.id}-${i}`} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setLightboxAt(0)}
          className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white text-ink-900 text-sm font-semibold shadow-md hover:bg-stone-100"
        >
          <Images className="w-4 h-4" />
          {gallery.length} photos
        </button>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Main column */}
        <div className="space-y-10 min-w-0">
          <ul className="flex flex-wrap gap-2.5" aria-label="Key facts">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-stone-200 text-sm text-ink-800">
                <Icon className="w-4 h-4 text-tea-600" />
                {label}
              </li>
            ))}
          </ul>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 mb-3">About this home</h2>
            <p className="text-[15px] leading-7 text-ink-700 whitespace-pre-line">{property.description || 'No description provided yet.'}</p>
          </section>

          {property.amenities.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-ink-900 mb-4">What this place offers</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {property.amenities.map(a => (
                  <li key={a} className="flex items-center gap-3 text-[15px] text-ink-800">
                    <span className="w-8 h-8 rounded-full bg-tea-100 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-tea-700" />
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Why it matches */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-ink-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-tea-600" />
                  Why it’s a {match.totalScore}% match
                </h2>
                <p className="mt-1 text-sm text-stone-700">
                  Scored against {currentUser ? 'your saved preferences' : 'default preferences — sign in to personalise'}.
                </p>
              </div>
              <ScoreRing score={match.totalScore} />
            </div>
            <ul className="mt-6 space-y-4">
              {match.criteriaBreakdown.map(c => (
                <li key={c.criterion}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-900">{c.label}</span>
                    <span className="tabular-nums text-stone-700">{Math.round(c.score)}%</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className={`h-full rounded-full ${STATUS_BAR[c.status] || 'bg-tea-500'}`} style={{ width: `${Math.max(4, Math.min(100, c.score))}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-stone-700">{c.detail}</p>
                </li>
              ))}
            </ul>
            {match.improvementSuggestions.length > 0 && (
              <div className="mt-6 pt-5 border-t border-stone-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-700 mb-2">Trade-offs</p>
                <ul className="space-y-1.5 text-sm text-ink-700 list-disc pl-5">
                  {match.improvementSuggestions.slice(0, 3).map(s => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Location and driving directions */}
          <PropertyDirections property={property} />

          {/* Landlord */}
          <section className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-2xl border border-stone-200 bg-white p-6">
            <img
              src={property.landlordAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'}
              alt=""
              className="w-16 h-16 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-700">Listed by</p>
              <p className="text-lg font-semibold text-ink-900 flex items-center gap-2">
                {property.landlordName}
                <ShieldCheck className="w-4 h-4 text-tea-600" aria-label="Verified" />
              </p>
              <div className="mt-1 text-sm text-stone-700 flex flex-wrap gap-x-4 gap-y-1">
                {property.landlordPhone && (
                  <a href={`tel:${property.landlordPhone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-stone-700 hover:text-tea-700">
                    <Phone className="w-3.5 h-3.5" /> {property.landlordPhone}
                  </a>
                )}
                {property.landlordEmail && (
                  <span className="inline-flex items-center gap-1 min-w-0">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{property.landlordEmail}</span>
                  </span>
                )}
              </div>
            </div>
            {!isOwner && (
              <button type="button" onClick={message} className="btn-secondary rounded-full inline-flex items-center gap-2 justify-center">
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
            )}
          </section>

          <div className="flex items-center justify-between text-xs text-stone-700">
            <span>Listing quality {quality.score}/100 · {property.viewsCount} views</span>
            {!isOwner && (
              <button type="button" onClick={report} className="inline-flex items-center gap-1 hover:text-tea-700 underline-offset-2 hover:underline">
                <Flag className="w-3.5 h-3.5" /> Report this listing
              </button>
            )}
          </div>
        </div>

        {/* Booking card */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-6 shadow-md space-y-5">
            <div>
              <p className="text-3xl font-bold text-ink-900 tabular-nums">
                {property.monthlyRent.toLocaleString()} <span className="text-base font-medium text-stone-700">RWF / month</span>
              </p>
              <p className="text-sm text-stone-700 mt-1">Deposit {property.securityDeposit.toLocaleString()} RWF</p>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <ScoreRing score={match.totalScore} size={52} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">{match.totalScore}% match for you</p>
                <p className="text-xs text-stone-700 line-clamp-2">{match.matchedReasons[0] || 'Based on your preferences'}</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${affordMeta.tone}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{affordMeta.label}</span>
                <span className="text-sm font-bold tabular-nums">{Math.round(afford.rentToIncomeRatioPercentage)}% of income</span>
              </div>
              <p className="text-xs mt-1 opacity-90 line-clamp-3">{afford.adviceMessage}</p>
            </div>

            {isOwner ? (
              <button type="button" onClick={() => openModal('ADD_EDIT_PROPERTY', { property })} className="btn-primary w-full rounded-full h-12">
                Edit listing
              </button>
            ) : (
              <div className="space-y-2.5">
                <button type="button" onClick={book} className="btn-accent w-full rounded-full h-12 inline-flex items-center justify-center gap-2 text-base">
                  <Calendar className="w-5 h-5" />
                  Book a viewing
                </button>
                <button type="button" onClick={message} className="btn-secondary w-full rounded-full h-12 inline-flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Ask the landlord
                </button>
              </div>
            )}
            <p className="text-center text-xs text-stone-700">Free to request · no commitment</p>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-5">Similar homes nearby</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {similar.map(p => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile booking bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="min-w-0">
          <p className="text-lg font-bold text-ink-900 tabular-nums leading-tight">{property.monthlyRent.toLocaleString()} RWF</p>
          <p className="text-xs text-stone-700">per month · {match.totalScore}% match</p>
        </div>
        {isOwner ? (
          <button type="button" onClick={() => openModal('ADD_EDIT_PROPERTY', { property })} className="btn-primary rounded-full px-5 h-11">
            Edit
          </button>
        ) : (
          <button type="button" onClick={book} className="btn-accent rounded-full px-5 h-11 inline-flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Book viewing
          </button>
        )}
      </div>

      {lightboxAt !== null && (
        <Lightbox images={gallery} start={lightboxAt} seed={property.id} title={property.title} onClose={() => setLightboxAt(null)} />
      )}
    </article>
  );
};
