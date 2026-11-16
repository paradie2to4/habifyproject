import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { SEED_USERS } from '../data/seedData';
import { KigaliAdminMap } from '../components/KigaliAdminMap';
import { EmptyState } from '../components/EmptyState';
import { DashboardHero, todayLabel } from '../components/DashboardHero';
import { roleDisplayName } from '../utils/roles';
import {
  Users,
  Flag,
  CheckCircle2,
  Trash2,
  MapPin,
  Search,
  Building2,
  Gauge
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const {
    currentUser,
    properties,
    reports,
    updateReportStatus,
    deleteProperty,
    getListingQuality,
    allUsers,
    setCurrentTab
  } = useApp();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'MAP' | 'MODERATION' | 'USERS'>('MAP');
  const [userQuery, setUserQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ reportId: string; propertyId: string; title: string } | null>(null);

  const activeReports = reports.filter(r => r.status === 'PENDING');
  const avgQuality = properties.length > 0
    ? Math.round(properties.reduce((acc, p) => acc + getListingQuality(p).score, 0) / properties.length)
    : 0;

  const directory = allUsers.length > 0 ? allUsers : SEED_USERS;

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return directory;
    return directory.filter(
      u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [userQuery, directory]);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <EmptyState
        title="Admin area"
        description="Sign in with an administrator account to view platform coverage, reports, and users."
        actionLabel="Sign in"
        onAction={() => setCurrentTab('LOGIN')}
      />
    );
  }

  const tabs = [
    { id: 'MAP' as const, label: 'Coverage', icon: MapPin },
    { id: 'MODERATION' as const, label: 'Reports', icon: Flag, count: activeReports.length },
    { id: 'USERS' as const, label: 'Users', icon: Users }
  ];

  return (
    <div id="admin-dashboard-container" className="space-y-8 text-left">
      <DashboardHero
        eyebrow={`Administration · ${todayLabel()}`}
        title="Platform overview"
        subtitle="Listings, reports and accounts across the whole system."
        stats={[
          { label: 'Listings', value: properties.length, hint: `${properties.filter(p => p.isAvailable).length} available`, icon: Building2, onClick: () => setActiveAdminSubTab('MAP') },
          {
            label: 'Open reports',
            value: activeReports.length,
            hint: activeReports.length ? 'Need moderation' : 'Queue is clear',
            icon: Flag,
            attention: activeReports.length > 0,
            onClick: () => setActiveAdminSubTab('MODERATION')
          },
          { label: 'Accounts', value: directory.length, hint: `${directory.filter(u => u.role === 'LANDLORD').length} landlords`, icon: Users, onClick: () => setActiveAdminSubTab('USERS') },
          { label: 'Avg. listing quality', value: `${avgQuality}%`, hint: 'Across all listings', icon: Gauge }
        ]}
      />

      <div className="flex items-center gap-1 border-b border-stone-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeAdminSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveAdminSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-tea-700 text-ink-900'
                  : 'border-transparent text-stone-600 hover:text-ink-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count ? (
                <span className="text-xs text-tea-700">{tab.count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeAdminSubTab === 'MAP' && <KigaliAdminMap />}

      {activeAdminSubTab === 'MODERATION' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-section">Moderation queue</h2>
            <p className="text-sm text-stone-600 mt-1">Review reports before removing a listing.</p>
          </div>

          {activeReports.length > 0 ? (
            <div className="overflow-x-auto border border-stone-200 rounded-xl bg-white">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase tracking-wide text-stone-600 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Listing</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium">Reporter</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {activeReports.map(rep => (
                    <tr key={rep.id} className="align-top">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-900">{rep.propertyTitle}</div>
                        <p className="text-xs text-stone-600 mt-0.5 max-w-xs">{rep.details}</p>
                      </td>
                      <td className="px-4 py-3 text-stone-700">{rep.reason.replace(/_/g, ' ').toLowerCase()}</td>
                      <td className="px-4 py-3">{rep.reporterName}</td>
                      <td className="px-4 py-3 text-stone-600">{new Date(rep.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => updateReportStatus(rep.id, 'DISMISSED')}
                            className="btn-ghost text-xs py-1.5"
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDelete({
                                reportId: rep.id,
                                propertyId: rep.propertyId,
                                title: rep.propertyTitle
                              })
                            }
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-saffron-800 bg-saffron-50 hover:bg-saffron-100"
                          >
                            Remove listing
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="w-5 h-5 text-tea-700" />}
              title="Nothing to review."
              description="There are no open reports right now."
            />
          )}
        </div>
      )}

      {activeAdminSubTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-section">User registry</h2>
              <p className="text-sm text-stone-600 mt-1">Accounts and roles on the platform.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="search"
                value={userQuery}
                onChange={e => setUserQuery(e.target.value)}
                placeholder="Search users"
                className="input-base w-full pl-9 py-2"
                aria-label="Search users"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-xl bg-white">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase tracking-wide text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-semibold text-ink-900">{u.fullName}</div>
                          <div className="text-xs text-stone-600">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{roleDisplayName(u.role)}</td>
                    <td className="px-4 py-3 text-stone-700">{u.phoneNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-tea-800 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-tea-600" />
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <EmptyState title="No matching users." description="Try a different name, email, or role." />
          )}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[3px]">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-stone-200">
            <h3 className="font-display text-xl font-semibold text-ink-900">Remove this listing?</h3>
            <p className="text-sm text-stone-700 mt-2">
              “{confirmDelete.title}” will be taken down and the report will be marked resolved. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProperty(confirmDelete.propertyId);
                  updateReportStatus(confirmDelete.reportId, 'RESOLVED');
                  setConfirmDelete(null);
                }}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-tea-800 hover:bg-tea-900"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" />
                  Remove listing
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
