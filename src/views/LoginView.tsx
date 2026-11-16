import React from 'react';
import { useApp } from '../context/AppContext';
import { HabifyLogo } from '../components/HabifyLogo';
import { AuthBrandPanel, AuthForm } from '../components/AuthForm';

export const LoginView: React.FC = () => {
  const { setCurrentTab } = useApp();

  return (
    <div id="login-view" className="w-full max-w-5xl mx-auto">
      <div className="bg-white rounded-[28px] border border-stone-200 overflow-hidden grid grid-cols-1 md:grid-cols-[1.05fr_1fr] min-h-[560px]" style={{ boxShadow: 'var(--shadow-lift)' }}>
        <AuthBrandPanel className="hidden md:flex" />

        <div className="p-6 sm:p-10 lg:p-14 flex flex-col justify-center">
          <div className="md:hidden mb-6">
            <HabifyLogo size="sm" />
          </div>

          <h1 className="font-display text-4xl font-bold text-ink-900">Welcome back</h1>
          <p className="text-sm text-stone-600 mt-2 mb-6">
            Continue your search for a home that fits.
          </p>

          <AuthForm
            mode="LOGIN"
            onSwitchMode={() => setCurrentTab('SIGNUP')}
          />
        </div>
      </div>
    </div>
  );
};
