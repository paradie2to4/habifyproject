import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarCheck, MessageSquare, Receipt, Wrench, FileSignature, BellRing, CheckCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  VIEWING_REQUESTED: CalendarCheck,
  VIEWING_UPDATED: CalendarCheck,
  NEW_MESSAGE: MessageSquare,
  NEW_INQUIRY: MessageSquare,
  RENT_DUE: BellRing,
  PAYMENT: Receipt,
  MAINTENANCE: Wrench,
  LEASE: FileSignature
};

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const NotificationBell: React.FC = () => {
  const { notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead, refreshNotifications } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    void refreshNotifications();
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, refreshNotifications]);

  const openItem = (n: AppNotification) => {
    if (!n.readAt) void markNotificationRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
        className="relative w-10 h-10 inline-flex items-center justify-center rounded-full text-ink-600 hover:text-ink-900 hover:bg-stone-100 transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadNotifications > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-saffron-500 text-ink-950 text-[10px] font-bold inline-flex items-center justify-center ring-2 ring-white tabular-nums">
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="animate-pop fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 sm:w-96 rounded-2xl bg-white border border-stone-200 overflow-hidden z-50"
          style={{ boxShadow: 'var(--shadow-lift)' }}
        >
          <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200">
            <p className="text-sm font-semibold text-ink-900">Notifications</p>
            {unreadNotifications > 0 && (
              <button type="button" onClick={() => void markAllNotificationsRead()} className="inline-flex items-center gap-1 text-xs font-semibold text-tea-700 hover:text-tea-800">
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
          </div>
          <ul className="max-h-[60vh] overflow-y-auto divide-y divide-stone-100">
            {notifications.length === 0 ? (
              <li className="px-6 py-10 text-center">
                <span className="w-11 h-11 rounded-full bg-tea-50 text-tea-700 inline-flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink-900">You’re all caught up</p>
                <p className="mt-1 text-xs text-stone-600">Viewing updates, messages and rent reminders will appear here.</p>
              </li>
            ) : (
              notifications.map(n => {
                const Icon = ICONS[n.type] ?? Bell;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-stone-50 transition-colors ${n.readAt ? '' : 'bg-tea-50/60'}`}
                    >
                      <span className={`w-9 h-9 shrink-0 rounded-xl inline-flex items-center justify-center ${n.type === 'RENT_DUE' ? 'bg-saffron-100 text-saffron-800' : 'bg-tea-50 text-tea-700'}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm leading-snug ${n.readAt ? 'text-ink-700' : 'font-semibold text-ink-900'}`}>{n.title}</span>
                        {n.body && <span className="block text-xs text-stone-600 mt-0.5 line-clamp-2">{n.body}</span>}
                        <span className="block text-[11px] text-stone-500 mt-1">{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.readAt && <span className="mt-1.5 w-2 h-2 shrink-0 rounded-full bg-saffron-500" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
