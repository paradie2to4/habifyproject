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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[3px] overflow-y-auto"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-heading"
    >
      <div
        className="animate-pop bg-white rounded-3xl max-w-3xl w-full border border-stone-200 overflow-hidden my-6 grid grid-cols-1 md:grid-cols-2"
        onClick={e => e.stopPropagation()}
      >
        <AuthBrandPanel className="hidden md:flex min-h-[520px]" />

        <div className="flex flex-col">
          <div className="p-6 pb-0 flex items-start justify-between">
            <div>
              <div className="md:hidden mb-4">
                <HabifyLogo size="sm" />
              </div>
              <h2 id="auth-heading" className="font-display text-2xl font-semibold text-ink-900">
                {mode === 'LOGIN' ? 'Sign in' : 'Create an account'}
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                {mode === 'LOGIN'
                  ? 'Continue your search for a home that fits.'
                  : 'Tell us how you want to use Habify.'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="p-2 text-stone-500 hover:text-ink-900 hover:bg-stone-100 rounded-lg transition-colors"
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
            <p className="text-xs text-center text-stone-500 mt-4">
              Prefer a full page?{' '}
              <button
                type="button"
                onClick={() => switchToPage(mode)}
                className="font-semibold text-ink-800 underline-offset-2 hover:underline"
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
