import React, { useEffect, useState } from 'react';
import { CalendarCog, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AvailabilityWindow, fetchAvailabilityApi, saveAvailabilityApi } from '../services/featuresApi';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LENGTHS = [30, 45, 60, 90];

const input =
  'h-9 rounded-lg border border-stone-300 bg-white px-2 text-sm text-ink-900 tabular-nums focus:border-tea-600 focus:ring-2 focus:ring-tea-600/20 outline-none';

/** Weekly hours when tenants can book viewings. Tenants only see open slots inside these windows. */
export const AvailabilityEditor: React.FC = () => {
  const { isLive, addToast } = useApp();
  const [open, setOpen] = useState(false);
  const [windows, setWindows] = useState<AvailabilityWindow[] | null>(null);
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [custom, setCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLive || !open || windows) return;
    fetchAvailabilityApi()
      .then(a => {
        setWindows(a.windows.map(w => ({ dayOfWeek: w.dayOfWeek, startTime: w.startTime, endTime: w.endTime })));
        setSlotMinutes(a.slotMinutes);
        setCustom(a.custom);
      })
      .catch(e => addToast('error', (e as Error).message));
  }, [isLive, open, windows, addToast]);

  if (!isLive) return null;

  const update = (i: number, patch: Partial<AvailabilityWindow>) => setWindows(ws => ws!.map((w, j) => (j === i ? { ...w, ...patch } : w)));

  const save = async () => {
    if (!windows) return;
    const bad = windows.find(w => w.startTime >= w.endTime);
    if (bad) {
      addToast('warning', `${DAYS[bad.dayOfWeek - 1]}: the end time must be after the start time.`);
      return;
    }
    setSaving(true);
    try {
      await saveAvailabilityApi(windows, slotMinutes);
      setCustom(true);
      addToast('success', 'Viewing hours saved. Tenants will only see these times.');
      setOpen(false);
    } catch (e) {
      addToast('error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 text-left" aria-expanded={open}>
        <span className="w-9 h-9 rounded-xl bg-tea-50 text-tea-700 inline-flex items-center justify-center">
          <CalendarCog className="w-4 h-4" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-ink-900">Your viewing hours</span>
          <span className="block text-xs text-stone-600">Tenants pick from open times inside these hours. Booked times disappear automatically.</span>
        </span>
        <span className="text-xs font-semibold text-tea-700">{open ? 'Close' : 'Edit'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-stone-200 pt-4">
          {!windows ? (
            <p className="text-sm text-stone-600">Loading…</p>
          ) : (
            <>
              {!custom && <p className="mb-3 text-xs text-saffron-900 bg-saffron-50 border border-saffron-200 rounded-lg px-3 py-2">You’re using the default hours (Monday to Saturday, 9:00 to 17:00). Change them below.</p>}
              <ul className="space-y-2">
                {windows.map((w, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    <select aria-label="Day" value={w.dayOfWeek} onChange={e => update(i, { dayOfWeek: Number(e.target.value) })} className={input}>
                      {DAYS.map((d, j) => (
                        <option key={d} value={j + 1}>{d}</option>
                      ))}
                    </select>
                    <input aria-label="From" type="time" step={900} value={w.startTime} onChange={e => update(i, { startTime: e.target.value })} className={input} />
                    <span className="text-xs text-stone-600">to</span>
                    <input aria-label="Until" type="time" step={900} value={w.endTime} onChange={e => update(i, { endTime: e.target.value })} className={input} />
                    <button type="button" onClick={() => setWindows(ws => ws!.filter((_, j) => j !== i))} className="p-2 rounded-full text-stone-600 hover:text-red-700 hover:bg-red-50" aria-label="Remove these hours">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              {windows.length === 0 && <p className="text-sm text-stone-600">No hours set, so tenants can’t book viewings right now.</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setWindows(ws => [...ws!, { dayOfWeek: 6, startTime: '10:00', endTime: '13:00' }])}
                  disabled={windows.length >= 21}
                  className="btn-ghost h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add hours
                </button>
                <label className="text-xs text-ink-800 flex items-center gap-2 ml-auto">
                  Each viewing lasts
                  <select value={slotMinutes} onChange={e => setSlotMinutes(Number(e.target.value))} className={input}>
                    {LENGTHS.map(l => (
                      <option key={l} value={l}>{l} min</option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={save} disabled={saving} className="btn-primary h-9 px-4 rounded-full text-sm">
                  {saving ? 'Saving…' : 'Save hours'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
