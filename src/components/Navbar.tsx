import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import { HabifyLogo } from './HabifyLogo';
import {
  Compass,
  Sparkles,
  Heart,
  MessageSquare,
  LayoutDashboard,
  SlidersHorizontal,
  Calculator,
  PlusCircle,
  LogOut,
  LogIn,
  Menu,
  X,
  ShieldAlert
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    favorites,
    viewings,
    inquiries,
    reports,
    currentTab,
    setCurrentTab,
    openModal,
    switchRole
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Computed badge counts
  const pendingViewingsCount = currentUser?.role === 'LANDLORD'
    ? viewings.filter(v => v.landlordId === currentUser.id && v.status === 'PENDING').length
    : viewings.filter(v => v.tenantId === currentUser?.id).length;

  const unreadInquiriesCount = currentUser?.role === 'LANDLORD'
    ? inquiries.filter(i => i.landlordId === currentUser.id && !i.isRead).length
    : inquiries.filter(i => i.tenantId === currentUser?.id && i.reply).length;

  const pendingReportsCount = currentUser?.role === 'ADMIN'
    ? reports.filter(r => r.status === 'PENDING').length
    : 0;

  const handleNavClick = (tab: ActiveTab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <nav id="main-navigation" className="sticky top-0 z-40 bg-white border-b border-cream-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <button
              id="brand-logo-btn"
              onClick={() => handleNavClick('BROWSE')}
              className="flex items-center focus:outline-none"
            >
              <HabifyLogo size="md" showTagline={false} />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <button
              id="nav-browse-btn"
              onClick={() => handleNavClick('BROWSE')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentTab === 'BROWSE'
                  ? 'text-navy-900 bg-navy-100'
                  : 'text-cream-600 hover:text-navy-900 hover:bg-cream-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore
            </button>

            <button
              id="nav-recommendations-btn"
              onClick={() => handleNavClick('RECOMMENDATIONS')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentTab === 'RECOMMENDATIONS'
                  ? 'text-navy-900 bg-navy-100'
                  : 'text-cream-600 hover:text-navy-900 hover:bg-cream-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Smart Matches
            </button>

            {currentUser?.role === 'TENANT' && (
              <>
                <button
                  id="nav-tenant-dashboard-btn"
                  onClick={() => handleNavClick('TENANT_DASHBOARD')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    currentTab === 'TENANT_DASHBOARD'
                      ? 'text-navy-900 bg-navy-100'
                      : 'text-cream-600 hover:text-navy-900 hover:bg-cream-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>

                <button
                  id="nav-favorites-btn"
                  onClick={() => handleNavClick('FAVORITES')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 relative ${
                    currentTab === 'FAVORITES'
                      ? 'text-navy-900 bg-navy-100'
                      : 'text-cream-600 hover:text-navy-900 hover:bg-cream-100'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  Saved
                  {favorites.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-terra-600 rounded-full">
                      {favorites.length}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* Landlord Hub */}
            <button
              id="nav-landlord-dashboard-btn"
              onClick={() => {
                if (currentUser?.role !== 'LANDLORD') {
                  switchRole('LANDLORD');
                } else {
                  handleNavClick('LANDLORD_DASHBOARD');
                }
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentTab === 'LANDLORD_DASHBOARD'
                  ? 'text-white bg-navy-900'
                  : 'text-cream-600 hover:text-navy-900 hover:bg-cream-100'
              }`}
              title="Access Landlord Hub - Manage properties, rent collection, viewing requests, and leases"
            >
              <LayoutDashboard className="w-4 h-4" />
              Landlord Hub
              {pendingViewingsCount > 0 && currentUser?.role === 'LANDLORD' && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-navy-900 bg-white rounded-full">
                  {pendingViewingsCount}
                </span>
              )}
            </button>

            {currentUser?.role === 'ADMIN' && (
              <button
                id="nav-admin-dashboard-btn"
                onClick={() => handleNavClick('ADMIN_DASHBOARD')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentTab === 'ADMIN_DASHBOARD'
                    ? 'text-white bg-navy-900'
                    : 'text-cream-600 hover:text-navy-900 hover:bg-cream-100'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                Admin
                {pendingReportsCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-navy-900 bg-white rounded-full">
                    {pendingReportsCount}
                  </span>
                )}
              </button>
            )}

            {/* Inquiries & Viewings */}
            {currentUser && (
              <button
                id="nav-inquiries-btn"
                onClick={() => handleNavClick('INQUIRIES')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 relative ${
                  currentTab === 'INQUIRIES'
                    ? 'text-navy-900 bg-navy-100'
                    : 'text-cream-600 hover:text-navy-900 hover:bg-cream-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Messages
                {(pendingViewingsCount > 0 || unreadInquiriesCount > 0) && (
                  <span className="w-2 h-2 rounded-full bg-terra-600" />
                )}
              </button>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="hidden sm:flex items-center gap-2">
            {currentUser?.role !== 'ADMIN' && (
              <>
                <button
                  id="open-preferences-tool-btn"
                  onClick={() => openModal('PREFERENCES')}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-cream-600 bg-cream-100 hover:bg-cream-200 transition-colors flex items-center gap-1.5"
                  title="Edit Tenant Matching Preferences"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Criteria</span>
                </button>

                <button
                  id="open-affordability-tool-btn"
                  onClick={() => openModal('AFFORDABILITY_CALCULATOR')}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-cream-600 bg-cream-100 hover:bg-cream-200 transition-colors flex items-center gap-1.5"
                  title="Calculate Rent Affordability"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Affordability</span>
                </button>
              </>
            )}

            {currentUser?.role === 'LANDLORD' && (
              <button
                id="navbar-add-property-btn"
                onClick={() => openModal('ADD_EDIT_PROPERTY')}
                className="btn-primary px-3 py-2 text-xs font-semibold flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Property</span>
              </button>
            )}

            {/* User Profile or Sign In */}
            {currentUser ? (
              <div className="flex items-center gap-3 pl-3 border-l border-cream-200">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={currentUser.fullName}
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <div className="hidden xl:block">
                  <div className="text-xs font-semibold text-navy-900 leading-tight">
                    {currentUser.fullName.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-cream-600">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  id="user-logout-btn"
                  onClick={() => switchRole('GUEST')}
                  className="p-1.5 text-cream-500 hover:text-terra-600 hover:bg-terra-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-3 border-l border-cream-200">
                <button
                  id="guest-login-btn"
                  type="button"
                  onClick={() => handleNavClick('LOGIN')}
                  className={`btn-ghost px-3 py-2 text-xs font-semibold flex items-center gap-1.5 ${
                    currentTab === 'LOGIN' ? 'bg-cream-100 text-navy-900' : ''
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in</span>
                </button>
                <button
                  id="guest-signup-btn"
                  type="button"
                  onClick={() => handleNavClick('SIGNUP')}
                  className="btn-primary px-3.5 py-2 text-xs font-semibold"
                >
                  Get started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-cream-600 hover:bg-cream-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-cream-50 border-t border-cream-200 px-4 py-3 space-y-2">
          <button
            onClick={() => handleNavClick('BROWSE')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-navy-900 hover:bg-cream-100 font-medium transition-colors"
          >
            <Compass className="w-4 h-4" />
            Explore Properties
          </button>
          
          <button
            onClick={() => handleNavClick('RECOMMENDATIONS')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-navy-900 hover:bg-cream-100 font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Smart Recommendations
          </button>

          {currentUser?.role === 'TENANT' && (
            <>
              <button
                onClick={() => handleNavClick('TENANT_DASHBOARD')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-navy-900 hover:bg-cream-100 font-medium transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                My Dashboard
              </button>

              <button
                onClick={() => handleNavClick('FAVORITES')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-navy-900 hover:bg-cream-100 font-medium transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4" />
                  <span>Saved Properties</span>
                </div>
                {favorites.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-terra-600 rounded-full">
                    {favorites.length}
                  </span>
                )}
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (currentUser?.role !== 'LANDLORD') {
                switchRole('LANDLORD');
              } else {
                handleNavClick('LANDLORD_DASHBOARD');
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-navy-900 hover:bg-cream-100 font-medium transition-colors"
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>Landlord Hub</span>
            </div>
            {pendingViewingsCount > 0 && currentUser?.role === 'LANDLORD' && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-terra-600 rounded-full">
                {pendingViewingsCount}
              </span>
            )}
          </button>

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => handleNavClick('ADMIN_DASHBOARD')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-navy-900 hover:bg-cream-100 font-medium transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
          )}

          {currentUser && (
            <button
              onClick={() => handleNavClick('INQUIRIES')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-navy-900 hover:bg-cream-100 font-medium transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </button>
          )}

          <div className="pt-2 border-t border-cream-300 grid grid-cols-2 gap-2">
            <button
              onClick={() => { openModal('PREFERENCES'); setMobileMenuOpen(false); }}
              className="py-2 px-3 text-xs bg-cream-100 text-navy-900 font-medium rounded-lg hover:bg-cream-200 transition-colors"
            >
              Match Criteria
            </button>
            <button
              onClick={() => { openModal('AFFORDABILITY_CALCULATOR'); setMobileMenuOpen(false); }}
              className="py-2 px-3 text-xs bg-cream-100 text-navy-900 font-medium rounded-lg hover:bg-cream-200 transition-colors"
            >
              Affordability
            </button>
          </div>

          {currentUser ? (
            <button
              onClick={() => switchRole('GUEST')}
              className="w-full py-2 px-3 text-xs font-semibold text-terra-700 bg-terra-50 rounded-lg hover:bg-terra-100 transition-colors border border-terra-200"
            >
              Sign Out
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleNavClick('LOGIN')}
                className="w-full btn-secondary text-xs font-semibold rounded-lg py-2"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('SIGNUP')}
                className="w-full btn-primary text-xs font-semibold rounded-lg py-2"
              >
                Get started
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
