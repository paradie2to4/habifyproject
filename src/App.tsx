import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';
import { HabifyLogo } from './components/HabifyLogo';

import { BrowseView } from './views/BrowseView';
import { RecommendationsView } from './views/RecommendationsView';
import { TenantDashboardView } from './views/TenantDashboardView';
import { LandlordDashboardView } from './views/LandlordDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { FavoritesView } from './views/FavoritesView';
import { InquiriesView } from './views/InquiriesView';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';

import { PropertyDetailsModal } from './components/PropertyDetailsModal';
import { SmartMatchModal } from './components/SmartMatchModal';
import { TenantPreferencesModal } from './components/TenantPreferencesModal';
import { AffordabilityCalculatorModal } from './components/AffordabilityCalculatorModal';
import { AddEditPropertyModal } from './components/AddEditPropertyModal';
import { ViewingRequestModal } from './components/ViewingRequestModal';
import { InquiryModal } from './components/InquiryModal';
import { ReportModal } from './components/ReportModal';
import { AuthModal } from './components/AuthModal';
import { PropertyCompareModal } from './components/PropertyCompareModal';

import { Calculator } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentTab, activeModal, modalData, openModal, setCurrentTab } = useApp();

  const renderActiveView = () => {
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

  const isAuthPage = currentTab === 'LOGIN' || currentTab === 'SIGNUP';

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col font-sans text-navy-900 antialiased">
      <Navbar />

      <main
        className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${
          isAuthPage ? 'max-w-5xl flex items-center' : 'max-w-7xl'
        }`}
      >
        {renderActiveView()}
      </main>

      {activeModal === 'PROPERTY_DETAILS' && modalData?.property && (
        <PropertyDetailsModal property={modalData.property} />
      )}

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

      <footer className="bg-navy-950 text-cream-200 border-t border-navy-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 pb-10 border-b border-navy-800">
            <div className="max-w-sm space-y-4">
              <HabifyLogo size="md" theme="dark" showTagline />
              <p className="text-sm text-cream-400 leading-relaxed">
                An intelligent property discovery platform helping people across Rwanda find homes that fit their lives.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cream-500 mb-3">Explore</p>
                <ul className="space-y-2">
                  <li>
                    <button type="button" onClick={() => setCurrentTab('BROWSE')} className="text-cream-300 hover:text-white">
                      Properties
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setCurrentTab('RECOMMENDATIONS')} className="text-cream-300 hover:text-white">
                      Recommendations
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setCurrentTab('LOGIN')} className="text-cream-300 hover:text-white">
                      Sign in
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setCurrentTab('SIGNUP')} className="text-cream-300 hover:text-white">
                      Get started
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cream-500 mb-3">Landlords</p>
                <ul className="space-y-2">
                  <li>
                    <button type="button" onClick={() => setCurrentTab('LANDLORD_DASHBOARD')} className="text-cream-300 hover:text-white">
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => openModal('ADD_EDIT_PROPERTY')} className="text-cream-300 hover:text-white">
                      List a property
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cream-500 mb-3">Tools</p>
                <ul className="space-y-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => openModal('AFFORDABILITY_CALCULATOR')}
                      className="text-cream-300 hover:text-white inline-flex items-center gap-1.5"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      Affordability
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => openModal('PREFERENCES')}
                      className="text-cream-300 hover:text-white"
                    >
                      Preferences
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream-500">
            <p>© {new Date().getFullYear()} Habify · Kigali, Rwanda</p>
            <p>Find Where You Belong.</p>
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
