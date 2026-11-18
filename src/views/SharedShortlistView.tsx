import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BedDouble, Bath, MapPin, MessageSquare, ThumbsDown, ThumbsUp, Users } from 'lucide-react';
import { fetchPublicShortlistApi, javaHashHex, Shortlist, ShortlistHome, voterKey, voteShortlistApi } from '../services/featuresApi';
import { propertyPath } from '../routes';

const NAME_KEY = 'habify_voter_name';

/** Public page behind a shared link: anyone can vote on the homes, no account needed. */
export const SharedShortlistView: React.FC = () => {
  const { token = '' } = useParams();
  const [list, setList] = useState<Shortlist | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem(NAME_KEY) || '';
    } catch {
      return '';
    }
  });
  const [busyId, setBusyId] = useState('');
  const [noteFor, setNoteFor] = useState('');
  const [note, setNote] = useState('');
  const me = useMemo(() => javaHashHex(voterKey()), []);

  useEffect(() => {
    fetchPublicShortlistApi(token)
      .then(setList)
      .catch(e => setError(e.status === 404 ? 'This link doesn’t work any more. Ask for a new one.' : (e as Error).message));
  }, [token]);

  useEffect(() => {
    if (list) document.title = `${list.title} · Habify`;
  }, [list]);

  const mine = (h: ShortlistHome) => h.votes.find(v => v.key === me);

  const vote = async (h: ShortlistHome, value: number, comment?: string) => {
    const who = name.trim();
    if (!who) {
      document.getElementById('voter-name')?.focus();
      setError('Add your name first so everyone knows who voted.');
      return;
    }
    setError('');
    setBusyId(h.id);
    try {
      localStorage.setItem(NAME_KEY, who);
    } catch {
      /* fine */
    }
    try {
      setList(await voteShortlistApi(token, { propertyId: h.id, voterKey: voterKey(), voterName: who, value, comment }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId('');
    }
  };

  if (error && !list) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <h1 className="font-display text-2xl font-bold text-ink-900">Shortlist not found</h1>
        <p className="mt-2 text-stone-600">{error}</p>
        <Link to="/" className="btn-primary rounded-full mt-6 inline-flex">Explore homes on Habify</Link>
      </div>
    );
  }
  if (!list) return <div className="max-w-3xl mx-auto py-24 text-center text-stone-600">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      <header className="rounded-3xl bg-white border border-stone-200 topo-ink p-6 sm:p-8">
        <span className="eyebrow inline-flex items-center gap-2"><Users className="w-4 h-4" /> Shared by {list.ownerName}</span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-ink-900">{list.title}</h1>
        <p className="mt-2 text-ink-600">
          {list.ownerName} wants your opinion. Vote on each home and leave a note. {list.voters > 0 && `${list.voters} ${list.voters === 1 ? 'person has' : 'people have'} voted so far.`}
        </p>
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-2 max-w-md">
          <label htmlFor="voter-name" className="text-sm font-semibold text-ink-800 shrink-0">Your name</label>
          <input
            id="voter-name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
            placeholder="e.g. Aline"
            className="flex-1 h-10 rounded-full border border-stone-300 bg-white px-4 text-sm text-ink-900 focus:border-tea-600 focus:ring-4 focus:ring-tea-600/15 outline-none"
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
      </header>

      <ol className="space-y-4">
        {list.homes.map((h, i) => {
          const my = mine(h);
          return (
            <li key={h.id} className="rounded-2xl bg-white border border-stone-200 overflow-hidden sm:grid sm:grid-cols-[220px_minmax(0,1fr)]">
              <Link to={propertyPath(h.id)} className="palette-light block relative aspect-[4/3] sm:aspect-auto bg-stone-100">
                {h.image && <img src={h.image} alt="" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />}
                <span className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/95 text-ink-900 font-display font-bold inline-flex items-center justify-center">{i + 1}</span>
              </Link>
              <div className="p-5">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-xl font-bold text-ink-900 tabular-nums">{Math.round(h.monthlyRent).toLocaleString()}</span>
                  <span className="text-xs text-stone-600">RWF / month</span>
                  {h.isAvailable === false && <span className="ml-2 text-[11px] font-semibold text-red-700">No longer available</span>}
                </div>
                <Link to={propertyPath(h.id)} className="block mt-1 font-semibold text-ink-900 hover:text-tea-700">{h.title}</Link>
                <p className="mt-1 text-xs text-stone-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {h.locationSector && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-tea-600" />{h.locationSector}</span>}
                  {h.bedrooms != null && <span className="inline-flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{h.bedrooms} beds</span>}
                  {h.bathrooms != null && <span className="inline-flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{h.bathrooms} baths</span>}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === h.id}
                    onClick={() => vote(h, my?.value === 1 ? 0 : 1, my?.comment)}
                    aria-pressed={my?.value === 1}
                    className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-semibold border transition-colors ${
                      my?.value === 1 ? 'bg-tea-700 border-tea-700 text-white' : 'border-stone-300 text-ink-800 hover:border-tea-600'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" /> Love it <span className="tabular-nums opacity-80">{h.up}</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyId === h.id}
                    onClick={() => vote(h, my?.value === -1 ? 0 : -1, my?.comment)}
                    aria-pressed={my?.value === -1}
                    className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-semibold border transition-colors ${
                      my?.value === -1 ? 'bg-ink-800 border-ink-800 text-white' : 'border-stone-300 text-ink-800 hover:border-ink-500'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" /> Not for us <span className="tabular-nums opacity-80">{h.down}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNoteFor(noteFor === h.id ? '' : h.id);
                      setNote(my?.comment || '');
                    }}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium text-stone-700 hover:text-tea-700"
                  >
                    <MessageSquare className="w-4 h-4" /> {my?.comment ? 'Edit note' : 'Add a note'}
                  </button>
                </div>

                {noteFor === h.id && (
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={e => {
                      e.preventDefault();
                      vote(h, my?.value ?? 0, note.trim() || undefined).then(() => setNoteFor(''));
                    }}
                  >
                    <input
                      autoFocus
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      maxLength={280}
                      placeholder="e.g. Great light, but far from my school"
                      className="flex-1 h-10 rounded-full border border-stone-300 bg-white px-4 text-sm text-ink-900 focus:border-tea-600 outline-none"
                    />
                    <button type="submit" className="btn-primary h-10 rounded-full">Save</button>
                  </form>
                )}

                {h.votes.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {h.votes.map(v => (
                      <li key={v.key} className="text-xs text-ink-700">
                        <span className="font-semibold">{v.name}{v.key === me ? ' (you)' : ''}</span>{' '}
                        {v.value > 0 ? 'loves it' : v.value < 0 ? 'isn’t keen' : 'commented'}
                        {v.comment && <span className="text-stone-600">: “{v.comment}”</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="text-center text-xs text-stone-500 pb-8">
        Looking for a home yourself? <Link to="/" className="font-semibold text-tea-700 hover:underline">Explore Habify</Link>
      </p>
    </div>
  );
};
