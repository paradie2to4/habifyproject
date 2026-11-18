import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, KeyRound, ShieldCheck, LoaderCircle, CircleAlert, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HabifyMark } from '../components/HabifyLogo';
import { confirmVerificationApi, forgotPasswordApi, resetPasswordApi } from '../services/platformApi';

const Card: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="w-full max-w-md mx-auto my-6">
    <div className="bg-white rounded-[28px] border border-stone-200 p-8 sm:p-10" style={{ boxShadow: 'var(--shadow-lift)' }}>
      <div className="flex items-center gap-3 mb-6">
        <HabifyMark size="md" />
        <span className="w-11 h-11 rounded-2xl bg-tea-50 text-tea-700 inline-flex items-center justify-center">{icon}</span>
      </div>
      <h1 className="font-display text-3xl font-bold text-ink-900 tracking-tight">{title}</h1>
      <div className="mt-3">{children}</div>
    </div>
  </div>
);

export const ForgotPasswordView: React.FC = () => {
  const navigate = useNavigate();
  const { backendStatus } = useApp();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    try {
      await forgotPasswordApi(email.trim());
      setState('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <Card icon={<MailCheck className="w-5 h-5" />} title="Check your email">
        <p className="text-[15px] text-ink-700 leading-relaxed">
          If there’s an account for <span className="font-semibold text-ink-900">{email}</span>, a link to choose a new password is on its way. It works once and expires in an hour.
        </p>
        <p className="mt-3 text-sm text-stone-600">Not there after a few minutes? Check your spam folder.</p>
        <button type="button" onClick={() => navigate('/login')} className="btn-secondary w-full h-12 mt-6 rounded-full">
          Back to sign in
        </button>
      </Card>
    );
  }

  return (
    <Card icon={<KeyRound className="w-5 h-5" />} title="Forgot your password?">
      <p className="text-[15px] text-ink-700">Enter the email you signed up with and we’ll send you a link to choose a new one.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="forgot-email" className="text-label block mb-2">Email</label>
          <input id="forgot-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-base" autoComplete="email" placeholder="you@email.com" />
        </div>
        {state === 'error' && <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5" role="alert">{error}</p>}
        {backendStatus === 'offline' && (
          <p className="text-sm text-saffron-800 bg-saffron-50 border border-saffron-200 rounded-xl px-3.5 py-2.5">Password reset needs Habify’s server, which isn’t reachable right now.</p>
        )}
        <button type="submit" disabled={state === 'sending' || backendStatus === 'offline'} className="btn-primary w-full h-12 text-[15px]">
          {state === 'sending' ? <LoaderCircle className="w-4 h-4 animate-spin" /> : 'Send reset link'}
        </button>
        <button type="button" onClick={() => navigate('/login')} className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-tea-700">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </button>
      </form>
    </Card>
  );
};

export const ResetPasswordView: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The two passwords don’t match.');
    setState('saving');
    try {
      await resetPasswordApi(token, password);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t reset your password');
      setState('idle');
    }
  };

  if (!token) {
    return (
      <Card icon={<CircleAlert className="w-5 h-5" />} title="This link isn’t complete">
        <p className="text-[15px] text-ink-700">Open the link from your email again, or request a new one.</p>
        <button type="button" onClick={() => navigate('/forgot-password')} className="btn-primary w-full h-12 mt-6 rounded-full">Request a new link</button>
      </Card>
    );
  }

  if (state === 'done') {
    return (
      <Card icon={<ShieldCheck className="w-5 h-5" />} title="Password updated">
        <p className="text-[15px] text-ink-700">You can now sign in with your new password.</p>
        <button type="button" onClick={() => navigate('/login')} className="btn-primary w-full h-12 mt-6 rounded-full">Sign in</button>
      </Card>
    );
  }

  return (
    <Card icon={<KeyRound className="w-5 h-5" />} title="Choose a new password">
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="reset-pw" className="text-label block mb-2">New password</label>
          <input id="reset-pw" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="input-base" autoComplete="new-password" />
          <p className="mt-1.5 text-xs text-stone-600">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="reset-pw2" className="text-label block mb-2">Repeat it</label>
          <input id="reset-pw2" type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="input-base" autoComplete="new-password" />
        </div>
        {error && (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5" role="alert">
            {error}{' '}
            {/expired|used|invalid/i.test(error) && (
              <button type="button" onClick={() => navigate('/forgot-password')} className="font-semibold underline">Get a new link</button>
            )}
          </p>
        )}
        <button type="submit" disabled={state === 'saving'} className="btn-primary w-full h-12 text-[15px]">
          {state === 'saving' ? <LoaderCircle className="w-4 h-4 animate-spin" /> : 'Save new password'}
        </button>
      </form>
    </Card>
  );
};

export const VerifyEmailView: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, refreshFromServer } = useApp();
  const token = params.get('token') || '';
  const [state, setState] = useState<'working' | 'done' | 'error'>(token ? 'working' : 'error');
  const [error, setError] = useState(token ? '' : 'This link isn’t complete. Open it again from your email.');
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    confirmVerificationApi(token)
      .then(user => {
        if (currentUser && currentUser.id === user.id) {
          setCurrentUser({ ...currentUser, emailVerified: true });
          void refreshFromServer(); // a lease may have been linked to this account
        }
        setState('done');
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'This link didn’t work');
        setState('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (state === 'working') {
    return (
      <Card icon={<LoaderCircle className="w-5 h-5 animate-spin" />} title="Confirming your email…">
        <p className="text-[15px] text-ink-700">This only takes a moment.</p>
      </Card>
    );
  }
  if (state === 'error') {
    return (
      <Card icon={<CircleAlert className="w-5 h-5" />} title="We couldn’t confirm your email">
        <p className="text-[15px] text-ink-700">{error}</p>
        <p className="mt-2 text-sm text-stone-600">You can request a new confirmation email from your profile.</p>
        <button type="button" onClick={() => navigate(currentUser ? '/' : '/login')} className="btn-primary w-full h-12 mt-6 rounded-full">
          {currentUser ? 'Back to Habify' : 'Sign in'}
        </button>
      </Card>
    );
  }
  return (
    <Card icon={<ShieldCheck className="w-5 h-5" />} title="Email confirmed">
      <p className="text-[15px] text-ink-700">Thanks! You’ll now get viewing updates, messages and rent reminders by email.</p>
      <button type="button" onClick={() => navigate(currentUser ? '/' : '/login')} className="btn-primary w-full h-12 mt-6 rounded-full">
        {currentUser ? 'Continue' : 'Sign in'}
      </button>
    </Card>
  );
};
