import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, matchPath } from 'react-router-dom';
import { MessageCircle, X, ArrowUp, Sparkles, RotateCcw, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Property } from '../types';
import { PropertyImage } from './PropertyImage';
import { AffordabilityCalculator } from '../services/affordabilityCalculator';
import { RWANDA_LOCATIONS_DATA } from '../data/rwandaLocations';
import { PROPERTY_ROUTE, propertyPath } from '../routes';
import {
  detectIntent,
  describeCriteria,
  searchListings,
  relax,
  fmt,
  FAQ,
  SearchCriteria
} from '../services/assistantEngine';

interface Action {
  label: string;
  run: () => void;
  primary?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  homes?: Property[];
  actions?: Action[];
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const HabifyChatbot: React.FC = () => {
  const app = useApp();
  const {
    currentUser,
    properties,
    preferences,
    viewings,
    inquiries,
    getMatchExplanation,
    getListingQuality,
    setFilters,
    resetFilters,
    setCurrentTab,
    openModal,
    updatePreferences
  } = app;
  const navigate = useNavigate();
  const location = useLocation();
  const propertyId = matchPath(PROPERTY_ROUTE, location.pathname)?.params.id;
  const currentHome = propertyId ? properties.find(p => p.id === propertyId) : undefined;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const firstName = currentUser?.fullName?.split(' ')[0];

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Suggestions follow what the person is doing right now
  const suggestions = useMemo(() => {
    if (currentHome) return ['Why is this a good match?', 'Can I afford this home?', 'Show similar homes', 'Book a viewing here'];
    if (currentUser?.role === 'LANDLORD') return ['Any pending viewing requests?', 'How do I improve my listing?', 'Any unread messages?'];
    if (currentUser?.role === 'TENANT') {
      return ['Show my best matches', 'What rent can I afford?', 'My viewings', `2-bed in ${preferences.preferredLocations[0] || 'Kimihurura'} under 500k`];
    }
    return ['Furnished apartment in Kigali under 400k', 'Tell me about Nyarutarama', 'What rent can I afford?', 'How do I list my home?'];
  }, [currentHome, currentUser?.role, preferences.preferredLocations]);

  const go = (path: string) => {
    navigate(path);
    if (window.innerWidth < 640) setOpen(false);
  };

  const applyToExplore = (c: SearchCriteria) => {
    resetFilters();
    setFilters(prev => ({
      ...prev,
      searchQuery: '',
      selectedProvince: c.provinces[0] || '',
      selectedDistrict: c.districts[0] || '',
      selectedLocation: c.sectors.length === 1 ? c.sectors[0] : '',
      propertyType: c.propertyType || '',
      maxPrice: c.maxRent ?? 2000000,
      minPrice: c.minRent ?? 0,
      minBedrooms: c.minBedrooms ?? 0,
      isFurnished: c.furnished,
      hasParking: c.parking || undefined,
      selectedAmenities: []
    }));
    go('/');
  };

  const rankByMatch = (homes: Property[]) =>
    [...homes].sort((a, b) => getMatchExplanation(b).totalScore - getMatchExplanation(a).totalScore);

  // ---------------------------------------------------------------------------
  // Reply builder
  // ---------------------------------------------------------------------------
  const reply = (text: string): Omit<ChatMessage, 'id' | 'role'> => {
    const intent = detectIntent(text, { onPropertyPage: !!currentHome });
    const income = preferences.monthlyIncome;

    switch (intent.kind) {
      case 'greeting':
        return {
          text: `Muraho${firstName ? `, ${firstName}` : ''}! Tell me what you’re looking for in your own words, like “3-bed house in Kicukiro with a garden under 800k”, and I’ll find it.`
        };

      case 'thanks':
        return { text: 'Anytime. Ask me whenever you need a hand finding or comparing homes.' };

      case 'search': {
        const c = intent.criteria;
        const found = rankByMatch(searchListings(properties, c));
        const what = describeCriteria(c);
        if (found.length) {
          const actions: Action[] = [{ label: `See all ${found.length} on the map`, run: () => applyToExplore(c), primary: true }];
          if (currentUser?.role === 'TENANT' && (c.maxRent || c.sectors.length)) {
            actions.push({
              label: 'Save as my preferences',
              run: () =>
                updatePreferences({
                  ...(c.maxRent ? { maxBudget: c.maxRent } : {}),
                  ...(c.sectors.length ? { preferredLocations: c.sectors } : {}),
                  ...(c.minBedrooms ? { minBedrooms: c.minBedrooms } : {}),
                  ...(c.propertyType ? { preferredPropertyTypes: [c.propertyType] } : {})
                })
            });
          }
          return {
            text: `I found ${found.length} ${found.length === 1 ? 'home' : 'homes'} for “${what}”. ${found.length > 3 ? 'Here are the best matches for you:' : ''}`.trim(),
            homes: found.slice(0, 3),
            actions
          };
        }
        const near = relax(properties, c);
        if (near) {
          const ranked = rankByMatch(near.results);
          return {
            text: `Nothing matches “${what}” exactly right now. With ${near.dropped}, there ${ranked.length === 1 ? 'is 1 home' : `are ${ranked.length} homes`}:`,
            homes: ranked.slice(0, 3),
            actions: [{ label: 'Browse everything', run: () => { resetFilters(); go('/'); } }]
          };
        }
        return {
          text: `I couldn’t find anything close to “${what}” yet. New homes are listed regularly, so try again soon or widen your search.`,
          actions: [{ label: 'Browse all homes', run: () => { resetFilters(); go('/'); }, primary: true }]
        };
      }

      case 'afford': {
        const inc = intent.income ?? (currentUser?.role === 'TENANT' ? income : undefined);
        if (!inc) {
          return {
            text: 'Tell me your monthly take-home pay, for example “I earn 1.2M a month”, and I’ll work out a comfortable rent. The usual rule is to keep rent under 30% of income.',
            actions: [{ label: 'Open the affordability calculator', run: () => openModal('AFFORDABILITY_CALCULATOR') }]
          };
        }
        const max = Math.round(inc * 0.3);
        if (intent.rent) {
          const a = AffordabilityCalculator.analyze(inc, intent.rent);
          return {
            text: `${fmt(intent.rent)} RWF is ${Math.round(a.rentToIncomeRatioPercentage)}% of ${fmt(inc)} RWF. ${a.adviceMessage}`,
            actions: [{ label: `Homes under ${fmt(max)} RWF`, run: () => applyToExplore({ maxRent: max, sectors: [], districts: [], provinces: [], amenities: [] }), primary: true }]
          };
        }
        const count = properties.filter(p => p.isAvailable && p.monthlyRent <= max).length;
        return {
          text: `On ${fmt(inc)} RWF a month, a comfortable rent is up to about ${fmt(max)} RWF (30% of income). ${count ? `${count} available ${count === 1 ? 'home fits' : 'homes fit'} that budget.` : 'Nothing is listed under that yet.'}`,
          actions: count ? [{ label: `Show homes under ${fmt(max)}`, run: () => applyToExplore({ maxRent: max, sectors: [], districts: [], provinces: [], amenities: [] }), primary: true }] : []
        };
      }

      case 'area': {
        const info = RWANDA_LOCATIONS_DATA[intent.sector];
        const homes = rankByMatch(properties.filter(p => p.isAvailable && p.locationSector === intent.sector));
        const name = intent.sector.replace(/\s*\(.*\)/, '');
        return {
          text: `${name} is in ${info.district}, ${info.province}. ${info.description}. Typical rent there is around ${fmt(info.avgPriceGuide)} RWF a month.${homes.length ? ` ${homes.length} ${homes.length === 1 ? 'home is' : 'homes are'} available now:` : ' Nothing is listed there right now.'}`,
          homes: homes.slice(0, 3),
          actions: [{ label: `Explore ${name}`, run: () => applyToExplore({ sectors: [intent.sector], districts: [], provinces: [], amenities: [] }), primary: true }]
        };
      }

      case 'this-home': {
        if (!currentHome) return { text: 'Open a home first and I can answer questions about it.' };
        const m = getMatchExplanation(currentHome);
        if (intent.topic === 'match' || intent.topic === 'general') {
          const strong = m.criteriaBreakdown.filter(c => c.status === 'MATCH').map(c => c.label.toLowerCase());
          const weak = m.criteriaBreakdown.filter(c => c.status !== 'MATCH').map(c => c.detail);
          return {
            text: `It’s a ${m.totalScore}% match. ${strong.length ? `It fits on ${strong.join(', ')}.` : ''} ${weak.length ? `Watch out: ${weak.slice(0, 2).join(' ')}` : 'No real trade-offs against your preferences.'}`.trim(),
            actions: [{ label: 'Book a viewing', run: () => (currentUser ? openModal('VIEWING_REQUEST', { property: currentHome }) : openModal('AUTH')), primary: true }]
          };
        }
        if (intent.topic === 'afford') {
          if (!income) return { text: 'Add your monthly income in your preferences and I can check this for you.', actions: [{ label: 'Open preferences', run: () => openModal('PREFERENCES') }] };
          const a = AffordabilityCalculator.analyze(income, currentHome.monthlyRent);
          return { text: `At ${fmt(currentHome.monthlyRent)} RWF, this home is ${Math.round(a.rentToIncomeRatioPercentage)}% of your income. ${a.adviceMessage}` };
        }
        if (intent.topic === 'book') {
          if (!currentUser) return { text: 'You’ll need a free account to book a viewing.', actions: [{ label: 'Sign in or sign up', run: () => openModal('AUTH'), primary: true }] };
          openModal('VIEWING_REQUEST', { property: currentHome });
          return { text: 'I’ve opened the booking form. Pick a date and time and the landlord will confirm.' };
        }
        const similar = rankByMatch(
          properties.filter(
            p => p.id !== currentHome.id && p.isAvailable &&
              (p.locationSector === currentHome.locationSector || Math.abs(p.monthlyRent - currentHome.monthlyRent) <= currentHome.monthlyRent * 0.25)
          )
        );
        return similar.length
          ? { text: 'Here are homes similar in area or price:', homes: similar.slice(0, 3) }
          : { text: 'There aren’t any close alternatives listed right now.' };
      }

      case 'my-viewings': {
        if (!currentUser) return { text: 'Sign in to see your viewings.', actions: [{ label: 'Sign in', run: () => setCurrentTab('LOGIN'), primary: true }] };
        const mine = viewings.filter(v => (currentUser.role === 'LANDLORD' ? v.landlordId : v.tenantId) === currentUser.id);
        const pending = mine.filter(v => v.status === 'PENDING');
        const approved = mine.filter(v => v.status === 'APPROVED');
        if (!mine.length) return { text: currentUser.role === 'LANDLORD' ? 'No viewing requests yet. Good photos and a complete listing help.' : 'You haven’t booked any viewings yet. Open a home you like and tap “Book a viewing”.' };
        const next = approved[0];
        return {
          text: currentUser.role === 'LANDLORD'
            ? `You have ${mine.length} viewing ${mine.length === 1 ? 'request' : 'requests'}: ${pending.length} waiting for your answer, ${approved.length} approved.`
            : `You have ${mine.length} ${mine.length === 1 ? 'viewing' : 'viewings'}: ${pending.length} waiting for the landlord, ${approved.length} confirmed.${next ? ` Next: ${next.propertyTitle} on ${next.requestedDate} at ${next.requestedTimeSlot}.` : ''}`,
          actions: [{
            label: currentUser.role === 'LANDLORD' ? 'Review requests' : 'Open my dashboard',
            run: () => setCurrentTab(currentUser.role === 'LANDLORD' ? 'LANDLORD_DASHBOARD' : 'TENANT_DASHBOARD'),
            primary: true
          }]
        };
      }

      case 'my-messages': {
        if (!currentUser) return { text: 'Sign in to see your messages.', actions: [{ label: 'Sign in', run: () => setCurrentTab('LOGIN'), primary: true }] };
        const mine = inquiries.filter(i => (currentUser.role === 'LANDLORD' ? i.landlordId : i.tenantId) === currentUser.id);
        const count = currentUser.role === 'LANDLORD' ? mine.filter(i => !i.isRead).length : mine.filter(i => i.reply).length;
        return {
          text: currentUser.role === 'LANDLORD'
            ? `${mine.length} ${mine.length === 1 ? 'conversation' : 'conversations'}, ${count} unread.`
            : `${mine.length} ${mine.length === 1 ? 'conversation' : 'conversations'}, ${count} with a reply from the landlord.`,
          actions: [{ label: 'Open messages', run: () => setCurrentTab('INQUIRIES'), primary: true }]
        };
      }

      case 'improve-listing': {
        if (currentUser?.role !== 'LANDLORD') return { text: FAQ.list };
        const mine = properties.filter(p => p.landlordId === currentUser.id);
        if (!mine.length) return { text: 'You haven’t listed a home yet.', actions: [{ label: 'List a home', run: () => openModal('ADD_EDIT_PROPERTY'), primary: true }] };
        const weakest = mine.map(p => ({ p, q: getListingQuality(p) })).sort((a, b) => a.q.score - b.q.score)[0];
        const tips = weakest.q.recommendations.slice(0, 3);
        return {
          text: `“${weakest.p.title}” scores ${weakest.q.score}/100, your lowest. ${tips.length ? `To improve it: ${tips.join(' ')}` : 'It’s already in great shape.'}`,
          actions: [{ label: 'Edit this listing', run: () => openModal('ADD_EDIT_PROPERTY', { property: weakest.p }), primary: true }]
        };
      }

      case 'faq': {
        const actions: Action[] = [];
        if (intent.topic === 'signup' && !currentUser) actions.push({ label: 'Create an account', run: () => setCurrentTab('SIGNUP'), primary: true });
        if (intent.topic === 'list') actions.push(currentUser?.role === 'LANDLORD'
          ? { label: 'List a home', run: () => openModal('ADD_EDIT_PROPERTY'), primary: true }
          : { label: 'Create a landlord account', run: () => setCurrentTab('SIGNUP'), primary: true });
        if (intent.topic === 'match' && currentUser?.role === 'TENANT') actions.push({ label: 'Tune my preferences', run: () => openModal('PREFERENCES') });
        return { text: FAQ[intent.topic], actions };
      }

      default:
        return {
          text: 'I didn’t quite catch that. Describe the home you want, like “furnished 2-bed in Kacyiru under 600k”, or ask about affordability, a neighborhood, or your viewings.'
        };
    }
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    setMessages(prev => [...prev, { id: uid(), role: 'user', text }]);
    setInput('');
    setTyping(true);
    window.setTimeout(() => {
      setMessages(prev => [...prev, { id: uid(), role: 'bot', ...reply(text) }]);
      setTyping(false);
    }, 450);
  };

  const welcome = currentHome
    ? `Questions about “${currentHome.title}”? I can explain its match score, check if it fits your budget, or find similar homes.`
    : `Muraho${firstName ? `, ${firstName}` : ''}! Describe the home you want in your own words and I’ll find it. I can also check what you can afford and tell you about neighborhoods.`;

  return (
    <div className="chat-fab fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {open && (
        <section
          role="dialog"
          aria-label="Habify Assist"
          className="animate-pop w-[min(100vw-1.5rem,25rem)] h-[min(78vh,40rem)] bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden flex flex-col"
          style={{ boxShadow: 'var(--shadow-lift)' }}
        >
          <header className="palette-light topo bg-tea-800 text-white px-4 py-3.5 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 inline-flex items-center justify-center text-saffron-300">
              <Sparkles className="w-[18px] h-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Habify Assist</p>
              <p className="text-[11px] text-tea-100 truncate">Finds homes, checks budgets, answers questions</p>
            </div>
            {messages.length > 0 && (
              <button type="button" onClick={() => setMessages([])} className="p-2 rounded-lg text-tea-100 hover:text-white hover:bg-white/10" aria-label="Start a new conversation" title="New conversation">
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-lg text-tea-100 hover:text-white hover:bg-white/10" aria-label="Close assistant">
              <X className="w-4 h-4" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3" aria-live="polite">
            <BotBubble text={welcome} />
            {messages.map(m =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm bg-tea-700 text-white leading-relaxed">{m.text}</p>
                </div>
              ) : (
                <div key={m.id} className="space-y-2">
                  <BotBubble text={m.text} />
                  {m.homes && m.homes.length > 0 && (
                    <div className="pl-9 space-y-2">
                      {m.homes.map(h => (
                        <HomeRow key={h.id} home={h} score={getMatchExplanation(h).totalScore} onOpen={() => go(propertyPath(h.id))} />
                      ))}
                    </div>
                  )}
                  {m.actions && m.actions.length > 0 && (
                    <div className="pl-9 flex flex-wrap gap-2">
                      {m.actions.map(a => (
                        <button
                          key={a.label}
                          type="button"
                          onClick={a.run}
                          className={`h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                            a.primary ? 'bg-tea-700 text-white hover:bg-tea-800' : 'bg-white border border-stone-300 text-ink-800 hover:border-ink-400'
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
            {typing && (
              <div className="flex items-center gap-2 pl-1" aria-label="Habify Assist is typing">
                <Avatar />
                <span className="inline-flex gap-1 px-3 py-3 rounded-2xl bg-white border border-stone-200">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-stone-500 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </span>
              </div>
            )}
          </div>

          {messages.length < 2 && (
            <div className="px-3.5 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
              {suggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="shrink-0 h-8 px-3 rounded-full text-xs font-medium bg-white border border-stone-200 text-ink-800 hover:border-tea-600 hover:text-tea-800 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            className="p-3 border-t border-stone-200 bg-white flex items-center gap-2"
            onSubmit={e => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="assist-input" className="sr-only">Message Habify Assist</label>
            <input
              id="assist-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. 2-bed in Kacyiru under 500k"
              autoComplete="off"
              className="flex-1 min-w-0 h-11 px-4 rounded-full bg-stone-100 border border-transparent text-sm text-ink-900 placeholder:text-stone-500 focus:outline-none focus:border-tea-600 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="w-11 h-11 shrink-0 rounded-full bg-tea-700 text-white inline-flex items-center justify-center hover:bg-tea-800 disabled:opacity-40 transition-colors"
              aria-label="Send"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="h-12 pl-4 pr-5 rounded-full inline-flex items-center gap-2 bg-tea-700 hover:bg-tea-800 text-white text-sm font-semibold active:scale-95 transition-[background-color,transform]"
        style={{ boxShadow: 'var(--shadow-lift)' }}
        aria-expanded={open}
        aria-label={open ? 'Close Habify Assist' : 'Open Habify Assist'}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Ask Habify'}</span>
      </button>
    </div>
  );
};

const Avatar: React.FC = () => (
  <span className="w-7 h-7 shrink-0 rounded-full bg-tea-100 text-tea-800 inline-flex items-center justify-center">
    <Sparkles className="w-3.5 h-3.5" />
  </span>
);

const BotBubble: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-end gap-2">
    <Avatar />
    <p className="max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm bg-white border border-stone-200 text-ink-800 leading-relaxed">{text}</p>
  </div>
);

const HomeRow: React.FC<{ home: Property; score: number; onOpen: () => void }> = ({ home, score, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="group w-full flex items-center gap-3 p-2 pr-3 rounded-2xl bg-white border border-stone-200 hover:border-tea-600 text-left transition-colors"
  >
    <span className="palette-light w-16 h-14 shrink-0 rounded-xl overflow-hidden bg-stone-200">
      <PropertyImage images={home.images} seedKey={home.id} alt="" className="w-full h-full object-cover" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold text-ink-900 truncate">{home.title}</span>
      <span className="block text-xs text-stone-600 truncate">
        {home.locationSector} · {home.bedrooms} bed · {home.monthlyRent.toLocaleString()} RWF
      </span>
      <span className={`mt-1 inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${score >= 80 ? 'bg-tea-50 text-tea-800' : 'bg-stone-100 text-ink-700'}`}>
        {score}% match
      </span>
    </span>
    <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-tea-700 shrink-0" />
  </button>
);
