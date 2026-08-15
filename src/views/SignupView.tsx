import React from 'react';
import { useApp } from '../context/AppContext';
import { HabifyLogo } from '../components/HabifyLogo';
import { AuthBrandPanel, AuthForm } from '../components/AuthForm';

export const SignupView: React.FC = () => {
  const { setCurrentTab } = useApp();

  return (
    <div id="signup-view" className="w-full max-w-5xl mx-auto">
      <div className="bg-white rounded-xl border border-cream-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[620px]">
        <AuthBrandPanel className="hidden md:flex" />

        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <div className="md:hidden mb-6">
            <HabifyLogo size="sm" />
          </div>

          <h1 className="font-display text-3xl font-semibold text-navy-900">Create an account</h1>
          <p className="text-sm text-cream-600 mt-2 mb-6">
            Tell us how you want to use Habify — as a tenant or a landlord.
          </p>

          <AuthForm
            mode="REGISTER"
            onSwitchMode={() => setCurrentTab('LOGIN')}
          />
        </div>
      </div>
    </div>
  );
};
