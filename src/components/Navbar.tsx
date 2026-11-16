import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ActiveTab } from '../types';
import { HabifyLogo } from './HabifyLogo';
import { roleDisplayName } from '../utils/roles';
import {
  Compass,
  Sparkles,
  Heart,
  MessageSquare,
  LayoutDashboard,
  SlidersHorizontal,
  Calculator,
  Plus,
  LogOut,
  ShieldCheck,
  Moon,
  Sun,
  ChevronDown,
  UserRound,
  Building2
} from 'lucide-react';

interface NavItem {
  tab: ActiveTab;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  dot?: boolean;
}

const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-10 h-10 inline-flex items-center justify-center rounded-full text-ink-600 hover:text-ink-900 hover:bg-stone-100 transition-colors ${className}`}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </button>
  );
};

const Avatar: React.FC<{ src?: string; name: string; size?: string }> = ({ src, name, size = 'w-9 h-9' }) =>
  src ? (
    <img src={src} alt="" className={`${size} rounded-full object-cover ring-2 ring-white`} referrerPolicy="no-referrer" />
  ) : (
    <span className={`${size} rounded-full bg-tea-100 text-tea-800 inline-flex items-center justify-center text-sm font-semibold`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );

export const Navbar: React.FC = () => {
  const { currentUser, favorites, viewings, inquiries, reports, currentTab, setCurrentTab, openModal, switchRole } = useApp();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const onPropertyPage = location.pathname.startsWith('/properties/');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the account menu on outside click / Escape / navigation
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const role = currentUser?.role;
  const pendingViewings =
    role === 'LANDLORD'
      ? viewings.filter(v => v.landlordId === currentUser!.id && v.status === 'PENDING').length
      : currentUser
        ? viewings.filter(v => v.tenantId === currentUser.id && (v.status === 'PENDING' || v.status === 'APPROVED')).length
        : 0;
  const unreadMessages =
    role === 'LANDLORD'
      ? inquiries.filter(i => i.landlordId === currentUser!.id && !i.isRead).length
      : currentUser
        ? inquiries.filter(i => i.tenantId === currentUser.id && Boolean(i.reply)).length
        : 0;
  const pendingReports = role === 'ADMIN' ? reports.filter(r => r.status === 'PENDING').length : 0;

  const items: NavItem[] = [
    { tab: 'BROWSE', label: 'Explore', short: 'Explore', icon: Compass },
    { tab: 'RECOMMENDATIONS', label: 'Matches', short: 'Matches', icon: Sparkles }
  ];
  if (role === 'TENANT') {
    items.push({ tab: 'TENANT_DASHBOARD', label: 'Dashboard', short: 'Home', icon: LayoutDashboard });
    items.push({ tab: 'FAVORITES', label: 'Saved', short: 'Saved', icon: Heart, badge: favorites.length });
  }
  if (role === 'LANDLORD') {
    items.push({ tab: 'LANDLORD_DASHBOARD', label: 'Owner hub', short: 'Hub', icon: Building2, badge: pendingViewings });
  }
  if (role === 'ADMIN') {
    items.push({ tab: 'ADMIN_DASHBOARD', label: 'Admin', short: 'Admin', icon: ShieldCheck, badge: pendingReports });
  }
  if (currentUser) {
    items.push({ tab: 'INQUIRIES', label: 'Messages', short: 'Inbox', icon: MessageSquare, dot: pendingViewings > 0 || unreadMessages > 0 });
  }

  const isActive = (tab: ActiveTab) =>
    !onPropertyPage && (currentTab === tab || (tab === 'ADMIN_DASHBOARD' && currentTab === 'ADMIN_MAP'));

  const menuAction = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <>
      <header
        id="main-navigation"
        className={`sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 border-b ${
          scrolled
            ? 'bg-white/85 backdrop-blur-xl border-stone-200 shadow-[0_1px_0_rgba(0,0,0,0.02)]'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">
          <button type="button" onClick={() => setCurrentTab('BROWSE')} className="shrink-0 rounded-xl" aria-label="Habify home">
            <HabifyLogo size="md" />
          </button>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main">
            {items.map(item => {
              const active = isActive(item.tab);
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => setCurrentTab(item.tab)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative h-10 px-3.5 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-colors ${
                    active ? 'bg-tea-700 text-white' : 'text-ink-700 hover:text-ink-900 hover:bg-stone-100'
                  }`}
                >
                  {item.label}
                  {!!item.badge && (
                    <span
                      className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold inline-flex items-center justify-center tabular-nums ${
                        active ? 'bg-white/20 text-white' : 'bg-saffron-100 text-saffron-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.dot && <span className="w-1.5 h-1.5 rounded-full bg-saffron-500" aria-label="New activity" />}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />

            {role === 'LANDLORD' && currentTab !== 'LANDLORD_DASHBOARD' && (
              <button type="button" onClick={() => openModal('ADD_EDIT_PROPERTY')} className="btn-primary rounded-full hidden sm:inline-flex">
                <Plus className="w-4 h-4" />
                List a home
              </button>
            )}

            {currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(o => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="h-11 pl-1 pr-2.5 rounded-full inline-flex items-center gap-2 border border-stone-200 bg-white hover:border-stone-300 transition-colors"
                >
                  <Avatar src={currentUser.avatarUrl} name={currentUser.fullName} />
                  <span className="hidden lg:block text-sm font-medium text-ink-900 max-w-[9rem] truncate">
                    {currentUser.fullName.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-stone-600 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="animate-pop absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-stone-200 p-2 origin-top-right"
                    style={{ boxShadow: 'var(--shadow-lift)' }}
                  >
                    <div className="flex items-center gap-3 px-3 py-3">
                      <Avatar src={currentUser.avatarUrl} name={currentUser.fullName} size="w-11 h-11" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900 truncate">{currentUser.fullName}</p>
                        <p className="text-xs text-stone-600 truncate">{currentUser.email}</p>
                        <span className="mt-1 inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-tea-50 text-tea-800">
                          {roleDisplayName(currentUser.role)}
                        </span>
                      </div>
                    </div>
                    <div className="h-px bg-stone-200 my-1" />
                    <MenuItem icon={role === 'TENANT' ? SlidersHorizontal : UserRound} onClick={menuAction(() => openModal('PREFERENCES'))}>
                      {role === 'TENANT' ? 'Match preferences' : 'Profile'}
                    </MenuItem>
                    {role === 'TENANT' && (
                      <MenuItem icon={Calculator} onClick={menuAction(() => openModal('AFFORDABILITY_CALCULATOR'))}>
                        Affordability check
                      </MenuItem>
                    )}
                    {role === 'LANDLORD' && (
                      <MenuItem icon={Plus} onClick={menuAction(() => openModal('ADD_EDIT_PROPERTY'))}>
                        List a home
                      </MenuItem>
                    )}
                    <div className="h-px bg-stone-200 my-1" />
                    <MenuItem icon={LogOut} onClick={menuAction(() => switchRole('GUEST'))}>
                      Sign out
                    </MenuItem>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button type="button" onClick={() => setCurrentTab('LOGIN')} className="btn-ghost rounded-full hidden sm:inline-flex">
                  Sign in
                </button>
                <button type="button" onClick={() => setCurrentTab('SIGNUP')} className="btn-primary rounded-full">
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile tab bar */}
      {!onPropertyPage && (
        <nav
          aria-label="Main"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-t border-stone-200 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 3)}, minmax(0, 1fr))` }}>
            {items.map(item => {
              const active = isActive(item.tab);
              const Icon = item.icon;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => setCurrentTab(item.tab)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                    active ? 'text-tea-700' : 'text-stone-600'
                  }`}
                >
                  <span className={`w-12 h-7 rounded-full inline-flex items-center justify-center transition-colors ${active ? 'bg-tea-100' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  {item.short}
                  {(!!item.badge || item.dot) && (
                    <span className="absolute top-2.5 right-[calc(50%-18px)] w-2 h-2 rounded-full bg-saffron-500 ring-2 ring-white" />
                  )}
                </button>
              );
            })}
            {!currentUser && (
              <button
                type="button"
                onClick={() => setCurrentTab('LOGIN')}
                className={`h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  currentTab === 'LOGIN' ? 'text-tea-700' : 'text-stone-600'
                }`}
              >
                <span className="w-12 h-7 inline-flex items-center justify-center">
                  <UserRound className="w-5 h-5" />
                </span>
                Sign in
              </button>
            )}
          </div>
        </nav>
      )}
    </>
  );
};

const MenuItem: React.FC<{ icon: React.ComponentType<{ className?: string }>; onClick: () => void; children: React.ReactNode }> = ({
  icon: Icon,
  onClick,
  children
}) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 h-11 rounded-xl text-sm text-ink-800 hover:bg-stone-100 transition-colors"
  >
    <Icon className="w-[18px] h-[18px] text-stone-600" />
    {children}
  </button>
);
