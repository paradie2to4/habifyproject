import React, { useRef, useState } from 'react';
import { Camera, LoaderCircle, ShieldCheck, MailWarning, KeyRound, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { changePasswordApi, sendVerificationApi, uploadImage } from '../services/platformApi';

interface AccountSettingsProps {
  fullName: string;
  phone: string;
  avatarUrl: string;
  onChange: (fields: { fullName?: string; phone?: string; avatarUrl?: string }) => void;
}

/** Profile fields (saved by the parent's Save button), plus email status and password change (saved immediately). */
export const AccountSettings: React.FC<AccountSettingsProps> = ({ fullName, phone, avatarUrl, onChange }) => {
  const { currentUser, isLive, addToast } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [verifySent, setVerifySent] = useState(false);

  if (!currentUser) return null;

  const pickAvatar = async (file?: File) => {
    if (!file) return;
    if (!isLive) {
      addToast('info', 'Profile photos can be uploaded when Habify is connected to its server.');
      return;
    }
    setUploading(true);
    try {
      onChange({ avatarUrl: await uploadImage(file, 'avatars') });
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (next.length < 8) {
      setPwError('Use at least 8 characters.');
      return;
    }
    setSavingPw(true);
    try {
      await changePasswordApi(current, next);
      addToast('success', 'Password changed.');
      setCurrent('');
      setNext('');
      setShowPassword(false);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Couldn’t change your password');
    } finally {
      setSavingPw(false);
    }
  };

  const resend = async () => {
    try {
      await sendVerificationApi();
      setVerifySent(true);
      addToast('success', `Confirmation email sent to ${currentUser.email}.`);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Couldn’t send the email');
    }
  };

  return (
    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200 space-y-4">
      <p className="text-label">Your profile</p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden bg-tea-100 text-tea-800 inline-flex items-center justify-center text-xl font-semibold group"
          aria-label="Change profile photo"
        >
          {avatarUrl ? <img src={avatarUrl} alt="" className="no-dim w-full h-full object-cover" referrerPolicy="no-referrer" /> : fullName.charAt(0).toUpperCase()}
          <span className="absolute inset-0 bg-black/45 text-white inline-flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
            {uploading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => void pickAvatar(e.target.files?.[0])} />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-ink-900 truncate">{currentUser.email}</p>
          {currentUser.emailVerified ? (
            <p className="inline-flex items-center gap-1 text-xs font-semibold text-tea-700">
              <ShieldCheck className="w-3.5 h-3.5" /> Email confirmed
            </p>
          ) : (
            <p className="text-xs text-saffron-800 inline-flex items-center gap-1 flex-wrap">
              <MailWarning className="w-3.5 h-3.5" /> Not confirmed yet ·
              {isLive && (
                <button type="button" onClick={resend} disabled={verifySent} className="font-semibold underline underline-offset-2 disabled:no-underline disabled:opacity-70">
                  {verifySent ? 'Email sent' : 'Resend email'}
                </button>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="acct-name" className="text-label block mb-1.5">Full name</label>
          <input id="acct-name" type="text" value={fullName} onChange={e => onChange({ fullName: e.target.value })} className="input-base" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="acct-phone" className="text-label block mb-1.5">Phone</label>
          <input id="acct-phone" type="tel" value={phone} onChange={e => onChange({ phone: e.target.value })} className="input-base" placeholder="+250 788 000 000" autoComplete="tel" />
        </div>
      </div>

      {isLive && (
        <div className="pt-3 border-t border-stone-200">
          <button type="button" onClick={() => setShowPassword(s => !s)} aria-expanded={showPassword} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900 hover:text-tea-700">
            <KeyRound className="w-4 h-4" /> Change password
            <ChevronDown className={`w-4 h-4 transition-transform ${showPassword ? 'rotate-180' : ''}`} />
          </button>
          {showPassword && (
            <form onSubmit={savePassword} className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div>
                <label htmlFor="pw-current" className="text-label block mb-1.5">Current password</label>
                <input id="pw-current" type="password" value={current} onChange={e => setCurrent(e.target.value)} className="input-base" autoComplete="current-password" required />
              </div>
              <div>
                <label htmlFor="pw-new" className="text-label block mb-1.5">New password</label>
                <input id="pw-new" type="password" value={next} onChange={e => setNext(e.target.value)} className="input-base" autoComplete="new-password" minLength={8} required />
              </div>
              <button type="submit" disabled={savingPw} className="btn-primary h-11">
                {savingPw ? <LoaderCircle className="w-4 h-4 animate-spin" /> : 'Update'}
              </button>
              {pwError && <p className="sm:col-span-3 text-xs text-red-800" role="alert">{pwError}</p>}
            </form>
          )}
        </div>
      )}
    </div>
  );
};
