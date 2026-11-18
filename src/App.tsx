import React, { useEffect } from 'react';
import { Routes, Route, useLocation, matchPath } from 'react-router-dom';
import { PROPERTY_ROUTE } from './routes';
import { PropertyPage } from './views/PropertyPage';
import { ForgotPasswordView, ResetPasswordView, VerifyEmailView } from './views/AccountPages';
import { VerifyEmailBanner } from './components/VerifyEmailBanner';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';
import { HabifyLogo } from './components/HabifyLogo';
import { canAccessTab, fallbackTabForUser } from './utils/roles';

import { BrowseView } from './views/BrowseView';
import { RecommendationsView } from './views/RecommendationsView';
import { TenantDashboardView } from './views/TenantDashboardView';
import { LandlordDashboardView } from './views/LandlordDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { FavoritesView } from './views/FavoritesView';
import { InquiriesView } from './views/InquiriesView';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';

import { SmartMatchModal } from './components/SmartMatchModal';
import { TenantPreferencesModal } from './components/TenantPreferencesModal';
import { AffordabilityCalculatorModal } from './components/AffordabilityCalculatorModal';
import { AddEditPropertyModal } from './components/AddEditPropertyModal';
import { ViewingRequestModal } from './components/ViewingRequestModal';
import { InquiryModal } from './components/InquiryModal';
import { ReportModal } from './components/ReportModal';
import { AuthModal } from './components/AuthModal';
import { PropertyCompareModal } from './components/PropertyCompareModal';
import { HabifyChatbot } from './components/HabifyChatbot';


const AppContent: React.FC = () => {
  const { currentTab, activeModal, modalData, openModal, setCurrentTab, currentUser, addToast } = useApp();
  const location = useLocation();
  const isPropertyPage = !!matchPath(PROPERTY_ROUTE, location.pathname);

  // New page → start at the top (back/forward keeps the browser's own restoration)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  // Role-based access: bounce unauthorized users to a safe screen
  useEffect(() => {
    if (canAccessTab(currentUser, currentTab)) return;

    const next = fallbackTabForUser(currentUser, currentTab);
    setCurrentTab(next);
    if (currentUser) {
      addToast('warning', 'That area is reserved for a different account role.');
    } else if (next === 'LOGIN') {
      addToast('info', 'Please sign in to continue.');
    }
  }, [currentTab, currentUser, setCurrentTab, addToast]);

  const renderActiveView = () => {
    if (!canAccessTab(currentUser, currentTab)) {
      return <BrowseView />;
    }

    switch (currentTab) {
      case 'BROWSE':
        return <BrowseView />;
      case 'RECOMMENDATIONS':
        return <RecommendationsView />;
      case 'TENANT_DASHBOARD':
        return <TenantDashboardView />;
      case 'LANDLORD_DASHBOARD':
        return <LandlordDashboardView />;
      case 'ADMIN_DASHBOARD':
      case 'ADMIN_MAP':
        return <AdminDashboardView />;
      case 'FAVORITES':
        return <FavoritesView />;
      case 'INQUIRIES':
        return <InquiriesView />;
      case 'LOGIN':
        return <LoginView />;
      case 'SIGNUP':
        return <SignupView />;
      default:
        return <BrowseView />;
    }
  };

  const isAuthPage = !isPropertyPage && (currentTab === 'LOGIN' || currentTab === 'SIGNUP');
  const isExplore = !isPropertyPage && currentTab === 'BROWSE';

  return (
    <div className="min-h-screen flex flex-col font-sans text-ink-900 antialiased">
      <Navbar />
      <VerifyEmailBanner />

      <main
        key={location.pathname}
        className={`animate-page flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 md:pb-12 ${
          isAuthPage ? 'max-w-6xl flex items-center' : isExplore ? 'max-w-[1600px]' : 'max-w-7xl'
        }`}
      >
        <Routes>
          <Route path={PROPERTY_ROUTE} element={<PropertyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordView />} />
          <Route path="/reset-password" element={<ResetPasswordView />} />
          <Route path="/verify-email" element={<VerifyEmailView />} />
          <Route path="*" element={renderActiveView()} />
        </Routes>
      </main>


      {activeModal === 'SMART_MATCH' && modalData?.property && modalData?.matchExplanation && (
        <SmartMatchModal
          property={modalData.property}
          matchExplanation={modalData.matchExplanation}
        />
      )}

      {activeModal === 'PREFERENCES' && <TenantPreferencesModal />}
      {activeModal === 'AFFORDABILITY_CALCULATOR' && <AffordabilityCalculatorModal />}
      {activeModal === 'ADD_EDIT_PROPERTY' && <AddEditPropertyModal />}

      {activeModal === 'VIEWING_REQUEST' && modalData?.property && (
        <ViewingRequestModal property={modalData.property} />
      )}

      {activeModal === 'INQUIRY' && modalData?.property && (
        <InquiryModal property={modalData.property} />
      )}

      {activeModal === 'REPORT_PROPERTY' && modalData?.property && (
        <ReportModal property={modalData.property} />
      )}

      {activeModal === 'AUTH' && <AuthModal />}

      {activeModal === 'COMPARE_PROPERTIES' && modalData?.properties && (
        <PropertyCompareModal properties={modalData.properties} />
      )}

      <ToastContainer />
      <HabifyChatbot />

      <footer className="palette-light hidden md:block bg-ink-950 text-stone-400 topo">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
            <div className="max-w-sm space-y-5">
              <HabifyLogo size="md" theme="dark" />
              <p className="text-sm leading-relaxed text-stone-400">
                Rental homes across Rwanda, matched to your budget and the way you live — with an honest score for every one.
              </p>
              <p className="font-display text-2xl font-semibold text-white tracking-tight">
                Find where you <span className="text-saffron-400">belong.</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-8 text-sm">
              {[
                {
                  title: 'Explore',
                  links: [
                    ['Browse homes', () => setCurrentTab('BROWSE')],
                    ['Your matches', () => setCurrentTab('RECOMMENDATIONS')],
                    ['Affordability check', () => openModal('AFFORDABILITY_CALCULATOR')]
                  ]
                },
                {
                  title: 'Landlords',
                  links: [
                    ['Owner hub', () => setCurrentTab('LANDLORD_DASHBOARD')],
                    ['List a home', () => (currentUser?.role === 'LANDLORD' ? openModal('ADD_EDIT_PROPERTY') : setCurrentTab('SIGNUP'))]
                  ]
                },
                {
                  title: 'Account',
                  links: currentUser
                    ? [['Preferences', () => openModal('PREFERENCES')], ['Messages', () => setCurrentTab('INQUIRIES')]]
                    : [['Sign in', () => setCurrentTab('LOGIN')], ['Create account', () => setCurrentTab('SIGNUP')]]
                }
              ].map(col => (
                <div key={col.title}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 mb-4">{col.title}</p>
                  <ul className="space-y-2.5">
                    {col.links.map(([label, onClick]) => (
                      <li key={label as string}>
                        <button type="button" onClick={onClick as () => void} className="text-stone-300 hover:text-white transition-colors">
                          {label as string}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-14 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
            <p>© {new Date().getFullYear()} Habify · Kigali, Rwanda</p>
            <p>Made for the land of a thousand hills</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
