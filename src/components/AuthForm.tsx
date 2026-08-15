import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role, User } from '../types';
import { SEED_USERS } from '../data/seedData';
import { HabifyLogo } from './HabifyLogo';
import { LogIn, UserPlus, Building, User as UserIcon } from 'lucide-react';

export type AuthMode = 'LOGIN' | 'REGISTER';

interface AuthFormProps {
  mode: AuthMode;
  onSwitchMode?: (mode: AuthMode) => void;
  compact?: boolean;
  onSuccess?: () => void;
}

function dashboardForRole(role: Role) {
  if (role === 'LANDLORD') return 'LANDLORD_DASHBOARD' as const;
  if (role === 'ADMIN') return 'ADMIN_DASHBOARD' as const;
  return 'TENANT_DASHBOARD' as const;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSwitchMode,
  compact = false,
  onSuccess
}) => {
  const { setCurrentUser, addToast, setCurrentTab } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('TENANT');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const finish = (user: User, message: string) => {
    setCurrentUser(user);
    addToast('success', message);
    setCurrentTab(dashboardForRole(user.role));
    onSuccess?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (mode === 'LOGIN') {
      const found = SEED_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        finish(found, `Welcome back, ${found.fullName.split(' ')[0]}.`);
      } else {
        const newUser: User = {
          id: `usr-${Date.now().toString().slice(-4)}`,
          email: email.trim(),
          fullName: email.split('@')[0],
          role: 'TENANT',
          isActive: true,
          createdAt: new Date().toISOString()
        };
        finish(newUser, `Signed in as ${newUser.fullName}`);
      }
    } else {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
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
                  className={`p-4 rounded-lg text-left border transition-colors ${
                    role === 'TENANT'
                      ? 'border-navy-900 bg-navy-50'
                      : 'border-cream-200 bg-white hover:border-cream-400'
                  }`}
                >
                  <UserIcon className={`w-4 h-4 mb-2 ${role === 'TENANT' ? 'text-navy-900' : 'text-cream-500'}`} />
                  <div className="text-sm font-semibold text-navy-900">Find a home</div>
                  <div className="text-xs text-cream-600 mt-0.5">Tenant</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('LANDLORD')}
                  className={`p-4 rounded-lg text-left border transition-colors ${
                    role === 'LANDLORD'
                      ? 'border-terra-600 bg-terra-50'
                      : 'border-cream-200 bg-white hover:border-cream-400'
                  }`}
                >
                  <Building className={`w-4 h-4 mb-2 ${role === 'LANDLORD' ? 'text-terra-700' : 'text-cream-500'}`} />
                  <div className="text-sm font-semibold text-navy-900">List a property</div>
                  <div className="text-xs text-cream-600 mt-0.5">Landlord</div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor={`${idPrefix}-phone`} className="text-label block mb-2">
                Phone <span className="font-normal text-cream-500 normal-case tracking-normal">(optional)</span>
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
          <label className="flex items-center gap-2 text-sm text-navy-800 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="rounded border-cream-400 text-navy-900 focus:ring-navy-900"
            />
            Keep me signed in
          </label>
        )}

        {error && (
          <p className="text-sm text-terra-700 bg-terra-50 border border-terra-200 rounded-lg px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
          {mode === 'LOGIN' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          <span>{mode === 'LOGIN' ? 'Sign in' : 'Create account'}</span>
        </button>

        {onSwitchMode && (
          <p className="text-sm text-center text-cream-600">
            {mode === 'LOGIN' ? (
              <>
                New to Habify?{' '}
                <button type="button" onClick={() => onSwitchMode('REGISTER')} className="font-semibold text-navy-900">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => onSwitchMode('LOGIN')} className="font-semibold text-navy-900">
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
  <div className={`relative flex min-h-[320px] flex-col justify-between p-8 text-white overflow-hidden ${className}`}>
    <img
      src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80"
      alt="A warm, sunlit home interior"
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-navy-950/70" />
    <div className="relative z-10">
      <HabifyLogo size="md" theme="dark" />
    </div>
    <div className="relative z-10 space-y-3">
      <p className="font-display text-3xl sm:text-4xl font-semibold leading-tight">
        Find Where You Belong.
      </p>
      <p className="text-sm text-cream-200 leading-relaxed max-w-sm">
        Homes across Rwanda, matched to how you actually live.
      </p>
    </div>
  </div>
);
