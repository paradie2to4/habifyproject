import React, { useEffect, useState } from 'react';
import { Check, Copy, Link2, RefreshCw, Share2, ThumbsDown, ThumbsUp, Trash2, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  createShortlistApi,
  deleteShortlistApi,
  fetchShortlistsApi,
  newShortlistLinkApi,
  Shortlist,
  shortlistUrl
} from '../services/featuresApi';

/** Share saved homes with family or flatmates; they vote without an account. */
export const ShortlistsPanel: React.FC<{ homeIds: string[]; selectedIds: string[] }> = ({ homeIds, selectedIds }) => {
  const { currentUser, isLive, addToast, setCurrentTab } = useApp();
  const [lists, setLists] = useState<Shortlist[] | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!isLive || !currentUser) return;
    fetchShortlistsApi().then(setLists).catch(() => setLists([]));
  }, [isLive, currentUser]);

  if (!isLive) return null;

  const share = selectedIds.length >= 2 ? selectedIds : homeIds;

  const copy = async (token: string) => {
    const url = shortlistUrl(token);
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: 'Help me pick a home', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(token);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  const create = async () => {
    if (!currentUser) {
      addToast('info', 'Sign in to share your saved homes.');
      setCurrentTab('LOGIN');
      return;
    }
    setBusy(true);
    try {
      const s = await createShortlistApi(title.trim() || 'Homes I’m considering', share.slice(0, 20));
      setLists(l => [s, ...(l || [])]);
      setTitle('');
      if (s.shareToken) await copy(s.shareToken);
      addToast('success', 'Link ready. Anyone with it can vote, no account needed.');
    } catch (e) {
      addToast('error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const rotate = async (s: Shortlist) => {
    if (!s.id || !window.confirm('Make a new link? The old link will stop working.')) return;
    try {
      const n = await newShortlistLinkApi(s.id);
      setLists(l => l!.map(x => (x.id === s.id ? n : x)));
    } catch (e) {
      addToast('error', (e as Error).message);
    }
  };

  const remove = async (s: Shortlist) => {
    if (!s.id || !window.confirm(`Delete “${s.title}” and its votes? The link will stop working.`)) return;
    try {
      await deleteShortlistApi(s.id);
      setLists(l => l!.filter(x => x.id !== s.id));
    } catch (e) {
      addToast('error', (e as Error).message);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6" aria-labelledby="share-title">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex-1">
          <h2 id="share-title" className="text-lg font-semibold text-ink-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-tea-700" /> Decide together
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Send a link to family or flatmates. They can vote and comment on each home without signing up.
          </p>
        </div>
        {share.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 lg:w-[28rem]">
            <label htmlFor="sl-title" className="sr-only">Name this list</label>
            <input
              id="sl-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={80}
              placeholder="e.g. Our flat for next year"
              className="flex-1 h-10 rounded-full border border-stone-300 bg-white px-4 text-sm text-ink-900 focus:border-tea-600 focus:ring-4 focus:ring-tea-600/15 outline-none"
            />
            <button type="button" onClick={create} disabled={busy} className="btn-primary h-10 rounded-full inline-flex items-center gap-2 whitespace-nowrap">
              <Share2 className="w-4 h-4" />
              {busy ? 'Creating…' : `Share ${Math.min(share.length, 20)} ${share.length === 1 ? 'home' : 'homes'}`}
            </button>
          </div>
        )}
      </div>
      {selectedIds.length >= 2 && <p className="mt-2 text-xs text-stone-600">Sharing only the {selectedIds.length} homes you selected.</p>}

      {lists && lists.length > 0 && (
        <ul className="mt-5 space-y-3">
          {lists.map(s => {
            const top = s.homes[0];
            return (
              <li key={s.id} className="rounded-xl border border-stone-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link2 className="w-4 h-4 text-tea-700" />
                  <span className="font-semibold text-ink-900">{s.title}</span>
                  <span className="text-xs text-stone-600">
                    {s.homes.length} homes · {s.voters} {s.voters === 1 ? 'person has' : 'people have'} voted
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <button type="button" onClick={() => s.shareToken && copy(s.shareToken)} className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-semibold border border-stone-300 hover:border-tea-600 text-ink-800">
                      {copied === s.shareToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === s.shareToken ? 'Copied' : 'Copy link'}
                    </button>
                    <button type="button" onClick={() => rotate(s)} className="p-2 rounded-full text-stone-600 hover:bg-stone-100" title="Make a new link (the old one stops working)" aria-label="Make a new link">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => remove(s)} className="p-2 rounded-full text-stone-600 hover:text-red-700 hover:bg-red-50" aria-label={`Delete ${s.title}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </span>
                </div>
                {s.voters > 0 && (
                  <ul className="mt-3 grid sm:grid-cols-2 gap-2">
                    {s.homes.slice(0, 4).map(h => (
                      <li key={h.id} className="flex items-center gap-2 text-sm">
                        <span className="min-w-0 flex-1 truncate text-ink-800">
                          {h === top && h.up > h.down ? '★ ' : ''}
                          {h.title}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-tea-800 tabular-nums"><ThumbsUp className="w-3.5 h-3.5" />{h.up}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-stone-600 tabular-nums"><ThumbsDown className="w-3.5 h-3.5" />{h.down}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
