import React, { useState } from 'react';
import { MailWarning, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sendVerificationApi } from '../services/platformApi';

const DISMISS_KEY = 'habify_verify_banner_dismissed';

/** Slim reminder for signed-in users who haven't confirmed their email yet. */
export const VerifyEmailBanner: React.FC = () => {
  const { currentUser, isLive, addToast } = useApp();
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === currentUser?.id;
    } catch {
      return false;
    }
  });

  if (!isLive || !currentUser || currentUser.emailVerified || dismissed) return null;

  const resend = async () => {
    try {
      await sendVerificationApi();
      setSent(true);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Couldn’t send the email');
    }
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, currentUser.id);
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <div className="bg-saffron-50 border-b border-saffron-200 text-saffron-900" role="status">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 text-sm">
        <MailWarning className="w-4 h-4 shrink-0" aria-hidden />
        <p className="flex-1 min-w-0">
          {sent ? (
            <>Sent! Open the link we emailed to <span className="font-semibold">{currentUser.email}</span>.</>
          ) : (
            <>Confirm your email so you get viewing updates, messages and rent reminders.</>
          )}
        </p>
        {!sent && (
          <button type="button" onClick={resend} className="shrink-0 font-semibold underline underline-offset-2 hover:no-underline">
            Send confirmation email
          </button>
        )}
        <button type="button" onClick={dismiss} className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-lg hover:bg-saffron-100" aria-label="Hide this reminder">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
