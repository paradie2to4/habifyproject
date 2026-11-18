import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Property, ViewingRequest, Inquiry, LeaseAgreement, RentPayment, MaintenanceTicket } from '../types';
import { PropertyImage } from '../components/PropertyImage';
import { DashboardHero, greetingFor, heroGhostBtn, heroPrimaryBtn, todayLabel } from '../components/DashboardHero';
import {
  Building,
  Building2,
  Plus,
  Calendar,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CreditCard,
  Wrench,
  TrendingUp,
  Phone,
  Mail,
  Send,
  Download,
  Share2,
  Check,
  Search,
  Filter,
  DollarSign,
  Receipt,
  FileText,
  UserCheck,
  ShieldCheck,
  Flame,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sliders,
  CheckSquare
} from 'lucide-react';

/** "2026-11" → "November 2026" */
const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

type LandlordTab = 'PROPERTIES' | 'VIEWINGS' | 'INQUIRIES' | 'LEASES_PAYMENTS' | 'MAINTENANCE' | 'YIELD_CALCULATOR';

export const LandlordDashboardView: React.FC = () => {
  const {
    currentUser,
    properties,
    viewings,
    viewingRequests,
    inquiries,
    leases,
    payments,
    maintenanceTickets,
    addLease,
    updateLeaseStatus,
    recordPayment,
    addMaintenanceTicket,
    updateMaintenanceTicket,
    updateViewingStatus,
    togglePropertyAvailability,
    deleteProperty,
    openModal,
    getListingQuality,
    sendInquiry,
    replyInquiry,
    isLive,
    confirmPayment,
    addToast,
    setCurrentTab
  } = useApp();

  // Active sub-tab in Landlord Hub
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<LandlordTab>('PROPERTIES');

  // Deep links from notifications and emails: /landlord?tab=viewings
  React.useEffect(() => {
    const map: Record<string, LandlordTab> = {
      properties: 'PROPERTIES',
      viewings: 'VIEWINGS',
      inquiries: 'INQUIRIES',
      leases: 'LEASES_PAYMENTS',
      maintenance: 'MAINTENANCE'
    };
    const tab = map[(searchParams.get('tab') || '').toLowerCase()];
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Properties Filter & Search inside Hub
  const [propSearch, setPropSearch] = useState('');
  const [propStatusFilter, setPropStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'RENTED'>('ALL');

  // Viewings Filter
  const [viewingStatusFilter, setViewingStatusFilter] = useState<string>('ALL');

  // Inquiries Reply State
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>('');
  const [replyText, setReplyText] = useState('');

  // Record Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLeaseForPayment, setSelectedLeaseForPayment] = useState<LeaseAgreement | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(400000);
  const [paymentMethod, setPaymentMethod] = useState<'MTN_MOMO' | 'AIRTEL_MONEY' | 'BK_TRANSFER' | 'IM_BANK' | 'CASH'>('MTN_MOMO');
  const [paymentMonth, setPaymentMonth] = useState(() => new Date().toISOString().slice(0, 7)); // yyyy-MM
  const [paymentNotes, setPaymentNotes] = useState('');

  // Active Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<RentPayment | null>(null);

  // New Maintenance Ticket Modal State
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintPropId, setMaintPropId] = useState<string>('');
  const [maintTitle, setMaintTitle] = useState('');
  const [maintCategory, setMaintCategory] = useState<MaintenanceTicket['category']>('PLUMBING');
  const [maintPriority, setMaintPriority] = useState<MaintenanceTicket['priority']>('MEDIUM');
  const [maintEstCost, setMaintEstCost] = useState<number>(35000);
  const [maintDesc, setMaintDesc] = useState('');
  const [maintContractor, setMaintContractor] = useState('');

  // New Lease Modal State
  const [showNewLeaseModal, setShowNewLeaseModal] = useState(false);
  const [newLeasePropId, setNewLeasePropId] = useState('');
  const [newLeaseTenantName, setNewLeaseTenantName] = useState('');
  const [newLeaseTenantPhone, setNewLeaseTenantPhone] = useState('+250 788 ');
  const [newLeaseTenantEmail, setNewLeaseTenantEmail] = useState('');
  const [newLeaseRent, setNewLeaseRent] = useState<number>(400000);
  const [newLeaseStart, setNewLeaseStart] = useState('2026-09-01');
  const [newLeaseEnd, setNewLeaseEnd] = useState('2027-08-31');

  // ROI / Yield Calculator State
  const [calcPropValue, setCalcPropValue] = useState<number>(65000000); // 65M RWF
  const [calcMonthlyRent, setCalcMonthlyRent] = useState<number>(600000); // 600k RWF
  const [calcAnnualExpenses, setCalcAnnualExpenses] = useState<number>(720000); // Maintenance + property tax

  // Data scoped to this landlord / landlady only
  const rawViewings = viewings || viewingRequests || [];
  const myProperties = properties.filter(p => p.landlordId === currentUser?.id);

  const myViewings = rawViewings.filter(v => v.landlordId === currentUser?.id);

  const myInquiries = inquiries.filter(i => i.landlordId === currentUser?.id);

  const myLeases = leases.filter(l => l.landlordId === currentUser?.id);

  const myPayments = payments.filter(p => myLeases.some(l => l.id === p.leaseId));

  const myMaintenance = maintenanceTickets.filter(m =>
    myProperties.some(p => p.id === m.propertyId)
  );

  const thisMonth = new Date().toISOString().slice(0, 7);

  // Computed Portfolio Stats
  const totalMonthlyPotential = myProperties.reduce((acc, p) => acc + p.monthlyRent, 0);
  const availableCount = myProperties.filter(p => p.isAvailable).length;
  const rentedCount = myProperties.filter(p => !p.isAvailable).length;
  const occupancyRate = myProperties.length > 0 ? Math.round((rentedCount / myProperties.length) * 100) : 0;

  const totalCollectedThisMonth = myPayments
    .filter(p => p.status !== 'PENDING' && (p.period ? p.period === thisMonth : p.paidForMonth === monthLabel(thisMonth)))
    .reduce((acc, p) => acc + p.amountRwf, 0);

  const avgQualityScore = myProperties.length > 0
    ? Math.round(
        myProperties.reduce((acc, p) => acc + getListingQuality(p).score, 0) / myProperties.length
      )
    : 0;

  const pendingViewingsCount = myViewings.filter(v => v.status === 'PENDING').length;
  const unreadInquiriesCount = myInquiries.filter(i => !i.isRead).length;

  // Filtered Properties for Display
  const filteredProperties = myProperties.filter(p => {
    if (propStatusFilter === 'AVAILABLE' && !p.isAvailable) return false;
    if (propStatusFilter === 'RENTED' && p.isAvailable) return false;
    if (propSearch.trim()) {
      const q = propSearch.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.locationSector.toLowerCase().includes(q) ||
        (p.district || '').toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Viewings
  const filteredViewings = myViewings.filter(v => {
    if (viewingStatusFilter === 'ALL') return true;
    return v.status === viewingStatusFilter;
  });

  // Handle Recording Rent Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaseForPayment) return;

    const newPayment = await recordPayment({
      leaseId: selectedLeaseForPayment.id,
      propertyId: selectedLeaseForPayment.propertyId,
      propertyTitle: selectedLeaseForPayment.propertyTitle,
      tenantName: selectedLeaseForPayment.tenantName,
      landlordName: currentUser?.fullName || 'Jean-Paul Habimana',
      amountRwf: paymentAmount,
      paymentMethod,
      transactionReference: `${paymentMethod}-${Math.floor(100000 + Math.random() * 900000)}`,
      paidForMonth: monthLabel(paymentMonth),
      period: paymentMonth,
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: paymentNotes || `Rent payment for ${monthLabel(paymentMonth)}`
    });
    if (!newPayment) return;

    setShowPaymentModal(false);
    setActiveReceipt(newPayment);
  };

  // Handle Adding Maintenance Ticket
  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find(p => p.id === maintPropId) || myProperties[0];
    if (!prop) return;

    const ok = await addMaintenanceTicket({
      propertyId: prop.id,
      propertyTitle: prop.title,
      propertySector: prop.locationSector,
      tenantName: myLeases.find(l => l.propertyId === prop.id)?.tenantName || 'Current Occupant',
      category: maintCategory,
      title: maintTitle,
      description: maintDesc,
      priority: maintPriority,
      estimatedCostRwf: maintEstCost,
      contractorName: maintContractor || 'Local Contractor'
    });
    if (!ok) return;

    setShowMaintenanceModal(false);
    setMaintTitle('');
    setMaintDesc('');
    setMaintContractor('');
  };

  // Handle Creating Lease Agreement
  const handleSaveNewLease = async (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find(p => p.id === newLeasePropId) || myProperties[0];
    if (!prop) return;

    const ok = await addLease({
      propertyId: prop.id,
      propertyTitle: prop.title,
      propertyAddress: prop.address,
      propertySector: prop.locationSector,
      tenantId: '',
      tenantName: newLeaseTenantName,
      tenantPhone: newLeaseTenantPhone,
      tenantEmail: newLeaseTenantEmail.trim(),
      landlordId: currentUser?.id || 'usr-landlord-01',
      monthlyRent: newLeaseRent,
      securityDeposit: newLeaseRent,
      startDate: newLeaseStart,
      endDate: newLeaseEnd,
      paymentDueDay: 5,
      status: 'ACTIVE',
      paymentStatus: 'DUE'
    });
    if (!ok) return;

    // The API marks the home as rented itself; demo mode needs it done here
    if (!isLive && prop.isAvailable) {
      togglePropertyAvailability(prop.id);
    }

    setShowNewLeaseModal(false);
    setNewLeaseTenantName('');
    setNewLeaseTenantPhone('+250 788 ');
    setNewLeaseTenantEmail('');
  };

  // Handle Quick Canned Reply
  const handleSendInquiryReply = (inqId: string) => {
    if (!replyText.trim()) return;
    replyInquiry(inqId, replyText);
    setReplyText('');
  };

  // Download Portfolio Summary CSV
  const handleExportPortfolioCSV = () => {
    const headers = 'ID,Title,Location,Type,Rent (RWF),Status,Quality Score\n';
    const rows = myProperties
      .map(
        p =>
          `"${p.id}","${p.title.replace(/"/g, '""')}","${p.locationSector}","${p.propertyType}",${p.monthlyRent},"${p.isAvailable ? 'Available' : 'Rented'}",${getListingQuality(p).score}%`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rwanda_Rental_Portfolio_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Downloaded Rwanda Property Portfolio (CSV)');
  };

  // ROI Calculations
  const grossAnnualRent = calcMonthlyRent * 12;
  const netAnnualRent = grossAnnualRent - calcAnnualExpenses;
  const grossRentalYield = calcPropValue > 0 ? ((grossAnnualRent / calcPropValue) * 100).toFixed(2) : '0';
  const netRentalYield = calcPropValue > 0 ? ((netAnnualRent / calcPropValue) * 100).toFixed(2) : '0';
  const paybackYears = netAnnualRent > 0 ? (calcPropValue / netAnnualRent).toFixed(1) : 'N/A';
  const firstName = (currentUser?.fullName || 'there').split(' ')[0];

  if (!currentUser || currentUser.role !== 'LANDLORD') {
    return (
      <div className="bg-white rounded-xl border border-stone-200 px-6 py-14 text-center">
        <h3 className="font-display text-xl font-semibold text-ink-900">Owner dashboard</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">
          Sign in as a landlord or landlady to manage your listings, rent, and viewing requests.
        </p>
        <button type="button" onClick={() => setCurrentTab('LOGIN')} className="btn-primary mt-6">
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div id="landlord-hub-container" className="space-y-8 text-left pb-16">
      
      <DashboardHero
        eyebrow={todayLabel()}
        title={<>{greetingFor()}, {firstName}</>}
        subtitle="Your listings, rent, viewings and leases in one place."
        actions={
          <>
            <button id="landlord-publish-new-btn" type="button" onClick={() => openModal('ADD_EDIT_PROPERTY')} className={heroPrimaryBtn}>
              <Plus className="w-4 h-4" />
              List a property
            </button>
            <button
              id="landlord-record-payment-btn"
              type="button"
              onClick={() => {
                if (myLeases.length > 0) {
                  setSelectedLeaseForPayment(myLeases[0]);
                  setPaymentAmount(myLeases[0].monthlyRent);
                }
                setShowPaymentModal(true);
              }}
              className={heroGhostBtn}
            >
              <DollarSign className="w-4 h-4" />
              Record rent
            </button>
            <button
              type="button"
              onClick={handleExportPortfolioCSV}
              className={`${heroGhostBtn} w-11 px-0`}
              title="Download portfolio CSV"
              aria-label="Download portfolio CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </>
        }
        stats={[
          {
            label: 'Active listings',
            value: availableCount,
            hint: `${rentedCount} occupied · ${occupancyRate}% occupancy`,
            icon: Building2,
            onClick: () => setActiveTab('PROPERTIES')
          },
          {
            label: 'Viewing requests',
            value: myViewings.length,
            hint: pendingViewingsCount > 0 ? `${pendingViewingsCount} waiting for you` : 'All caught up',
            icon: Calendar,
            attention: pendingViewingsCount > 0,
            onClick: () => setActiveTab('VIEWINGS')
          },
          {
            label: 'Inquiries',
            value: myInquiries.length,
            hint: unreadInquiriesCount > 0 ? `${unreadInquiriesCount} unread` : 'No unread messages',
            icon: MessageSquare,
            attention: unreadInquiriesCount > 0,
            onClick: () => setActiveTab('INQUIRIES')
          },
          {
            label: 'Listing quality',
            value: `${avgQualityScore}%`,
            hint: `${(totalMonthlyPotential / 1000000).toFixed(1)}M RWF potential / month`,
            icon: TrendingUp
          }
        ]}
      />

      <div className="flex items-center gap-1 overflow-x-auto border-b border-stone-200">
        {([
          { id: 'PROPERTIES' as const, label: `Properties (${myProperties.length})`, icon: Building2 },
          { id: 'VIEWINGS' as const, label: 'Viewings', icon: Calendar, count: pendingViewingsCount },
          { id: 'INQUIRIES' as const, label: 'Inquiries', icon: MessageSquare, count: unreadInquiriesCount },
          { id: 'LEASES_PAYMENTS' as const, label: `Rent & leases (${myLeases.length})`, icon: Receipt },
          { id: 'MAINTENANCE' as const, label: `Maintenance (${myMaintenance.length})`, icon: Wrench },
          { id: 'YIELD_CALCULATOR' as const, label: 'Yield & ROI', icon: TrendingUp }
        ]).map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-tea-700 text-ink-900'
                  : 'border-transparent text-stone-600 hover:text-ink-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count ? <span className="text-xs text-tea-700">{tab.count}</span> : null}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROPERTIES INVENTORY */}
      {/* ========================================================================= */}
      {activeTab === 'PROPERTIES' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-lg p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
              <input
                type="text"
                placeholder="Search properties by title, sector, district..."
                value={propSearch}
                onChange={e => setPropSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-tea-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setPropStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  propStatusFilter === 'ALL'
                    ? 'bg-tea-700 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                All ({myProperties.length})
              </button>
              <button
                onClick={() => setPropStatusFilter('AVAILABLE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  propStatusFilter === 'AVAILABLE'
                    ? 'bg-tea-700 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Available ({availableCount})
              </button>
              <button
                onClick={() => setPropStatusFilter('RENTED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  propStatusFilter === 'RENTED'
                    ? 'bg-tea-700 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Rented / Occupied ({rentedCount})
              </button>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProperties.map(prop => {
              const quality = getListingQuality(prop);

              return (
                <div
                  key={prop.id}
                  className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs hover:border-tea-300 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <PropertyImage
                        images={prop.images}
                        seedKey={prop.id}
                        alt={prop.title}
                        className="w-20 h-20 rounded-lg object-cover shadow-xs flex-shrink-0"
                      />
                      <div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-100 text-ink-700">
                          {prop.propertyType}
                        </span>
                        <h3 className="text-sm font-bold text-ink-900 mt-1 line-clamp-1">
                          {prop.title}
                        </h3>
                        <p className="text-xs text-stone-600 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-ink-700 flex-shrink-0" />
                          {prop.locationSector}, {prop.district ? `${prop.district} District` : 'Kigali'}
                        </p>
                        <p className="text-sm font-bold text-ink-900 mt-1 font-mono">
                          {prop.monthlyRent.toLocaleString()} <span className="text-xs text-stone-500 font-normal">RWF/month</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        prop.isAvailable
                          ? 'bg-tea-100 text-tea-800 border border-tea-300'
                          : 'bg-tea-100 text-ink-800 border border-ink-200'
                      }`}
                    >
                      {prop.isAvailable ? 'Available' : 'Occupied'}
                    </span>
                  </div>

                  {/* Listing performance */}
                  <div className="grid grid-cols-3 gap-3 text-center border border-stone-200 rounded-lg p-3">
                    <div>
                      <div className="text-sm font-semibold text-ink-900">{prop.viewsCount}</div>
                      <div className="text-[10px] text-stone-600 uppercase tracking-wide">Views</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-900">{prop.inquiriesCount}</div>
                      <div className="text-[10px] text-stone-600 uppercase tracking-wide">Inquiries</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-900">{quality.score}%</div>
                      <div className="text-[10px] text-stone-600 uppercase tracking-wide">Quality</div>
                    </div>
                  </div>

                  {quality.recommendations.length > 0 && (
                    <p className="text-xs text-stone-700">
                      Tip: {quality.recommendations[0]}
                    </p>
                  )}

                  {/* Landlord Action Bar */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => togglePropertyAvailability(prop.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                        prop.isAvailable
                          ? 'bg-stone-100 hover:bg-stone-200 text-ink-700'
                          : 'bg-tea-50 hover:bg-tea-100 text-tea-700 border border-tea-200'
                      }`}
                    >
                      {prop.isAvailable ? 'Mark as Rented' : 'Mark as Available'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openModal('PROPERTY_DETAILS', { property: prop })}
                        className="p-2 text-stone-600 hover:text-ink-900 rounded-xl hover:bg-stone-100 transition-colors"
                        title="Preview Public Listing Page"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openModal('ADD_EDIT_PROPERTY', { property: prop })}
                        className="p-2 text-stone-700 hover:text-ink-700 rounded-xl hover:bg-tea-50 transition-colors"
                        title="Edit Property Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${prop.title}"?`)) {
                            deleteProperty(prop.id);
                          }
                        }}
                        className="p-2 text-stone-500 hover:text-red-800 rounded-xl hover:bg-red-50 transition-colors"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VIEWING APPOINTMENTS & SCHEDULE */}
      {/* ========================================================================= */}
      {activeTab === 'VIEWINGS' && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-ink-700" />
                <span>Tenant Viewing Walkthroughs ({myViewings.length})</span>
              </h2>
              <p className="text-xs text-stone-600">
                Manage in-person inspections, confirm slots, and contact prospective tenants directly.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'PENDING', 'CONFIRMED', 'REJECTED'].map(st => (
                <button
                  key={st}
                  onClick={() => setViewingStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                    viewingStatusFilter === st
                      ? 'bg-tea-700 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredViewings.length > 0 ? (
            <div className="space-y-3.5">
              {filteredViewings.map(v => {
                const phoneNum = v.tenantPhone || '+250 788 345 678';
                const cleanPhone = phoneNum.replace(/[^0-9]/g, '');

                return (
                  <div
                    key={v.id}
                    className="p-5 rounded-lg bg-stone-50 border border-stone-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <img
                        src={v.propertyImage}
                        alt={v.propertyTitle}
                        className="w-16 h-16 rounded-lg object-cover shadow-xs flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink-900">{v.propertyTitle}</h4>
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              v.status === 'PENDING'
                                ? 'bg-saffron-100 text-saffron-800'
                                : v.status === 'CONFIRMED'
                                ? 'bg-tea-100 text-tea-800'
                                : 'bg-red-50 text-red-800'
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>

                        <div className="text-xs text-ink-700 mt-1 flex flex-wrap items-center gap-2 font-medium">
                          <span>Tenant: <strong>{v.tenantName}</strong></span>
                          <span>•</span>
                          <span className="text-stone-600">{v.tenantEmail}</span>
                        </div>

                        <div className="text-xs text-stone-700 flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 font-bold text-ink-900">
                            <Clock className="w-3.5 h-3.5 text-ink-700" />
                            {v.requestedDate} @ {v.requestedTimeSlot}
                          </span>
                          <span>•</span>
                          <span className="text-stone-600">{v.propertyLocation}</span>
                        </div>

                        {v.notes && (
                          <p className="text-[11px] text-stone-600 italic mt-1.5 bg-white px-2.5 py-1 rounded-lg border border-stone-200 inline-block">
                            Tenant Note: "{v.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
                      {/* Direct Contact Links */}
                      <a
                        href={`tel:${phoneNum}`}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-xs font-bold text-ink-700 transition-colors flex items-center gap-1.5"
                        title="Call Tenant"
                      >
                        <Phone className="w-3.5 h-3.5 text-tea-700" />
                        <span>Call</span>
                      </a>

                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-tea-50 hover:bg-tea-100 border border-tea-200 text-xs font-bold text-tea-700 transition-colors flex items-center gap-1.5"
                        title="Chat via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-tea-700" />
                        <span>WhatsApp</span>
                      </a>

                      {v.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => updateViewingStatus(v.id, 'APPROVED')}
                            className="px-4 py-2 rounded-xl bg-tea-700 hover:bg-tea-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm</span>
                          </button>

                          <button
                            onClick={() => updateViewingStatus(v.id, 'REJECTED')}
                            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-50 text-red-800 border border-red-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-stone-600 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                          Viewing {v.status.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-stone-500 text-xs space-y-2">
              <Calendar className="w-8 h-8 text-stone-400 mx-auto" />
              <p>No viewing requests match the selected filter.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TENANT INQUIRIES & DIRECT MESSAGING */}
      {/* ========================================================================= */}
      {activeTab === 'INQUIRIES' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-3 min-h-[550px]">
          {/* Left Inquiries List */}
          <div className="border-r border-stone-200 divide-y divide-stone-100 overflow-y-auto max-h-[600px]">
            <div className="p-4 bg-stone-50 font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center justify-between">
              <span>Leads & Inquiries</span>
              <span className="text-tea-700">{myInquiries.length} total</span>
            </div>

            {myInquiries.map(inq => {
              const active = inq.id === selectedInquiryId || (!selectedInquiryId && inq === myInquiries[0]);
              return (
                <button
                  key={inq.id}
                  onClick={() => setSelectedInquiryId(inq.id)}
                  className={`w-full p-4 text-left transition-colors flex items-start gap-3.5 cursor-pointer ${
                    active ? 'bg-tea-50 border-l-4 border-tea-600' : 'hover:bg-stone-50'
                  }`}
                >
                  <img
                    src={inq.propertyImage}
                    alt={inq.propertyTitle}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-bold text-ink-900 truncate">{inq.tenantName}</span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {new Date(inq.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-ink-800 truncate">{inq.subject}</p>
                    <p className="text-[11px] text-stone-600 truncate mt-0.5">{inq.message}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Active Conversation Pane */}
          <div className="lg:col-span-2 p-6 flex flex-col justify-between space-y-6">
            {(() => {
              const activeInq = myInquiries.find(i => i.id === selectedInquiryId) || myInquiries[0];
              if (!activeInq) {
                return (
                  <div className="text-center py-20 text-stone-500 text-xs">
                    No inquiries received yet. Inquiries submitted by tenants on your listings will appear here.
                  </div>
                );
              }

              return (
                <>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between pb-4 border-b border-stone-100">
                      <div>
                        <h3 className="text-sm font-bold text-ink-900">{activeInq.subject}</h3>
                        <p className="text-xs text-stone-600 mt-0.5">
                          Regarding <strong>{activeInq.propertyTitle}</strong> ({activeInq.propertyLocation})
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-ink-900 block">{activeInq.tenantName}</span>
                        <span className="text-[11px] text-stone-500">{activeInq.tenantEmail}</span>
                      </div>
                    </div>

                    {/* Tenant Message */}
                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-ink-800">{activeInq.tenantName}</span>
                        <span className="text-[10px] text-stone-500">
                          {new Date(activeInq.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-ink-700 leading-relaxed">{activeInq.message}</p>
                    </div>

                    {/* Landlord Existing Reply if any */}
                    {activeInq.reply && (
                      <div className="bg-tea-50 p-4 rounded-lg border border-tea-200 space-y-1.5 ml-6">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-tea-900 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-tea-700" />
                            Your Reply ({currentUser?.fullName || 'Landlord'})
                          </span>
                          <span className="text-[10px] text-tea-700">
                            {activeInq.repliedAt ? new Date(activeInq.repliedAt).toLocaleString() : 'Sent'}
                          </span>
                        </div>
                        <p className="text-xs text-tea-800 leading-relaxed">{activeInq.reply}</p>
                      </div>
                    )}

                    {/* Rwanda Canned Quick Responses */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-bold text-stone-600 block">Quick Rwandan Reply Templates:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Muraho! The unit is vacant and available for immediate move-in.',
                          'Water tank backup and high-speed WiFi are included in the monthly rent.',
                          'Minimum lease term is 6 months with 1 month refundable security deposit.',
                          'Would you like to schedule an in-person viewing tomorrow afternoon?'
                        ].map((template, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setReplyText(template)}
                            className="text-[10px] bg-stone-100 hover:bg-stone-200 text-ink-700 px-2.5 py-1 rounded-lg transition-colors text-left"
                          >
                            "{template}"
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reply Input Box */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <textarea
                      rows={3}
                      placeholder={`Type your reply to ${activeInq.tenantName}...`}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="w-full p-3 text-xs rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-tea-600"
                    />

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => navigate(`/messages?thread=${activeInq.id}`)}
                        className="text-xs font-semibold text-tea-700 hover:text-tea-800"
                      >
                        Open full conversation →
                      </button>
                      <button
                        onClick={() => handleSendInquiryReply(activeInq.id)}
                        disabled={!replyText.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-tea-700 hover:bg-tea-600 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RENT COLLECTION & LEASE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'LEASES_PAYMENTS' && (
        <div className="space-y-6">
          {/* Top Leases Action Bar */}
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-tea-700" />
                <span>Active Leases & Rent Collection</span>
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Track Rwandan residential leases, log MTN MoMo & Bank payments, and generate official digital receipts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (myProperties.length > 0) {
                    setNewLeasePropId(myProperties[0].id);
                    setNewLeaseRent(myProperties[0].monthlyRent);
                  }
                  setShowNewLeaseModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-tea-700 hover:bg-tea-600 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Lease Agreement</span>
              </button>
            </div>
          </div>

          {/* Active Leases List */}
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Active Tenant Leases ({myLeases.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myLeases.map(lease => (
                <div
                  key={lease.id}
                  className="p-5 rounded-lg bg-stone-50 border border-stone-200 space-y-3.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-tea-100 text-tea-800">
                        {lease.status}
                      </span>
                      <h4 className="text-sm font-bold text-ink-900 mt-1 line-clamp-1">
                        {lease.propertyTitle}
                      </h4>
                      <p className="text-xs text-stone-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-ink-700" />
                        {lease.propertySector}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        lease.paymentStatus === 'PAID'
                          ? 'bg-tea-100 text-tea-800'
                          : 'bg-saffron-100 text-saffron-800'
                      }`}
                    >
                      {lease.paymentStatus}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-stone-200 text-xs space-y-1 font-medium">
                    <div className="flex items-center justify-between text-ink-700">
                      <span>Tenant:</span>
                      <strong className="text-ink-900">{lease.tenantName}</strong>
                    </div>
                    <div className="flex items-center justify-between text-ink-700">
                      <span>Phone:</span>
                      <span className="font-mono text-stone-700">{lease.tenantPhone}</span>
                    </div>
                    <div className="flex items-center justify-between text-ink-700">
                      <span>Monthly Rent:</span>
                      <strong className="text-tea-700 font-mono">{lease.monthlyRent.toLocaleString()} RWF</strong>
                    </div>
                    <div className="flex items-center justify-between text-ink-700">
                      <span>Lease Period:</span>
                      <span className="text-stone-600">{lease.startDate} → {lease.endDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedLeaseForPayment(lease);
                        setPaymentAmount(lease.monthlyRent);
                        setShowPaymentModal(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-tea-700 hover:bg-tea-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>

                    <button
                      onClick={() => {
                        const smsText = `Muraho ${lease.tenantName}, this is a friendly reminder that your rent of ${lease.monthlyRent.toLocaleString()} RWF for ${lease.propertyTitle} is due. Please pay via MTN MoMo to ${currentUser?.phoneNumber || '0788123456'}. Murakoze!`;
                        navigator.clipboard.writeText(smsText);
                        addToast('info', 'Copied MoMo Rent Reminder SMS to clipboard!');
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-ink-700 transition-colors"
                      title="Copy MoMo Rent Reminder SMS"
                    >
                      <Send className="w-3.5 h-3.5 text-ink-700" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Receipts History Table */}
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Payment History & Official Receipts ({myPayments.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="p-3">Receipt #</th>
                    <th className="p-3">Property / Tenant</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Amount (RWF)</th>
                    <th className="p-3">Month</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {myPayments.map(pay => (
                    <tr key={pay.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-ink-900">{pay.receiptNumber}</td>
                      <td className="p-3">
                        <div className="font-bold text-ink-900">{pay.propertyTitle}</div>
                        <div className="text-stone-600">{pay.tenantName}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-ink-700 font-bold uppercase text-[10px]">
                          {pay.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-tea-700">
                        {pay.amountRwf.toLocaleString()} RWF
                      </td>
                      <td className="p-3 text-ink-700">{pay.paidForMonth}</td>
                      <td className="p-3 text-stone-600">{pay.paymentDate}</td>
                      <td className="p-3 text-right">
                        {pay.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-800 font-semibold text-[11px]" title={`Reported by the tenant · ref ${pay.transactionReference}`}>
                              Reported by tenant
                            </span>
                            <button
                              onClick={() => confirmPayment(pay.id)}
                              className="px-3 py-1.5 rounded-xl bg-tea-700 hover:bg-tea-800 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                            >
                              Confirm received
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveReceipt(pay)}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-ink-800 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            View Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MAINTENANCE & REPAIRS TICKETS */}
      {/* ========================================================================= */}
      {activeTab === 'MAINTENANCE' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-saffron-600" />
                <span>Property Maintenance & Repairs</span>
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Track plumbing, electrical backup, reserve water tank maintenance, and local Rwandan contractor costs.
              </p>
            </div>

            <button
              onClick={() => {
                if (myProperties.length > 0) setMaintPropId(myProperties[0].id);
                setShowMaintenanceModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-saffron-600 hover:bg-saffron-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Maintenance Ticket</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myMaintenance.map(ticket => (
              <div
                key={ticket.id}
                className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-stone-100 text-ink-700">
                      {ticket.category.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        ticket.priority === 'URGENT' || ticket.priority === 'HIGH'
                          ? 'bg-red-50 text-red-800'
                          : 'bg-tea-100 text-ink-800'
                      }`}
                    >
                      {ticket.priority} Priority
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-ink-900 line-clamp-1">{ticket.title}</h3>
                  {ticket.reportedBy === 'TENANT' && (
                    <p className="text-[11px] font-semibold text-tea-700">Reported by {ticket.tenantName || 'your tenant'} · {ticket.reportedDate}</p>
                  )}
                  <p className="text-xs text-stone-700">{ticket.description}</p>
                  {ticket.photos && ticket.photos.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {ticket.photos.map(src => (
                        <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-stone-200 shrink-0">
                          <img src={src} alt="Photo of the problem" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Unit:</span>
                    <strong className="text-ink-800 truncate max-w-[150px]">{ticket.propertyTitle}</strong>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Est. Cost:</span>
                    <strong className="text-saffron-700 font-mono">{ticket.estimatedCostRwf.toLocaleString()} RWF</strong>
                  </div>
                  {ticket.contractorName && (
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Contractor:</span>
                      <span className="text-ink-700">{ticket.contractorName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        ticket.status === 'RESOLVED'
                          ? 'bg-tea-100 text-tea-800'
                          : ticket.status === 'IN_PROGRESS'
                          ? 'bg-saffron-100 text-saffron-800'
                          : 'bg-stone-100 text-ink-800'
                      }`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>

                    {ticket.status !== 'RESOLVED' ? (
                      <button
                        onClick={() => updateMaintenanceTicket(ticket.id, { status: 'RESOLVED', resolvedDate: new Date().toISOString().slice(0, 10) })}
                        className="px-3 py-1 rounded-xl bg-tea-700 hover:bg-tea-600 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Resolved</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone-500">Resolved {ticket.resolvedDate}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: RENTAL YIELD & ROI INTELLIGENCE CALCULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'YIELD_CALCULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Inputs */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-tea-700" />
                <span>ROI & Yield Calculator</span>
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                Calculate gross & net rental returns customized for Kigali & Rwandan secondary cities.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Property Asset Value / Purchase Price (RWF)
                </label>
                <input
                  type="number"
                  step="1000000"
                  value={calcPropValue}
                  onChange={e => setCalcPropValue(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold focus:ring-2 focus:ring-tea-600"
                />
                <span className="text-[10px] text-stone-500 mt-0.5 block">
                  {(calcPropValue / 1000000).toFixed(1)} Million RWF
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Monthly Rent Charged (RWF)
                </label>
                <input
                  type="number"
                  step="50000"
                  value={calcMonthlyRent}
                  onChange={e => setCalcMonthlyRent(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold focus:ring-2 focus:ring-tea-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Estimated Annual Expenses & Taxes (RWF)
                </label>
                <input
                  type="number"
                  step="50000"
                  value={calcAnnualExpenses}
                  onChange={e => setCalcAnnualExpenses(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold focus:ring-2 focus:ring-tea-600"
                />
                <span className="text-[10px] text-stone-500 mt-0.5 block">
                  Includes Rwanda rental income tax, maintenance, security guard share.
                </span>
              </div>

              {/* Location Presets */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-stone-600 block mb-1.5">Rwanda Market Presets:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCalcPropValue(50000000);
                      setCalcMonthlyRent(450000);
                      setCalcAnnualExpenses(500000);
                    }}
                    className="p-2 text-left bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 text-[10px]"
                  >
                    <strong>Kimihurura 2-Bed</strong>
                    <div className="text-stone-600">50M Val • 450k Rent</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCalcPropValue(120000000);
                      setCalcMonthlyRent(1200000);
                      setCalcAnnualExpenses(1400000);
                    }}
                    className="p-2 text-left bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 text-[10px]"
                  >
                    <strong>Nyarutarama Villa</strong>
                    <div className="text-stone-600">120M Val • 1.2M Rent</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCalcPropValue(35000000);
                      setCalcMonthlyRent(350000);
                      setCalcAnnualExpenses(350000);
                    }}
                    className="p-2 text-left bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 text-[10px]"
                  >
                    <strong>Musanze Townhouse</strong>
                    <div className="text-stone-600">35M Val • 350k Rent</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCalcPropValue(40000000);
                      setCalcMonthlyRent(400000);
                      setCalcAnnualExpenses(400000);
                    }}
                    className="p-2 text-left bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 text-[10px]"
                  >
                    <strong>Rubavu Beach Villa</strong>
                    <div className="text-stone-600">40M Val • 400k Rent</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Results & Benchmarks */}
          <div className="lg:col-span-2 space-y-6">
            <div className="palette-light bg-tea-700 text-white p-6 rounded-xl shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-tea-600 pb-4">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Yield & Performance Output</h3>
                  <p className="text-xs text-stone-200">Based on Rwandan standard rental market equations</p>
                </div>
                <span className="px-3 py-1 bg-tea-600 text-stone-200 rounded-full text-xs font-bold">
                  Rwanda Real Estate 2026
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-ink-950/50 p-4 rounded-lg border border-tea-600">
                  <span className="text-[10px] uppercase font-bold text-stone-300">Gross Yield</span>
                  <div className="text-2xl font-bold text-white mt-1">{grossRentalYield}%</div>
                  <span className="text-[10px] text-stone-300">Annual rent / Value</span>
                </div>

                <div className="bg-ink-950/50 p-4 rounded-lg border border-tea-600">
                  <span className="text-[10px] uppercase font-bold text-stone-300">Net Yield</span>
                  <div className="text-2xl font-bold text-saffron-300 mt-1">{netRentalYield}%</div>
                  <span className="text-[10px] text-stone-300">After all expenses</span>
                </div>

                <div className="bg-ink-950/50 p-4 rounded-lg border border-tea-600">
                  <span className="text-[10px] uppercase font-bold text-stone-300">Net Cash Flow</span>
                  <div className="text-xl font-bold text-white mt-1 font-mono">
                    {(netAnnualRent / 1000000).toFixed(2)}M <span className="text-xs font-normal">RWF/yr</span>
                  </div>
                  <span className="text-[10px] text-stone-300">Annual net profit</span>
                </div>

                <div className="bg-ink-950/50 p-4 rounded-lg border border-tea-600">
                  <span className="text-[10px] uppercase font-bold text-stone-300">Payback Period</span>
                  <div className="text-2xl font-bold text-white mt-1">{paybackYears} <span className="text-xs font-normal">Years</span></div>
                  <span className="text-[10px] text-stone-300">Capital recovery</span>
                </div>
              </div>
            </div>

            {/* Regional Yield Comparisons */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Rwanda Regional Rental Index Benchmarks
              </h3>

              <div className="space-y-3">
                {[
                  { region: 'Kigali (Kimihurura / Kacyiru)', avgYield: '9.8% - 11.2%', demand: 'Very High (Diplomats & Tech)', rentRange: '400k - 1.5M RWF' },
                  { region: 'Kigali (Kicukiro / Kanombe / Gikondo)', avgYield: '10.5% - 12.0%', demand: 'High (Families & Airport)', rentRange: '250k - 600k RWF' },
                  { region: 'Musanze (Tourism & Mountain Hub)', avgYield: '11.0% - 13.5%', demand: 'High (Eco-lodges & Tourism)', rentRange: '200k - 500k RWF' },
                  { region: 'Rubavu (Lake Kivu Front)', avgYield: '9.5% - 12.0%', demand: 'Steady (Holiday & Cross-border)', rentRange: '300k - 800k RWF' },
                  { region: 'Huye (University & Secondary City)', avgYield: '10.0% - 11.8%', demand: 'Steady (Academic & Medical)', rentRange: '150k - 350k RWF' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <strong className="text-ink-900">{item.region}</strong>
                      <div className="text-stone-600 mt-0.5">Typical Rent: {item.rentRange}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-tea-700 block">{item.avgYield} Avg Yield</span>
                      <span className="text-[10px] text-stone-600">{item.demand}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD RENT PAYMENT */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="animate-pop bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-stone-200 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-tea-100 text-tea-700 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-ink-900 text-sm">Record Rent Payment</h3>
                  <p className="text-[11px] text-stone-500">Log incoming MoMo or Bank transfer</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-stone-500 hover:text-ink-700 rounded-lg hover:bg-stone-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-ink-700 mb-1">Select Lease / Unit</label>
                <select
                  value={selectedLeaseForPayment?.id || ''}
                  onChange={e => {
                    const l = myLeases.find(item => item.id === e.target.value) || null;
                    setSelectedLeaseForPayment(l);
                    if (l) setPaymentAmount(l.monthlyRent);
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-medium"
                >
                  {myLeases.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.propertyTitle} — Tenant: {l.tenantName} ({l.monthlyRent.toLocaleString()} RWF)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold text-tea-800"
                >
                  <option value="MTN_MOMO">MTN Mobile Money (MoMo)</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="BK_TRANSFER">Bank of Kigali (BK Online Transfer)</option>
                  <option value="IM_BANK">I&M Bank Transfer</option>
                  <option value="CASH">Cash in Person</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Amount Paid (RWF)</label>
                  <input
                    type="number"
                    step="10000"
                    required
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink-700 mb-1">Month Period</label>
                  <input
                    type="month"
                    required
                    value={paymentMonth}
                    onChange={e => setPaymentMonth(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. MoMo transaction ID 78834599"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-ink-700 font-bold hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-tea-700 hover:bg-tea-600 text-white font-bold transition-colors cursor-pointer"
                >
                  Confirm & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL DIGITAL RENT RECEIPT */}
      {/* ========================================================================= */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="animate-pop bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-stone-200 space-y-5 text-left">
            {/* Printable Receipt Card */}
            <div className="p-6 rounded-lg bg-stone-50 border border-stone-200 space-y-4 font-sans text-xs">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-tea-700 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm tracking-tight text-ink-900 block">HABIFY</span>
                    <span className="text-[10px] text-stone-600">Official Residential Rent Receipt</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-ink-900 block">{activeReceipt.receiptNumber}</span>
                  <span className="text-[10px] text-tea-700 font-bold">VERIFIED PAYMENT</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-stone-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Property</span>
                  <strong className="text-ink-900 block">{activeReceipt.propertyTitle}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Payment Date</span>
                  <strong className="text-ink-900 block">{activeReceipt.paymentDate}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Tenant Name</span>
                  <strong className="text-ink-900 block">{activeReceipt.tenantName}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Landlord / Owner</span>
                  <strong className="text-ink-900 block">{activeReceipt.landlordName}</strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-tea-50 border border-tea-200 text-center space-y-1">
                <span className="text-[11px] font-bold text-tea-800 uppercase tracking-wider block">
                  Amount Received for {activeReceipt.paidForMonth}
                </span>
                <div className="text-2xl font-bold text-tea-900 font-mono">
                  {activeReceipt.amountRwf.toLocaleString()} RWF
                </div>
                <span className="text-[10px] text-tea-700 block">
                  Via {activeReceipt.paymentMethod.replace('_', ' ')} • Ref: {activeReceipt.transactionReference}
                </span>
              </div>

              {activeReceipt.notes && (
                <div className="text-[11px] text-stone-600 italic bg-white p-2 rounded border border-stone-200">
                  Note: {activeReceipt.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-tea-700 hover:bg-tea-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save Receipt</span>
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-ink-700 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG MAINTENANCE REQUEST */}
      {/* ========================================================================= */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="animate-pop bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-stone-200 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-saffron-100 text-saffron-700 flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-ink-900 text-sm">Log Maintenance Ticket</h3>
                  <p className="text-[11px] text-stone-500">Track unit repairs and expenses</p>
                </div>
              </div>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="p-1 text-stone-500 hover:text-ink-700 rounded-lg hover:bg-stone-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-ink-700 mb-1">Select Property Unit</label>
                <select
                  value={maintPropId}
                  onChange={e => setMaintPropId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-medium"
                >
                  {myProperties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.locationSector})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Category</label>
                  <select
                    value={maintCategory}
                    onChange={e => setMaintCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                  >
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL_SOLAR">Electrical & Solar</option>
                    <option value="WATER_PUMP_TANK">Water Reserve Tank & Pump</option>
                    <option value="APPLIANCES">Appliances & Kitchen</option>
                    <option value="STRUCTURAL_PAINTING">Painting & Structural</option>
                    <option value="INTERNET_SECURITY">Internet & Gate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink-700 mb-1">Priority</label>
                  <select
                    value={maintPriority}
                    onChange={e => setMaintPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                  >
                    <option value="URGENT">Urgent (Immediate)</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Booster water pump servicing"
                  value={maintTitle}
                  onChange={e => setMaintTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide repair details or tenant notes..."
                  value={maintDesc}
                  onChange={e => setMaintDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Est. Cost (RWF)</label>
                  <input
                    type="number"
                    step="5000"
                    value={maintEstCost}
                    onChange={e => setMaintEstCost(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink-700 mb-1">Contractor / Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. Kigali Tech (+250 788...)"
                    value={maintContractor}
                    onChange={e => setMaintContractor(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-ink-700 font-bold hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white font-bold transition-colors cursor-pointer"
                >
                  Save Maintenance Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW LEASE AGREEMENT */}
      {/* ========================================================================= */}
      {showNewLeaseModal && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="animate-pop bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-stone-200 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-tea-100 text-tea-700 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-ink-900 text-sm">Create Lease Agreement</h3>
                  <p className="text-[11px] text-stone-500">Register new tenant and lease terms</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewLeaseModal(false)}
                className="p-1 text-stone-500 hover:text-ink-700 rounded-lg hover:bg-stone-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewLease} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-ink-700 mb-1">Select Property Unit</label>
                <select
                  value={newLeasePropId}
                  onChange={e => {
                    setNewLeasePropId(e.target.value);
                    const p = myProperties.find(item => item.id === e.target.value);
                    if (p) setNewLeaseRent(p.monthlyRent);
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-medium"
                >
                  {myProperties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {p.monthlyRent.toLocaleString()} RWF/mo ({p.locationSector})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Tenant Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Claire Mukamana"
                  value={newLeaseTenantName}
                  onChange={e => setNewLeaseTenantName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Tenant Phone</label>
                  <input
                    type="text"
                    required
                    value={newLeaseTenantPhone}
                    onChange={e => setNewLeaseTenantPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink-700 mb-1">Monthly Rent (RWF)</label>
                  <input
                    type="number"
                    step="10000"
                    required
                    value={newLeaseRent}
                    onChange={e => setNewLeaseRent(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLeaseStart}
                    onChange={e => setNewLeaseStart(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newLeaseEnd}
                    onChange={e => setNewLeaseEnd(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewLeaseModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-ink-700 font-bold hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-tea-700 hover:bg-tea-600 text-white font-bold transition-colors cursor-pointer"
                >
                  Create & Activate Lease
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
