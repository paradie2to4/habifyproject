import { ActiveTab, Role, User } from '../types';

/** Inclusive label for the property-owner role (landlord or landlady). */
export function ownerRoleLabel(short = false): string {
  return short ? 'Owner' : 'Landlord / Landlady';
}

export function roleDisplayName(role: Role | undefined | null): string {
  if (role === 'LANDLORD') return ownerRoleLabel();
  if (role === 'ADMIN') return 'Admin';
  if (role === 'TENANT') return 'Tenant';
  return 'Guest';
}

export function dashboardForRole(role: Role): ActiveTab {
  if (role === 'LANDLORD') return 'LANDLORD_DASHBOARD';
  if (role === 'ADMIN') return 'ADMIN_DASHBOARD';
  return 'TENANT_DASHBOARD';
}

/** Tabs any signed-in user (or guest) may open. */
const PUBLIC_TABS: ActiveTab[] = ['BROWSE', 'RECOMMENDATIONS', 'LOGIN', 'SIGNUP'];

const TENANT_TABS: ActiveTab[] = [
  ...PUBLIC_TABS,
  'TENANT_DASHBOARD',
  'FAVORITES',
  'INQUIRIES'
];

const LANDLORD_TABS: ActiveTab[] = [
  ...PUBLIC_TABS,
  'LANDLORD_DASHBOARD',
  'INQUIRIES'
];

const ADMIN_TABS: ActiveTab[] = [
  ...PUBLIC_TABS,
  'ADMIN_DASHBOARD',
  'ADMIN_MAP',
  'INQUIRIES'
];

export function canAccessTab(user: User | null | undefined, tab: ActiveTab): boolean {
  if (PUBLIC_TABS.includes(tab)) return true;
  if (!user) return false;
  if (user.role === 'TENANT') return TENANT_TABS.includes(tab);
  if (user.role === 'LANDLORD') return LANDLORD_TABS.includes(tab);
  if (user.role === 'ADMIN') return ADMIN_TABS.includes(tab);
  return false;
}

/** Safe destination when the current tab is forbidden for this user. */
export function fallbackTabForUser(
  user: User | null | undefined,
  attemptedTab?: ActiveTab
): ActiveTab {
  if (!user) {
    const needsAuth =
      attemptedTab &&
      !PUBLIC_TABS.includes(attemptedTab);
    return needsAuth ? 'LOGIN' : 'BROWSE';
  }
  return dashboardForRole(user.role);
}
