import React, { useEffect, useState } from 'react';
import { CalendarClock, CalendarPlus, Loader2, X } from 'lucide-react';
import { ViewingRequest } from '../types';
import { useApp } from '../context/AppContext';
import { downloadViewingCalendarFile, fetchViewingSlotsApi, rescheduleViewingApi, SlotDay } from '../services/featuresApi';

/** "14:00" → "2:00 PM" */
export function clockLabel(t: string) {
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return t;
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Day tabs and time buttons for a listing's open viewing slots. */
export const SlotPicker: React.FC<{
  propertyId: string;
  rescheduleId?: string;
  value: { date: string; time: string } | null;
  onChange: (v: { date: string; time: string }) => void;
}> = ({ propertyId, rescheduleId, value, onChange }) => {
  const [days, setDays] = useState<SlotDay[] | null>(null);
  const [error, setError] = useState('');
  const [dayIdx, setDayIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    setDays(null);
    setError('');
    fetchViewingSlotsApi(propertyId, 14, rescheduleId)
      .then(d => {
        if (!alive) return;
        setDays(d);
        const firstOpen = d.findIndex(x => x.slots.some(s => s.available));
        setDayIdx(firstOpen < 0 ? 0 : firstOpen);
      })
      .catch(e => alive && setError((e as Error).message));
    return () => {
      alive = false;
    };
  }, [propertyId, rescheduleId]);

  if (error) return <p className="text-sm text-red-700" role="alert">Couldn’t load open times: {error}</p>;
  if (!days) {
    return (
      <p className="flex items-center gap-2 text-sm text-stone-600">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading open times…
      </p>
    );
  }
  if (!days.length) return <p className="text-sm text-stone-600">The landlord has no open viewing times in the next two weeks. Send them a message instead.</p>;

  const day = days[dayIdx];
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label="Day">
        {days.map((d, i) => {
          const open = d.slots.filter(s => s.available).length;
          const on = i === dayIdx;
          return (
            <button
              key={d.date}
              type="button"
              role="tab"
              aria-selected={on}
              disabled={!open}
              onClick={() => setDayIdx(i)}
              className={`shrink-0 w-[4.5rem] rounded-xl border px-2 py-2 text-center transition-colors disabled:opacity-40 ${
                on ? 'border-tea-700 bg-tea-700 text-white' : 'border-stone-300 bg-white text-ink-800 hover:border-ink-400'
              }`}
            >
              <span className="block text-[11px] font-semibold uppercase tracking-wide opacity-80">{d.label.split(' ')[0]}</span>
              <span className="block font-display text-lg font-bold leading-tight">{d.label.split(' ')[1]}</span>
              <span className="block text-[10px] opacity-80">{d.label.split(' ')[2]}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup" aria-label={`Times on ${day.label}`}>
        {day.slots.map(s => {
          const on = value?.date === day.date && value.time === s.time;
          return (
            <button
              key={s.time}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!s.available}
              onClick={() => onChange({ date: day.date, time: s.time })}
              className={`h-10 rounded-lg border text-sm font-medium tabular-nums transition-colors disabled:line-through disabled:opacity-40 ${
                on ? 'border-tea-700 bg-tea-50 text-tea-800 ring-2 ring-tea-600/20' : 'border-stone-300 bg-white text-ink-800 hover:border-tea-600'
              }`}
              title={s.available ? undefined : 'Already booked'}
            >
              {clockLabel(s.time)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Pick a new time for an existing viewing. */
export const RescheduleDialog: React.FC<{ viewing: ViewingRequest; asLandlord?: boolean; onClose: () => void }> = ({ viewing, asLandlord, onClose }) => {
  const { refreshFromServer, addToast } = useApp();
  const [choice, setChoice] = useState<{ date: string; time: string } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = async () => {
    if (!choice) return;
    setBusy(true);
    try {
      await rescheduleViewingApi(viewing.id, choice.date, choice.time, note.trim() || undefined);
      await refreshFromServer();
      addToast('success', asLandlord ? 'Viewing moved. The tenant has been told.' : 'New time requested. The landlord will confirm it.');
      onClose();
    } catch (e) {
      addToast('error', (e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="resched-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-pop relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-stone-200 shadow-xl p-6 max-h-[92vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <h2 id="resched-title" className="font-display text-xl font-bold text-ink-900 pr-10">Choose a new time</h2>
        <p className="mt-1 text-sm text-stone-600 truncate">{viewing.propertyTitle}</p>
        <div className="mt-5">
          <SlotPicker propertyId={viewing.propertyId} rescheduleId={viewing.id} value={choice} onChange={setChoice} />
        </div>
        <label className="block mt-5 text-xs font-semibold text-ink-800" htmlFor="resched-note">Note (optional)</label>
        <input
          id="resched-note"
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={200}
          placeholder={asLandlord ? 'e.g. Sorry, I have a meeting then' : 'e.g. I finish work later that day'}
          className="mt-1 w-full h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-ink-900 focus:border-tea-600 focus:ring-4 focus:ring-tea-600/15 outline-none"
        />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost rounded-full">Cancel</button>
          <button type="button" onClick={save} disabled={!choice || busy} className="btn-primary rounded-full">
            {busy ? 'Saving…' : asLandlord ? 'Move viewing' : 'Request this time'}
          </button>
        </div>
      </div>
    </div>
  );
};

/** "Add to calendar" and "Reschedule" for a pending or approved viewing. */
export const ViewingActions: React.FC<{ viewing: ViewingRequest; asLandlord?: boolean; compact?: boolean }> = ({ viewing, asLandlord, compact }) => {
  const { isLive, addToast } = useApp();
  const [open, setOpen] = useState(false);
  if (!isLive || (viewing.status !== 'PENDING' && viewing.status !== 'APPROVED')) return null;
  const btn = compact
    ? 'inline-flex items-center gap-1 h-8 px-2.5 rounded-full text-xs font-semibold text-ink-800 border border-stone-300 hover:border-tea-600 hover:text-tea-800'
    : 'btn-secondary h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-sm';
  return (
    <>
      {viewing.status === 'APPROVED' && (
        <button
          type="button"
          className={btn}
          onClick={() => downloadViewingCalendarFile(viewing.id, viewing.propertyTitle).catch(e => addToast('error', (e as Error).message))}
          title="Download a calendar invite with a reminder"
        >
          <CalendarPlus className="w-3.5 h-3.5" /> {compact ? 'Calendar' : 'Add to calendar'}
        </button>
      )}
      <button type="button" className={btn} onClick={() => setOpen(true)}>
        <CalendarClock className="w-3.5 h-3.5" /> Reschedule
      </button>
      {open && <RescheduleDialog viewing={viewing} asLandlord={asLandlord} onClose={() => setOpen(false)} />}
    </>
  );
};
