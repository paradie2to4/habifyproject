import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  User,
  Property,
  TenantPreferences,
  ViewingRequest,
  Inquiry,
  PropertyReport,
  FilterState,
  MatchScoreExplanation,
  ListingQualityScore,
  AffordabilityAnalysis,
  ActiveTab,
  LeaseAgreement,
  RentPayment,
  MaintenanceTicket
} from '../types';
import {
  SEED_USERS,
  SEED_PROPERTIES,
  INITIAL_TENANT_PREFERENCES,
  SEED_VIEWINGS,
  SEED_INQUIRIES,
  SEED_REPORTS,
  SEED_LEASES,
  SEED_PAYMENTS,
  SEED_MAINTENANCE_TICKETS
} from '../data/seedData';
import { PropertyMatchingEngine } from '../services/matchingEngine';
import { ListingQualityService } from '../services/listingQualityService';
import { AffordabilityCalculator } from '../services/affordabilityCalculator';
import {
  BackendStatus,
  checkBackendHealth,
  fetchProperties,
  createPropertyApi,
  updatePropertyApi,
  deletePropertyApi,
  createViewingRequestApi,
  createInquiryApi,
  setAuthToken
} from '../services/api';
import { dashboardForRole } from '../utils/roles';
import { normalizeImageList } from '../utils/images';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  // Auth state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: 'TENANT' | 'LANDLORD' | 'ADMIN' | 'GUEST') => void;
  allUsers: User[];

  // Backend connectivity
  backendStatus: BackendStatus;

  // Tenant Preferences
  preferences: TenantPreferences;
  updatePreferences: (newPrefs: Partial<TenantPreferences>) => void;

  // Properties
  properties: Property[];
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'inquiriesCount'>) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  togglePropertyAvailability: (id: string) => void;
  toggleAvailability: (id: string) => void;

  // Favorites
  favorites: string[]; // property IDs
  toggleFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;

  // Viewings
  viewings: ViewingRequest[];
  viewingRequests: ViewingRequest[];
  createViewingRequest: (req: Omit<ViewingRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateViewingStatus: (id: string, status: ViewingRequest['status'], landlordNote?: string) => void;

  // Inquiries
  inquiries: Inquiry[];
  sendInquiry: (inq: Omit<Inquiry, 'id' | 'createdAt' | 'isRead'>) => void;
  replyInquiry: (id: string, reply: string) => void;

  // Reports
  reports: PropertyReport[];
  submitReport: (report: Omit<PropertyReport, 'id' | 'createdAt' | 'status'>) => void;
  updateReportStatus: (id: string, status: PropertyReport['status'], adminNotes?: string) => void;

  // Landlord Operations (Leases, Payments, Maintenance)
  leases: LeaseAgreement[];
  addLease: (lease: Omit<LeaseAgreement, 'id'>) => void;
  updateLeaseStatus: (id: string, status: LeaseAgreement['status'], paymentStatus?: LeaseAgreement['paymentStatus']) => void;
  payments: RentPayment[];
  recordPayment: (payment: Omit<RentPayment, 'id' | 'receiptNumber' | 'status'>) => RentPayment;
  maintenanceTickets: MaintenanceTicket[];
  addMaintenanceTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'reportedDate' | 'status'>) => void;
  updateMaintenanceTicket: (id: string, updates: Partial<MaintenanceTicket>) => void;

  // Search & Filters
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;

  // Computed & helper methods
  getMatchExplanation: (property: Property) => MatchScoreExplanation;
  getListingQuality: (property: Property) => ListingQualityScore;
  getAffordability: (monthlyRent: number) => AffordabilityAnalysis;
  filteredAndSortedProperties: Property[];
  topRecommendations: Array<{ property: Property; match: MatchScoreExplanation }>;

  // Navigation tab
  currentTab: ActiveTab;
  setCurrentTab: (tab: ActiveTab) => void;

  // Modals & UI helpers
  activeModal: string | null;
  modalData: any;
  openModal: (name: string, data?: any) => void;
  closeModal: () => void;

  // Toast notifications
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;

  // Reset to original seed state
  resetAllSeedData: () => void;
}

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  selectedProvince: '',
  selectedDistrict: '',
  selectedLocation: '',
  propertyType: '',
  minPrice: 0,
  maxPrice: 2000000,
  minBedrooms: 0,
  selectedAmenities: [],
  sortBy: 'MATCH_SCORE'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage or Seed Data
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smartrental_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return SEED_USERS[0]; // Default to Tenant (Claire)
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('smartrental_users_all');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return SEED_USERS;
  });

  const [preferences, setPreferences] = useState<TenantPreferences>(() => {
    const saved = localStorage.getItem('smartrental_preferences');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return INITIAL_TENANT_PREFERENCES;
  });

  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('smartrental_properties');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Property[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => ({
            ...p,
            images: normalizeImageList(p.images, p.id || p.title || '')
          }));
        }
      } catch (e) { /* use default */ }
    }
    return SEED_PROPERTIES;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('smartrental_favorites');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return ['prop-001', 'prop-011'];
  });

  const [viewings, setViewings] = useState<ViewingRequest[]>(() => {
    const saved = localStorage.getItem('smartrental_viewings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return SEED_VIEWINGS;
  });

  const [inquiries, setInquiries] = useState<Inquiry[]>(() => {
    const saved = localStorage.getItem('smartrental_inquiries');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return SEED_INQUIRIES;
  });

  const [reports, setReports] = useState<PropertyReport[]>(() => {
    const saved = localStorage.getItem('smartrental_reports');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return SEED_REPORTS;
  });

  const [leases, setLeases] = useState<LeaseAgreement[]>(() => {
    const saved = localStorage.getItem('smartrental_leases');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return SEED_LEASES;
  });

  const [payments, setPayments] = useState<RentPayment[]>(() => {
    const saved = localStorage.getItem('smartrental_payments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return SEED_PAYMENTS;
  });

  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>(() => {
    const saved = localStorage.getItem('smartrental_maintenance');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return SEED_MAINTENANCE_TICKETS;
  });

  const [currentTab, setCurrentTab] = useState<ActiveTab>('BROWSE');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('connecting');

  // Connect to Spring Boot when available; fall back to local seed data
  useEffect(() => {
    let cancelled = false;

    const pushToast = (type: Toast['type'], message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4500);
    };

    (async () => {
      const online = await checkBackendHealth();
      if (cancelled) return;

      if (!online) {
        setBackendStatus('offline');
        // Restore the rich local catalog if a previous live session left a thin API snapshot
        setProperties(prev => (prev.length > 0 && prev.length < 8 ? SEED_PROPERTIES : prev));
        return;
      }

      try {
        const remote = await fetchProperties();
        if (cancelled) return;
        if (remote.length > 0) {
          setProperties(remote);
        }
        setBackendStatus('online');
        pushToast('success', `Connected to backend — loaded ${remote.length} live listings`);
      } catch {
        if (!cancelled) {
          setBackendStatus('offline');
          pushToast('warning', 'Backend reachable but listings failed to load — using local demo data');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync to local storage for persistence across reloads
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('smartrental_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('smartrental_user');
      setAuthToken(null);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('smartrental_preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('smartrental_properties', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('smartrental_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('smartrental_viewings', JSON.stringify(viewings));
  }, [viewings]);

  useEffect(() => {
    localStorage.setItem('smartrental_inquiries', JSON.stringify(inquiries));
  }, [inquiries]);

  useEffect(() => {
    localStorage.setItem('smartrental_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('smartrental_leases', JSON.stringify(leases));
  }, [leases]);

  useEffect(() => {
    localStorage.setItem('smartrental_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('smartrental_maintenance', JSON.stringify(maintenanceTickets));
  }, [maintenanceTickets]);

  // Toast helper
  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const switchRole = (role: 'TENANT' | 'LANDLORD' | 'ADMIN' | 'GUEST') => {
    if (role === 'GUEST') {
      setCurrentUser(null);
      setAuthToken(null);
      setCurrentTab('BROWSE');
      addToast('info', 'Signed out');
      return;
    }
    const found = allUsers.find(u => u.role === role);
    if (found) {
      setCurrentUser(found);
      setCurrentTab(dashboardForRole(found.role));
      addToast('success', `Logged in as ${found.fullName} (${found.role})`);
    }
  };

  const updatePreferences = (newPrefs: Partial<TenantPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
    addToast('success', 'Rental preferences updated! Recalculated smart match recommendations.');
  };

  const addProperty = async (propData: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'inquiriesCount'>) => {
    const localProperty: Property = {
      ...propData,
      id: `prop-${Date.now().toString().slice(-4)}`,
      viewsCount: 1,
      inquiriesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (backendStatus === 'online') {
      try {
        const created = await createPropertyApi(localProperty);
        setProperties(prev => [created, ...prev]);
        addToast('success', `Property "${created.title}" published to the live API`);
        return;
      } catch {
        addToast('warning', 'API publish failed — saved locally instead');
      }
    }

    setProperties(prev => [localProperty, ...prev]);
    addToast('success', `Property "${localProperty.title}" successfully published!`);
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    const existing = properties.find(p => p.id === id);
    const merged = existing ? { ...existing, ...updates, updatedAt: new Date().toISOString() } : null;

    if (backendStatus === 'online' && merged) {
      try {
        const saved = await updatePropertyApi(id, merged);
        setProperties(prev => prev.map(p => (p.id === id ? saved : p)));
        addToast('success', 'Property listing updated on the live API');
        return;
      } catch {
        addToast('warning', 'API update failed — saved locally instead');
      }
    }

    setProperties(prev => prev.map(p => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)));
    addToast('success', 'Property listing updated successfully!');
  };

  const deleteProperty = async (id: string) => {
    if (backendStatus === 'online') {
      try {
        await deletePropertyApi(id);
      } catch {
        addToast('warning', 'API delete failed — removing locally');
      }
    }
    setProperties(prev => prev.filter(p => p.id !== id));
    addToast('info', 'Property listing removed.');
  };

  const togglePropertyAvailability = (id: string) => {
    setProperties(prev => prev.map(p => {
      if (p.id === id) {
        const next = !p.isAvailable;
        addToast('info', `Property status updated: ${next ? 'Available' : 'Occupied / Hidden'}`);
        return { ...p, isAvailable: next };
      }
      return p;
    }));
  };

  const toggleFavorite = (propertyId: string) => {
    setFavorites(prev => {
      const exists = prev.includes(propertyId);
      if (exists) {
        addToast('info', 'Removed from saved properties');
        return prev.filter(id => id !== propertyId);
      } else {
        addToast('success', 'Property saved to your favorites!');
        return [...prev, propertyId];
      }
    });
  };

  const isFavorite = (propertyId: string) => favorites.includes(propertyId);

  const createViewingRequest = (req: Omit<ViewingRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const newReq: ViewingRequest = {
      ...req,
      id: `view-${Date.now().toString().slice(-4)}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setViewings(prev => [newReq, ...prev]);

    if (backendStatus === 'online') {
      createViewingRequestApi(req).catch(() => {
        addToast('warning', 'Viewing saved locally — API sync failed');
      });
    }

    addToast('success', 'Viewing request submitted to landlord! You will be notified upon confirmation.');
  };

  const updateViewingStatus = (id: string, status: ViewingRequest['status'], landlordNote?: string) => {
    setViewings(prev => prev.map(v => (v.id === id ? {
      ...v,
      status,
      landlordNote: landlordNote || v.landlordNote,
      updatedAt: new Date().toISOString()
    } : v)));
    addToast('info', `Viewing request status marked as ${status}`);
  };

  const sendInquiry = (inq: Omit<Inquiry, 'id' | 'createdAt' | 'isRead'>) => {
    const newInq: Inquiry = {
      ...inq,
      id: `inq-${Date.now().toString().slice(-4)}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setInquiries(prev => [newInq, ...prev]);
    // increment property inquiries count
    setProperties(prev => prev.map(p => p.id === inq.propertyId ? { ...p, inquiriesCount: p.inquiriesCount + 1 } : p));

    if (backendStatus === 'online') {
      createInquiryApi(inq).catch(() => {
        addToast('warning', 'Inquiry saved locally — API sync failed');
      });
    }

    addToast('success', 'Inquiry message dispatched directly to the landlord!');
  };

  const replyInquiry = (id: string, reply: string) => {
    setInquiries(prev => prev.map(inq => (inq.id === id ? {
      ...inq,
      reply,
      isRead: true,
      repliedAt: new Date().toISOString()
    } : inq)));
    addToast('success', 'Reply message sent to tenant.');
  };

  const submitReport = (report: Omit<PropertyReport, 'id' | 'createdAt' | 'status'>) => {
    const newReport: PropertyReport = {
      ...report,
      id: `rep-${Date.now().toString().slice(-4)}`,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    setReports(prev => [newReport, ...prev]);
    addToast('warning', 'Property report submitted for Admin moderation.');
  };

  const updateReportStatus = (id: string, status: PropertyReport['status'], adminNotes?: string) => {
    setReports(prev => prev.map(r => (r.id === id ? {
      ...r,
      status,
      adminNotes: adminNotes || r.adminNotes
    } : r)));
    addToast('info', `Listing report status changed to ${status}`);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const getMatchExplanation = (property: Property): MatchScoreExplanation => {
    return PropertyMatchingEngine.calculateMatch(property, preferences);
  };

  const getListingQuality = (property: Property): ListingQualityScore => {
    return ListingQualityService.evaluate(property);
  };

  const getAffordability = (monthlyRent: number): AffordabilityAnalysis => {
    return AffordabilityCalculator.analyze(preferences.monthlyIncome, monthlyRent);
  };

  // Filter and Sort Logic
  const filteredAndSortedProperties = useMemo(() => {
    return properties
      .filter(prop => {
        // Only active/available for public & tenants; landlords & admin see all
        if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'LANDLORD' && !prop.isAvailable) {
          return false;
        }

        // Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchTitle = prop.title.toLowerCase().includes(q);
          const matchDesc = prop.description.toLowerCase().includes(q);
          const matchSector = prop.locationSector.toLowerCase().includes(q);
          const matchAddress = prop.address.toLowerCase().includes(q);
          const matchDistrict = (prop.district || '').toLowerCase().includes(q);
          const matchProvince = (prop.province || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchSector && !matchAddress && !matchDistrict && !matchProvince) return false;
        }

        // Province filter
        if (filters.selectedProvince && (prop.province || '') !== filters.selectedProvince) {
          return false;
        }

        // District filter
        if (filters.selectedDistrict && (prop.district || '') !== filters.selectedDistrict) {
          return false;
        }

        // Sector / Location
        if (filters.selectedLocation && prop.locationSector.toLowerCase() !== filters.selectedLocation.toLowerCase()) {
          return false;
        }

        // Property type
        if (filters.propertyType && prop.propertyType !== filters.propertyType) {
          return false;
        }

        // Price range
        if (filters.minPrice > 0 && prop.monthlyRent < filters.minPrice) return false;
        if (filters.maxPrice > 0 && prop.monthlyRent > filters.maxPrice) return false;

        // Bedrooms
        if (filters.minBedrooms > 0 && prop.bedrooms < filters.minBedrooms) return false;

        // Furnished
        if (filters.isFurnished !== undefined && prop.isFurnished !== filters.isFurnished) return false;

        // Parking
        if (filters.hasParking !== undefined && prop.hasParking !== filters.hasParking) return false;

        // Amenities
        if (filters.selectedAmenities.length > 0) {
          const propAmenities = prop.amenities.map(a => a.toLowerCase());
          const hasAll = filters.selectedAmenities.every(a => propAmenities.includes(a.toLowerCase()));
          if (!hasAll) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'MATCH_SCORE') {
          const scoreA = PropertyMatchingEngine.calculateMatch(a, preferences).totalScore;
          const scoreB = PropertyMatchingEngine.calculateMatch(b, preferences).totalScore;
          return scoreB - scoreA;
        }
        if (filters.sortBy === 'PRICE_ASC') return a.monthlyRent - b.monthlyRent;
        if (filters.sortBy === 'PRICE_DESC') return b.monthlyRent - a.monthlyRent;
        if (filters.sortBy === 'QUALITY_SCORE') {
          const qA = ListingQualityService.evaluate(a).score;
          const qB = ListingQualityService.evaluate(b).score;
          return qB - qA;
        }
        if (filters.sortBy === 'POPULARITY') return (b.viewsCount + b.inquiriesCount * 3) - (a.viewsCount + a.inquiriesCount * 3);
        if (filters.sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
      });
  }, [properties, filters, preferences, currentUser]);

  // Top smart recommendations ranked
  const topRecommendations = useMemo(() => {
    return properties
      .filter(p => p.isAvailable)
      .map(property => ({
        property,
        match: PropertyMatchingEngine.calculateMatch(property, preferences)
      }))
      .sort((a, b) => b.match.totalScore - a.match.totalScore);
  }, [properties, preferences]);

  const openModal = (name: string, data?: any) => {
    setActiveModal(name);
    setModalData(data || null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  const addLease = (lease: Omit<LeaseAgreement, 'id'>) => {
    const newLease: LeaseAgreement = {
      ...lease,
      id: `lease-${Date.now().toString().slice(-4)}`
    };
    setLeases(prev => [newLease, ...prev]);
    addToast('success', `Created active lease agreement for ${lease.tenantName}`);
  };

  const updateLeaseStatus = (id: string, status: LeaseAgreement['status'], paymentStatus?: LeaseAgreement['paymentStatus']) => {
    setLeases(prev => prev.map(l => l.id === id ? {
      ...l,
      status,
      paymentStatus: paymentStatus || l.paymentStatus
    } : l));
    addToast('info', `Lease status updated to ${status}`);
  };

  const recordPayment = (paymentData: Omit<RentPayment, 'id' | 'receiptNumber' | 'status'>): RentPayment => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `RW-REC-${dateStr}-${randSuffix}`;

    const newPayment: RentPayment = {
      ...paymentData,
      id: `pay-${Date.now().toString().slice(-4)}`,
      receiptNumber,
      status: 'VERIFIED'
    };

    setPayments(prev => [newPayment, ...prev]);

    // Update lease payment status if found
    if (paymentData.leaseId) {
      setLeases(prev => prev.map(l => l.id === paymentData.leaseId ? {
        ...l,
        lastPaymentDate: paymentData.paymentDate,
        paymentStatus: 'PAID'
      } : l));
    }

    addToast('success', `Logged ${paymentData.amountRwf.toLocaleString()} RWF rent payment (Receipt #${receiptNumber})`);
    return newPayment;
  };

  const addMaintenanceTicket = (ticket: Omit<MaintenanceTicket, 'id' | 'reportedDate' | 'status'>) => {
    const newTicket: MaintenanceTicket = {
      ...ticket,
      id: `maint-${Date.now().toString().slice(-4)}`,
      status: 'REPORTED',
      reportedDate: new Date().toISOString().slice(0, 10)
    };
    setMaintenanceTickets(prev => [newTicket, ...prev]);
    addToast('success', `Maintenance request "${ticket.title}" registered successfully`);
  };

  const updateMaintenanceTicket = (id: string, updates: Partial<MaintenanceTicket>) => {
    setMaintenanceTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    addToast('info', 'Maintenance ticket updated.');
  };

  const resetAllSeedData = () => {
    localStorage.removeItem('smartrental_user');
    localStorage.removeItem('smartrental_preferences');
    localStorage.removeItem('smartrental_properties');
    localStorage.removeItem('smartrental_favorites');
    localStorage.removeItem('smartrental_viewings');
    localStorage.removeItem('smartrental_inquiries');
    localStorage.removeItem('smartrental_reports');
    localStorage.removeItem('smartrental_leases');
    localStorage.removeItem('smartrental_payments');
    localStorage.removeItem('smartrental_maintenance');
    setAuthToken(null);

    setCurrentUser(SEED_USERS[0]);
    setAllUsers(SEED_USERS);
    setPreferences(INITIAL_TENANT_PREFERENCES);
    setProperties(SEED_PROPERTIES);
    setFavorites(['prop-001', 'prop-011']);
    setViewings(SEED_VIEWINGS);
    setInquiries(SEED_INQUIRIES);
    setReports(SEED_REPORTS);
    setLeases(SEED_LEASES);
    setPayments(SEED_PAYMENTS);
    setMaintenanceTickets(SEED_MAINTENANCE_TICKETS);
    setFilters(INITIAL_FILTERS);

    addToast('success', 'Reset all platform data to fresh seed dataset!');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        allUsers,
        backendStatus,
        preferences,
        updatePreferences,
        properties,
        addProperty,
        updateProperty,
        deleteProperty,
        togglePropertyAvailability,
        toggleAvailability: togglePropertyAvailability,
        favorites,
        toggleFavorite,
        isFavorite,
        viewings,
        viewingRequests: viewings,
        createViewingRequest,
        updateViewingStatus,
        inquiries,
        sendInquiry,
        replyInquiry,
        reports,
        submitReport,
        updateReportStatus,
        leases,
        addLease,
        updateLeaseStatus,
        payments,
        recordPayment,
        maintenanceTickets,
        addMaintenanceTicket,
        updateMaintenanceTicket,
        filters,
        setFilters,
        resetFilters,
        getMatchExplanation,
        getListingQuality,
        getAffordability,
        filteredAndSortedProperties,
        topRecommendations,
        currentTab,
        setCurrentTab,
        activeModal,
        modalData,
        openModal,
        closeModal,
        toasts,
        addToast,
        removeToast,
        resetAllSeedData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
