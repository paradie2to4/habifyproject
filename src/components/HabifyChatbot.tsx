import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

const QUICK_PROMPTS = [
  'How do I sign up?',
  'What is Smart Match?',
  'Tenant vs landlord?',
  'How do I book a viewing?'
];

function answerQuestion(raw: string): string {
  const q = raw.toLowerCase().trim();

  if (!q) {
    return 'Ask me anything about Habify — signup, roles, smart matching, viewings, or browsing homes.';
  }

  if (/(hello|hi|hey|muraho|good\s*(morning|afternoon|evening))/.test(q)) {
    return 'Muraho! I\'m the Habify helper. I can explain signup, tenant vs landlord accounts, Smart Match, and how to request a viewing.';
  }

  if (/(sign\s*up|register|create\s*(an\s*)?account|get\s*started)/.test(q)) {
    return 'Click Get started (or Sign up), enter your name, email, and password, then choose Tenant (find a home) or Landlord / Landlady (list a property). After signup you land on your role dashboard.';
  }

  if (/(log\s*in|sign\s*in|password|demo\s*account|test\s*account)/.test(q)) {
    return 'Use Sign in with your email. Demo accounts: tenant@smartrental.rw, landlord@smartrental.rw, admin@smartrental.rw — password password123 for each.';
  }

  if (/(tenant|landlord|landlady|admin|role|dashboard)/.test(q)) {
    return 'Habify has three roles: Tenants browse, save homes, and request viewings; Landlords / Landladies manage listings, rent, and inquiries in Owner Hub; Admins moderate reports and see platform coverage.';
  }

  if (/(smart\s*match|recommend|match\s*%|how\s*match|preferences|criteria)/.test(q)) {
    return 'Smart Match scores homes against your budget, preferred areas, bedrooms, property style, and amenities. Open Criteria (or Preferences) to update what you want, then visit Smart Matches to see ranked results.';
  }

  if (/(viewing|tour|visit|schedule|book)/.test(q)) {
    return 'Open any listing → View (or Details) → request a viewing with a date and time slot. Landlords approve or decline from Owner Hub. You need to be signed in as a tenant.';
  }

  if (/(favorite|saved|save\s*home|heart)/.test(q)) {
    return 'Tap the heart on a listing card to save it. Tenants can revisit saved homes under Saved in the navigation.';
  }

  if (/(list|add|publish|post).*(propert|listing|home|house|apartment)|how\s*do\s*i\s*list/.test(q)) {
    return 'Sign up or sign in as a Landlord / Landlady, open Owner Hub, then use Add Property / List a property. Fill location, rent, photos, and amenities — the live quality score guides you.';
  }

  if (/(price|rent|rwf|budget|cost|afford)/.test(q)) {
    return 'Rents are shown in Rwandan Francs (RWF) per month. Use filters or your max budget in Criteria, and try the Affordability calculator to check rent vs income.';
  }

  if (/(filter|browse|search|pagination|pages)/.test(q)) {
    return 'On Explore, filter by province, district, budget, bedrooms, and amenities. Results show 6 homes per page — use Prev/Next under the grid. Smart Matches is also paginated the same way.';
  }

  if (/(contact|message|inquiry|chat\s*landlord)/.test(q)) {
    return 'From a listing you can send an inquiry to the landlord. Messages appear under Messages for both tenants and owners.';
  }

  if (/(rwanda|kigali|location|province|where)/.test(q)) {
    return 'Habify covers rental homes across Rwanda — Kigali City plus Northern, Southern, Eastern, and Western provinces. Filter by province or popular hubs like Kimihurura, Kacyiru, and Musanze.';
  }

  if (/(help|what\s*can\s*you|who\s*are\s*you|about\s*habify|what\s*is\s*habify)/.test(q)) {
    return 'Habify is a Rwanda-focused rental platform that matches people to homes by budget, neighborhood, and lifestyle. I answer basic how-to questions about this website — try “How do I sign up?” or “What is Smart Match?”';
  }

  return 'I\'m not sure about that yet. Try asking about signup, login demos, tenant vs landlord, Smart Match, viewings, listing a property, or filters. For account-specific issues, use Messages after you sign in.';
}

export const HabifyChatbot: React.FC = () => {
  const { currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Muraho — I\'m Habify Assist. Ask about signup, Smart Match, roles, viewings, or browsing homes.'
    }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const greeting = useMemo(() => {
    const name = currentUser?.fullName?.split(' ')[0];
    return name ? `Hi ${name}` : 'Ask Habify';
  }, [currentUser]);

  const pushBot = (text: string) => {
    setMessages(prev => [
      ...prev,
      { id: `bot-${Date.now()}`, role: 'bot', text }
    ]);
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', text: trimmed }
    ]);
    setInput('');

    window.setTimeout(() => {
      pushBot(answerQuestion(trimmed));
    }, 280);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(100vw-1.5rem,22rem)] bg-cream-50 border border-cream-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[min(70vh,28rem)]">
          <div className="bg-navy-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-terra-600/25 border border-terra-500/40 flex items-center justify-center text-terra-300 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">Habify Assist</p>
                <p className="text-[11px] text-cream-400 truncate">{greeting} · basic FAQ help</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-cream-400 hover:text-white hover:bg-navy-800"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-cream-50">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-navy-900 text-white'
                      : 'bg-white border border-cream-200 text-navy-900'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 pb-2 flex flex-wrap gap-1.5 border-t border-cream-200 bg-white pt-2">
            {QUICK_PROMPTS.map(prompt => (
              <button
                key={prompt}
                type="button"
                onClick={() => send(prompt)}
                className="px-2 py-1 rounded-md text-[10px] font-semibold bg-cream-100 text-navy-800 hover:bg-cream-200 border border-cream-200"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="p-3 bg-white border-t border-cream-200 flex items-center gap-2"
            onSubmit={e => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="input-base flex-1 text-xs py-2"
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="btn-accent p-2.5 shrink-0"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold shadow-lg"
        aria-expanded={open}
        aria-label={open ? 'Close Habify Assist' : 'Open Habify Assist'}
      >
        {open ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Help'}</span>
      </button>
    </div>
  );
};
