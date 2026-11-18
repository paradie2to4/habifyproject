import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';
import { PropertyImage } from '../components/PropertyImage';
import { timeAgo } from '../components/NotificationBell';
import { Inquiry, ThreadMessage } from '../types';
import { fetchThreadApi, markThreadReadApi, sendThreadMessageApi } from '../services/platformApi';
import { propertyPath } from '../routes';
import { MessageSquare, ArrowUp, ArrowLeft, Search, Check, CheckCheck, LoaderCircle, ExternalLink } from 'lucide-react';

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
};
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

type Pending = ThreadMessage & { pending?: boolean; failed?: boolean };

export const InquiriesView: React.FC = () => {
  const { inquiries, currentUser, setCurrentTab, isLive, patchInquiry, refreshInquiries, properties, syncing, backendStatus } = useApp();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const isLandlord = currentUser?.role === 'LANDLORD';
  const threads = useMemo(
    () =>
      [...inquiries]
        .filter(i => !currentUser || i.tenantId === currentUser.id || i.landlordId === currentUser.id || currentUser.role === 'ADMIN')
        .sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime()),
    [inquiries, currentUser]
  );
  const visible = threads.filter(t => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [t.propertyTitle, t.tenantName, t.landlordName, t.lastMessagePreview].some(v => v?.toLowerCase().includes(q));
  });

  const selectedId = params.get('thread') || undefined;

  // On wide screens, open the most recent conversation instead of an empty pane
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const loaded = !syncing && backendStatus !== 'connecting';
  useEffect(() => {
    if (!loaded || !threads[0]) return;
    const current = params.get('thread');
    // Open the latest thread on wide screens, and recover from links to threads that don't exist
    if ((!current && wide) || (current && !threads.some(t => t.id === current))) {
      const next = new URLSearchParams(params);
      if (wide) next.set('thread', threads[0].id);
      else next.delete('thread');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads[0]?.id, wide, loaded, params.get('thread')]);
  const selected = threads.find(t => t.id === selectedId);
  const otherName = (t: Inquiry) => (isLandlord ? t.tenantName : t.landlordName) || 'Habify user';
  const photoFor = (t: Inquiry) => t.propertyImage || properties.find(p => p.id === t.propertyId)?.images?.[0] || '';

  const select = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('thread', id);
    else next.delete('thread');
    setParams(next, { replace: !id });
  };

  // Load the thread, mark it read, then poll for new messages while it's open
  useEffect(() => {
    if (!selected || !isLive) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    const load = async (first: boolean) => {
      if (first) setLoading(true);
      try {
        const data = await fetchThreadApi(selected.id);
        if (cancelled) return;
        setMessages(prev => {
          const sending = prev.filter(m => m.pending || m.failed);
          return [...data, ...sending];
        });
        const unreadFromThem = data.some(m => m.senderId !== currentUser?.id && !m.readAt);
        if (first || unreadFromThem) {
          await markThreadReadApi(selected.id).catch(() => undefined);
          patchInquiry(selected.id, { unreadCount: 0, isRead: true });
        }
      } catch {
        /* keep what we have; the next poll will retry */
      } finally {
        if (first && !cancelled) setLoading(false);
      }
    };
    void load(true);
    const timer = window.setInterval(() => document.visibilityState === 'visible' && void load(false), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, isLive]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, selected?.id]);

  const send = async (text: string, retryId?: string) => {
    const body = text.trim();
    if (!body || !selected || !currentUser) return;
    const tempId = retryId || `tmp-${Date.now()}`;
    const optimistic: Pending = {
      id: tempId,
      inquiryId: selected.id,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderRole: isLandlord ? 'LANDLORD' : 'TENANT',
      body,
      createdAt: new Date().toISOString(),
      pending: true
    };
    setMessages(prev => (retryId ? prev.map(m => (m.id === retryId ? optimistic : m)) : [...prev, optimistic]));
    if (!retryId) setDraft('');
    try {
      const saved = await sendThreadMessageApi(selected.id, body);
      setMessages(prev => prev.map(m => (m.id === tempId ? saved : m)));
      patchInquiry(selected.id, { lastMessageAt: saved.createdAt, lastMessagePreview: body, unreadCount: 0 });
    } catch {
      setMessages(prev => prev.map(m => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
    }
  };

  useEffect(() => {
    void refreshInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-grow the composer
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Measure content height, then only show a scrollbar once we hit the cap
    el.style.height = '0px';
    const content = el.scrollHeight;
    el.style.height = `${Math.min(content, 144)}px`;
    el.style.overflowY = content > 144 ? 'auto' : 'hidden';
  }, [draft]);

  if (threads.length === 0) {
    return (
      <div className="space-y-8 text-left">
        <header>
          <h1 className="font-display text-4xl font-bold text-ink-900">Messages</h1>
          <p className="text-sm text-stone-600 mt-2">Conversations between tenants and landlords.</p>
        </header>
        <EmptyState
          icon={<MessageSquare className="w-5 h-5" />}
          title="Start a conversation"
          description={isLandlord ? 'Questions from tenants about your homes will appear here.' : 'Open any home and tap “Ask the landlord”. The conversation will continue here.'}
          actionLabel={isLandlord ? 'Go to your owner hub' : 'Explore homes'}
          onAction={() => setCurrentTab(isLandlord ? 'LANDLORD_DASHBOARD' : 'BROWSE')}
        />
      </div>
    );
  }

  // Index of my last message the other person has seen / that is sent
  const myMessages = messages.filter(m => m.senderId === currentUser?.id && !m.pending && !m.failed);
  const lastMine = myMessages[myMessages.length - 1];

  return (
    <div id="inquiries-view-container" className="text-left">
      <header className="mb-6 hidden lg:block">
        <h1 className="font-display text-4xl font-bold text-ink-900">Messages</h1>
      </header>

      <div className="grid lg:grid-cols-[360px_minmax(0,1fr)] bg-white rounded-3xl border border-stone-200 overflow-hidden h-[calc(100vh-11rem)] min-h-[520px]" style={{ boxShadow: 'var(--shadow-card)' }}>
        {/* Thread list */}
        <aside className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col border-r border-stone-200 min-h-0`}>
          <div className="p-3 border-b border-stone-200">
            <label htmlFor="thread-search" className="sr-only">Search conversations</label>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
              <input id="thread-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search conversations" className="input-base h-10 pl-9" />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {visible.map(t => {
              const active = t.id === selected?.id;
              const unread = t.unreadCount ?? 0;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => select(t.id)}
                    className={`w-full text-left flex gap-3 px-4 py-3.5 border-l-[3px] transition-colors ${
                      active ? 'bg-tea-50 border-tea-700' : 'border-transparent hover:bg-stone-50'
                    }`}
                  >
                    <span className="palette-light w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-stone-200">
                      <PropertyImage src={photoFor(t)} seedKey={t.propertyId} alt="" className="w-full h-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${unread ? 'font-bold text-ink-900' : 'font-semibold text-ink-800'}`}>{otherName(t)}</span>
                        <span className="shrink-0 text-[11px] text-stone-500">{timeAgo(t.lastMessageAt || t.createdAt)}</span>
                      </span>
                      <span className="block truncate text-xs text-tea-700">{t.propertyTitle}</span>
                      <span className="flex items-center gap-2">
                        <span className={`truncate text-xs flex-1 ${unread ? 'text-ink-900 font-medium' : 'text-stone-600'}`}>{t.lastMessagePreview || t.message}</span>
                        {unread > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-tea-700 text-white text-[11px] font-semibold inline-flex items-center justify-center">{unread}</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {visible.length === 0 && <li className="p-6 text-sm text-stone-600 text-center">No conversations match “{query}”.</li>}
          </ul>
        </aside>

        {/* Thread */}
        {selected ? (
          <section className="flex flex-col min-h-0" aria-label={`Conversation with ${otherName(selected)}`}>
            <header className="flex items-center gap-3 px-4 sm:px-5 h-16 border-b border-stone-200 shrink-0">
              <button type="button" onClick={() => select(null)} className="lg:hidden -ml-1 w-9 h-9 rounded-full inline-flex items-center justify-center hover:bg-stone-100" aria-label="Back to conversations">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="w-10 h-10 shrink-0 rounded-full bg-tea-100 text-tea-800 inline-flex items-center justify-center font-semibold">
                {otherName(selected).charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-900 truncate">{otherName(selected)}</span>
                <span className="block text-xs text-stone-600 truncate">
                  {isLandlord ? 'Tenant' : 'Landlord'} · {selected.propertyTitle}
                </span>
              </span>
              <button type="button" onClick={() => navigate(propertyPath(selected.propertyId))} className="btn-ghost h-9 px-3 rounded-full text-xs">
                View home <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-1 bg-stone-50" aria-live="polite">
              {!isLive ? (
                <div className="space-y-3">
                  <Bubble mine={selected.tenantId === currentUser?.id} body={selected.message} time={selected.createdAt} />
                  {selected.reply && <Bubble mine={selected.landlordId === currentUser?.id} body={selected.reply} time={selected.repliedAt || selected.createdAt} />}
                  <p className="text-center text-xs text-stone-600 pt-4">Live messaging is available when Habify is connected to its server.</p>
                </div>
              ) : loading ? (
                <div className="h-full flex items-center justify-center text-stone-600">
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                messages.map((m, i) => {
                  const mine = m.senderId === currentUser?.id;
                  const newDay = i === 0 || dayLabel(messages[i - 1].createdAt) !== dayLabel(m.createdAt);
                  const grouped = i > 0 && messages[i - 1].senderId === m.senderId && !newDay;
                  return (
                    <React.Fragment key={m.id}>
                      {newDay && (
                        <p className="text-center text-[11px] font-semibold text-stone-500 py-3">{dayLabel(m.createdAt)}</p>
                      )}
                      <div className={grouped ? '' : 'pt-2'}>
                        <Bubble
                          mine={mine}
                          body={m.body}
                          time={m.createdAt}
                          status={
                            m.failed ? (
                              <button type="button" onClick={() => void send(m.body, m.id)} className="text-red-800 font-semibold underline">
                                Not sent · Retry
                              </button>
                            ) : m.pending ? (
                              'Sending…'
                            ) : mine && m.id === lastMine?.id ? (
                              m.readAt ? (
                                <span className="inline-flex items-center gap-1 text-tea-700"><CheckCheck className="w-3.5 h-3.5" /> Seen</span>
                              ) : (
                                <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Sent</span>
                              )
                            ) : null
                          }
                        />
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                void send(draft);
              }}
              className="px-3 sm:px-4 pt-3 pb-2 border-t border-stone-200 bg-white shrink-0"
            >
              <div className="flex items-end gap-2 rounded-[22px] bg-stone-50 border border-stone-300 pl-4 pr-1.5 py-1.5 transition-[border-color,box-shadow] focus-within:border-tea-600 focus-within:ring-4 focus-within:ring-tea-600/10">
                <label htmlFor="thread-composer" className="sr-only">Write a message</label>
                <textarea
                  id="thread-composer"
                  ref={textRef}
                  rows={1}
                  value={draft}
                  disabled={!isLive}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send(draft);
                    }
                  }}
                  maxLength={4000}
                  placeholder={isLive ? `Message ${otherName(selected).split(' ')[0]}…` : 'Connect to the server to reply'}
                  className="flex-1 min-w-0 self-center resize-none bg-transparent border-0 p-0 py-2 text-[15px] leading-6 text-ink-900 placeholder:text-stone-500 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
                  style={{ overflowY: 'hidden' }}
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || !isLive}
                  className="w-10 h-10 shrink-0 rounded-full inline-flex items-center justify-center transition-colors bg-tea-700 text-white hover:bg-tea-800 disabled:bg-stone-200 disabled:text-stone-500 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
              <p className="hidden sm:block mt-1.5 px-2 text-[11px] text-stone-500">
                Enter to send · Shift + Enter for a new line
              </p>
            </form>
          </section>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center text-center p-10 bg-stone-50">
            <MessageSquare className="w-8 h-8 text-stone-400" />
            <p className="mt-3 text-sm text-stone-600">Choose a conversation to read it.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Bubble: React.FC<{ mine: boolean; body: string; time: string; status?: React.ReactNode }> = ({ mine, body, time, status }) => (
  <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
    <p
      className={`max-w-[85%] sm:max-w-[70%] whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed ${
        mine ? 'bg-tea-700 text-white rounded-2xl rounded-br-md' : 'bg-white border border-stone-200 text-ink-900 rounded-2xl rounded-bl-md'
      }`}
    >
      {body}
    </p>
    <span className="mt-1 px-1 text-[11px] text-stone-500 flex items-center gap-2">
      {timeLabel(time)}
      {status && <span>· {status}</span>}
    </span>
  </div>
);
