import React from 'react';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';
import { HabifyLogo } from './HabifyLogo';
import { AuthBrandPanel, AuthForm, AuthMode } from './AuthForm';

export const AuthModal: React.FC = () => {
  const { closeModal, modalData, setCurrentTab } = useApp();
  const initialMode: AuthMode = modalData?.mode === 'REGISTER' ? 'REGISTER' : 'LOGIN';
  const [mode, setMode] = React.useState<AuthMode>(initialMode);

  const switchToPage = (next: AuthMode) => {
    closeModal();
    setCurrentTab(next === 'LOGIN' ? 'LOGIN' : 'SIGNUP');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/50 overflow-y-auto"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-heading"
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full border border-cream-200 overflow-hidden my-6 grid grid-cols-1 md:grid-cols-2"
        onClick={e => e.stopPropagation()}
      >
        <AuthBrandPanel className="hidden md:flex min-h-[520px]" />

        <div className="flex flex-col">
          <div className="p-6 pb-0 flex items-start justify-between">
            <div>
              <div className="md:hidden mb-4">
                <HabifyLogo size="sm" />
              </div>
              <h2 id="auth-heading" className="font-display text-2xl font-semibold text-navy-900">
                {mode === 'LOGIN' ? 'Sign in' : 'Create an account'}
              </h2>
              <p className="text-sm text-cream-600 mt-1">
                {mode === 'LOGIN'
                  ? 'Continue your search for a home that fits.'
                  : 'Tell us how you want to use Habify.'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="p-2 text-cream-500 hover:text-navy-900 hover:bg-cream-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <AuthForm
              mode={mode}
              compact
              onSuccess={closeModal}
              onSwitchMode={next => {
                setMode(next);
              }}
            />
            <p className="text-xs text-center text-cream-500 mt-4">
              Prefer a full page?{' '}
              <button
                type="button"
                onClick={() => switchToPage(mode)}
                className="font-semibold text-navy-800 underline-offset-2 hover:underline"
              >
                Open {mode === 'LOGIN' ? 'sign in' : 'sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
