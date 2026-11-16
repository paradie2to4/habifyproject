import { ActiveTab } from './types';

/** URL for every top-level screen. Screens are still addressed as tabs inside the app. */
export const TAB_PATHS: Record<ActiveTab, string> = {
  BROWSE: '/',
  RECOMMENDATIONS: '/matches',
  TENANT_DASHBOARD: '/dashboard',
  LANDLORD_DASHBOARD: '/landlord',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_MAP: '/admin/map',
  FAVORITES: '/saved',
  INQUIRIES: '/messages',
  LOGIN: '/login',
  SIGNUP: '/signup'
};

const PATH_TO_TAB = new Map<string, ActiveTab>(
  Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as ActiveTab])
);

export function tabForPath(pathname: string): ActiveTab {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return PATH_TO_TAB.get(clean) ?? 'BROWSE';
}

export const propertyPath = (id: string) => `/properties/${encodeURIComponent(id)}`;

export const PROPERTY_ROUTE = '/properties/:id';
