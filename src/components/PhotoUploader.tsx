import React, { useRef, useState } from 'react';
import { ImagePlus, X, ChevronLeft, ChevronRight, Link2, LoaderCircle, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resizeImage, uploadImage, UploadFolder } from '../services/platformApi';

interface Pending {
  key: string;
  name: string;
  preview: string;
  progress: number;
  error?: string;
}

interface PhotoUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: UploadFolder;
  max?: number;
  /** Also allow pasting an image link */
  allowUrl?: boolean;
  label?: string;
  hint?: string;
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Could not read the photo'));
    r.readAsDataURL(blob);
  });

/**
 * Drag-and-drop photo uploader with in-browser resizing, progress, reordering (drag or arrow buttons)
 * and removal. The first photo is the cover. In offline demo mode photos stay in the browser.
 */
export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  value,
  onChange,
  folder,
  max = 12,
  allowUrl = false,
  label = 'Photos',
  hint = 'JPEG, PNG or WebP. Large photos are resized automatically. Drag to reorder — the first photo is the cover.'
}) => {
  const { isLive, addToast } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [url, setUrl] = useState('');
  const latest = useRef(value);
  latest.current = value;

  const room = max - value.length - pending.length;

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!list.length) {
      addToast('warning', 'Choose image files (JPEG, PNG or WebP).');
      return;
    }
    if (list.length > room) addToast('info', `Only ${Math.max(room, 0)} more ${room === 1 ? 'photo fits' : 'photos fit'} — the rest were skipped.`);
    const accepted = list.slice(0, Math.max(room, 0));

    await Promise.all(
      accepted.map(async file => {
        const key = `${file.name}-${Math.random().toString(36).slice(2, 8)}`;
        const preview = URL.createObjectURL(file);
        setPending(p => [...p, { key, name: file.name, preview, progress: 5 }]);
        try {
          const finalUrl = isLive
            ? await uploadImage(file, folder, pct => setPending(p => p.map(x => (x.key === key ? { ...x, progress: pct } : x))))
            : await blobToDataUrl(await resizeImage(file)); // demo mode: keep in the browser
          onChange([...latest.current, finalUrl]);
          setPending(p => p.filter(x => x.key !== key));
          URL.revokeObjectURL(preview);
        } catch (err) {
          setPending(p => p.map(x => (x.key === key ? { ...x, error: err instanceof Error ? err.message : 'Upload failed' } : x)));
        }
      })
    );
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const addUrl = () => {
    const u = url.trim();
    if (!/^https:\/\/\S+$/i.test(u)) {
      addToast('warning', 'Paste a full image link starting with https://');
      return;
    }
    if (value.length >= max) return;
    onChange([...value, u]);
    setUrl('');
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-label">{label}</span>
        <span className="text-xs text-stone-600 tabular-nums">
          {value.length}/{max}
        </span>
      </div>

      {room > 0 && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), inputRef.current?.click())}
          onDragOver={e => {
            if (dragIndex !== null) return;
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            if (dragIndex !== null) return;
            e.preventDefault();
            setDragOver(false);
            void addFiles(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-tea-600 bg-tea-50' : 'border-stone-300 bg-white hover:border-tea-600 hover:bg-stone-50'
          }`}
        >
          <span className="w-11 h-11 rounded-full bg-tea-50 text-tea-700 inline-flex items-center justify-center">
            <ImagePlus className="w-5 h-5" />
          </span>
          <span className="text-sm font-semibold text-ink-900">Drop photos here or click to choose</span>
          <span className="text-xs text-stone-600 max-w-sm">{hint}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={max > 1}
            className="sr-only"
            onChange={e => {
              if (e.target.files) void addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {(value.length > 0 || pending.length > 0) && (
        <ul className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2" aria-label="Uploaded photos">
          {value.map((src, i) => (
            <li
              key={src + i}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              className={`group relative aspect-[4/3] rounded-xl overflow-hidden border bg-stone-100 cursor-grab active:cursor-grabbing ${
                dragIndex === i ? 'opacity-40 border-tea-600' : 'border-stone-200'
              }`}
            >
              <img src={src} alt={`Photo ${i + 1}`} className="no-dim w-full h-full object-cover pointer-events-none" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-saffron-400 text-saffron-900 text-[10px] font-semibold">
                  <Star className="w-2.5 h-2.5" /> Cover
                </span>
              )}
              <div className="absolute inset-x-1 bottom-1 flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="w-7 h-7 rounded-lg bg-black/60 text-white inline-flex items-center justify-center disabled:opacity-30" aria-label={`Move photo ${i + 1} earlier`}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} className="w-7 h-7 rounded-lg bg-black/60 text-white inline-flex items-center justify-center disabled:opacity-30" aria-label={`Move photo ${i + 1} later`}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </span>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="w-7 h-7 rounded-lg bg-black/60 text-white inline-flex items-center justify-center hover:bg-red-700" aria-label={`Remove photo ${i + 1}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
          {pending.map(p => (
            <li key={p.key} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
              <img src={p.preview} alt="" className="no-dim w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
                {p.error ? (
                  <>
                    <span className="text-[11px] font-semibold text-red-800 bg-white/90 rounded px-1.5 py-0.5">{p.error}</span>
                    <button type="button" onClick={() => setPending(x => x.filter(y => y.key !== p.key))} className="text-[11px] underline text-ink-900 bg-white/90 rounded px-1.5">
                      Dismiss
                    </button>
                  </>
                ) : (
                  <LoaderCircle className="w-6 h-6 animate-spin text-tea-700" aria-label={`Uploading ${p.name}`} />
                )}
              </div>
              {!p.error && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-stone-200">
                  <div className="h-full bg-tea-600 transition-[width] duration-300" style={{ width: `${p.progress}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {allowUrl && value.length < max && (
        <div className="mt-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-stone-500 shrink-0" aria-hidden />
          <label htmlFor={`${folder}-photo-url`} className="sr-only">Or paste an image link</label>
          <input
            id={`${folder}-photo-url`}
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
            placeholder="Or paste an image link (https://…)"
            className="input-base h-9 text-xs flex-1"
          />
          <button type="button" onClick={addUrl} className="btn-secondary h-9 px-3 text-xs">
            Add link
          </button>
        </div>
      )}
    </div>
  );
};
