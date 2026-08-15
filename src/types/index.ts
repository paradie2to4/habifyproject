export type Role = 'TENANT' | 'LANDLORD' | 'ADMIN';

export type ActiveTab =
  | 'BROWSE'
  | 'RECOMMENDATIONS'
  | 'TENANT_DASHBOARD'
  | 'LANDLORD_DASHBOARD'
  | 'ADMIN_DASHBOARD'
  | 'ADMIN_MAP'
  | 'FAVORITES'
  | 'INQUIRIES'
  | 'LOGIN'
  | 'SIGNUP';

export type PropertyType = 'APARTMENT' | 'HOUSE' | 'VILLA' | 'STUDIO' | 'TOWNHOUSE' | 'DUPLEX';

export type ViewingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export type AffordabilityStatus = 'SAFE' | 'MODERATE' | 'HIGH_BURDEN' | 'UNREALISTIC';

export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TenantPreferences {
  id?: string;
  preferredLocations: string[]; // e.g. ['Kimihurura', 'Kacyiru', 'Nyarutarama']
  maxBudget: number; // in RWF
  minBedrooms: number;
  preferredPropertyTypes: PropertyType[];
  furnishedRequired: boolean;
  parkingRequired: boolean;
  preferredAmenities: string[];
  monthlyIncome: number; // in RWF, used for affordability
  targetLatitude?: number;
  targetLongitude?: number;
  maxDistanceKm?: number;
}

export interface Property {
  id: string;
  landlordId: string;
  landlordName: string;
  landlordPhone?: string;
  landlordAvatar?: string;
  landlordEmail?: string;
  title: string;
  description: string;
  locationSector: string; // Rwanda location/sector (e.g. 'Kimihurura', 'Musanze Town (Muhoza)', 'Rubavu (Gisenyi Beach)')
  province?: string; // e.g. 'Kigali City', 'Northern Province', 'Western Province', 'Southern Province', 'Eastern Province'
  district?: string; // e.g. 'Gasabo', 'Musanze', 'Rubavu', 'Huye', 'Bugesera'
  address: string;
  monthlyRent: number; // in RWF
  securityDeposit: number; // in RWF
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  isFurnished: boolean;
  hasParking: boolean;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
  featured: boolean;
  latitude: number;
  longitude: number;
  viewsCount: number;
  inquiriesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CriteriaMatch {
  criterion: string;
  label: string;
  weightPercentage: number;
  score: number; // 0 - 100 for this criterion
  weightedScore: number;
  status: 'MATCH' | 'PARTIAL' | 'MISMATCH';
  detail: string;
}

export interface MatchScoreExplanation {
  propertyId: string;
  totalScore: number; // 0 - 100
  criteriaBreakdown: CriteriaMatch[];
  matchedReasons: string[];
  improvementSuggestions: string[];
  affordabilityRatio: number;
  affordabilityStatus: AffordabilityStatus;
}

export interface ListingQualityScore {
  propertyId: string;
  score: number; // 0 - 100
  tier: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
  completedItems: string[];
  recommendations: string[];
}

export interface ViewingRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyRent: number;
  propertyImage: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  landlordId: string;
  requestedDate: string;
  requestedTimeSlot: string;
  notes?: string;
  status: ViewingStatus;
  landlordNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  landlordId: string;
  landlordName: string;
  subject: string;
  message: string;
  reply?: string;
  isRead: boolean;
  createdAt: string;
  repliedAt?: string;
}

export interface PropertyReport {
  id: string;
  propertyId: string;
  propertyTitle: string;
  reporterId: string;
  reporterName: string;
  reason: 'MISLEADING_INFO' | 'INCORRECT_PRICING' | 'UNAVAILABLE_LISTING' | 'FRAUD_SUSPICION' | 'OTHER';
  details: string;
  status: ReportStatus;
  adminNotes?: string;
  createdAt: string;
}

export interface AffordabilityAnalysis {
  monthlyIncome: number;
  monthlyRent: number;
  rentToIncomeRatioPercentage: number;
  status: AffordabilityStatus;
  maxRecommendedRent: number;
  remainingIncomeAfterRent: number;
  adviceMessage: string;
}

export interface FilterState {
  searchQuery: string;
  selectedProvince: string;
  selectedDistrict: string;
  selectedLocation: string;
  propertyType: string;
  minPrice: number;
  maxPrice: number;
  minBedrooms: number;
  isFurnished?: boolean;
  hasParking?: boolean;
  selectedAmenities: string[];
  sortBy: 'MATCH_SCORE' | 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST' | 'QUALITY_SCORE' | 'POPULARITY';
}

export interface LeaseAgreement {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  propertySector: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  landlordId: string;
  monthlyRent: number;
  securityDeposit: number;
  startDate: string;
  endDate: string;
  paymentDueDay: number;
  status: 'ACTIVE' | 'PENDING_SIGNATURE' | 'EXPIRED' | 'TERMINATED';
  lastPaymentDate?: string;
  paymentStatus: 'PAID' | 'DUE' | 'OVERDUE';
}

export interface RentPayment {
  id: string;
  receiptNumber: string;
  leaseId: string;
  propertyId: string;
  propertyTitle: string;
  tenantName: string;
  landlordName: string;
  amountRwf: number;
  paymentMethod: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'BK_TRANSFER' | 'IM_BANK' | 'CASH';
  transactionReference: string;
  paidForMonth: string;
  paymentDate: string;
  status: 'VERIFIED' | 'PENDING';
  notes?: string;
}

export interface MaintenanceTicket {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertySector: string;
  tenantName?: string;
  category: 'PLUMBING' | 'ELECTRICAL_SOLAR' | 'WATER_PUMP_TANK' | 'APPLIANCES' | 'STRUCTURAL_PAINTING' | 'INTERNET_SECURITY';
  title: string;
  description: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedCostRwf: number;
  actualCostRwf?: number;
  status: 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  contractorName?: string;
  reportedDate: string;
  resolvedDate?: string;
}
