import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role, User } from '../types';
import { SEED_USERS } from '../data/seedData';
import { HabifyLogo } from './HabifyLogo';
import { loginApi, registerApi, setAuthToken } from '../services/api';
import { dashboardForRole, ownerRoleLabel } from '../utils/roles';
import { LogIn, UserPlus, Building, User as UserIcon } from 'lucide-react';

export type AuthMode = 'LOGIN' | 'REGISTER';

interface AuthFormProps {
  mode: AuthMode;
  onSwitchMode?: (mode: AuthMode) => void;
  compact?: boolean;
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSwitchMode,
  compact = false,
  onSuccess
}) => {
  const { setCurrentUser, addToast, setCurrentTab, backendStatus } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('TENANT');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const finish = (user: User, message: string) => {
    setCurrentUser(user);
    addToast('success', message);
    setCurrentTab(dashboardForRole(user.role));
    onSuccess?.();
  };

  const loginWithSeed = () => {
    const found = SEED_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setAuthToken(null);
      finish(found, `Welcome back, ${found.fullName.split(' ')[0]} (local demo).`);
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'LOGIN') {
        if (backendStatus === 'online') {
          try {
            const { user } = await loginApi(email.trim(), password);
            finish(user, `Welcome back, ${user.fullName.split(' ')[0]}.`);
            return;
          } catch (err) {
            // Never fall back to a fake local account while the API is up: it would have no token.
            setError(err instanceof Error ? err.message : 'Invalid email or password.');
            return;
          }
        }

        if (loginWithSeed()) return;

        const newUser: User = {
          id: `usr-${Date.now().toString().slice(-4)}`,
          email: email.trim(),
          fullName: email.split('@')[0],
          role: 'TENANT',
          isActive: true,
          createdAt: new Date().toISOString()
        };
        finish(newUser, `Signed in as ${newUser.fullName}`);
      } else {
        if (!fullName.trim()) {
          setError('Please enter your full name.');
          return;
        }

        if (backendStatus === 'online') {
          try {
            const { user } = await registerApi({
              email: email.trim(),
              password,
              fullName: fullName.trim(),
              phoneNumber: phone.trim() || undefined,
              role
            });
            finish(user, `Account created for ${user.fullName}.`);
            return;
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create account.');
            return;
          }
        }

        const newUser: User = {
          id: `usr-${Date.now().toString().slice(-4)}`,
          email: email.trim(),
          fullName: fullName.trim(),
          role,
          phoneNumber: phone.trim() || undefined,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        finish(newUser, `Account created for ${newUser.fullName}.`);
      }

      void rememberMe;
    } finally {
      setSubmitting(false);
    }
  };

  const idPrefix = compact ? 'modal' : mode.toLowerCase();

  return (
    <div className={compact ? 'flex flex-col' : 'space-y-6'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'REGISTER' && (
          <>
            <div>
              <label htmlFor={`${idPrefix}-name`} className="text-label block mb-2">
                Full name
              </label>
              <input
                id={`${idPrefix}-name`}
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Claire Mukamana"
                className="input-base w-full"
                autoComplete="name"
              />
            </div>

            <div>
              <span className="text-label block mb-2">I am looking to</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('TENANT')}
                  className={`p-4 rounded-xl text-left border transition-colors ${
                    role === 'TENANT'
                      ? 'border-tea-700 bg-tea-50'
                      : 'border-stone-200 bg-white hover:border-stone-400'
                  }`}
                >
                  <UserIcon className={`w-4 h-4 mb-2 ${role === 'TENANT' ? 'text-ink-900' : 'text-stone-500'}`} />
                  <div className="text-sm font-semibold text-ink-900">Find a home</div>
                  <div className="text-xs text-stone-600 mt-0.5">Tenant</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('LANDLORD')}
                  className={`p-4 rounded-xl text-left border transition-colors ${
                    role === 'LANDLORD'
                      ? 'border-tea-700 bg-tea-50'
                      : 'border-stone-200 bg-white hover:border-stone-400'
                  }`}
                >
                  <Building className={`w-4 h-4 mb-2 ${role === 'LANDLORD' ? 'text-tea-700' : 'text-stone-500'}`} />
                  <div className="text-sm font-semibold text-ink-900">List a property</div>
                  <div className="text-xs text-stone-600 mt-0.5">{ownerRoleLabel()}</div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor={`${idPrefix}-phone`} className="text-label block mb-2">
                Phone <span className="font-normal text-stone-500 normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id={`${idPrefix}-phone`}
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+250 788 000 000"
                className="input-base w-full"
                autoComplete="tel"
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor={`${idPrefix}-email`} className="text-label block mb-2">
            Email
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="input-base w-full"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-password`} className="text-label block mb-2">
            Password
          </label>
          <input
            id={`${idPrefix}-password`}
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-base w-full"
            autoComplete={mode === 'LOGIN' ? 'current-password' : 'new-password'}
          />
        </div>

        {mode === 'LOGIN' && (
          <label className="flex items-center gap-2 text-sm text-ink-800 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="rounded border-stone-400 text-ink-900 focus:ring-tea-600"
            />
            Keep me signed in
          </label>
        )}

        {error && (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full h-12 text-[15px] disabled:opacity-60"
        >
          {mode === 'LOGIN' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          <span>
            {submitting
              ? 'Please wait…'
              : mode === 'LOGIN'
                ? 'Sign in'
                : 'Create account'}
          </span>
        </button>

        {onSwitchMode && (
          <p className="text-sm text-center text-stone-600">
            {mode === 'LOGIN' ? (
              <>
                New to Habify?{' '}
                <button type="button" onClick={() => onSwitchMode('REGISTER')} className="font-semibold text-tea-700 hover:underline underline-offset-2">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => onSwitchMode('LOGIN')} className="font-semibold text-tea-700 hover:underline underline-offset-2">
                  Sign in
                </button>
              </>
            )}
          </p>
        )}
      </form>
    </div>
  );
};

interface AuthBrandPanelProps {
  className?: string;
}

export const AuthBrandPanel: React.FC<AuthBrandPanelProps> = ({ className = '' }) => (
  <div className={`palette-light relative flex min-h-[320px] flex-col justify-between p-10 bg-tea-700 topo text-white overflow-hidden ${className}`}>
    <HabifyLogo size="md" theme="dark" />

    <div className="relative">
      <p className="font-display text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight text-white">
        A home that fits <span className="text-saffron-300">your life</span>, not just your search.
      </p>
      <ul className="mt-8 space-y-3 text-[15px] text-tea-50">
        {[
          'Every home scored against your budget and must-haves',
          'Know what you can afford before you visit',
          'Book viewings and message landlords in one place'
        ].map(item => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-1 w-5 h-5 shrink-0 rounded-full bg-white/15 inline-flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron-300" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>

    <p className="text-xs text-tea-100/80">Kigali · Musanze · Rubavu · Huye and beyond</p>
  </div>
);
