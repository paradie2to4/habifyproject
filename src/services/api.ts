import { Property, PropertyType, Role, User, ViewingRequest, Inquiry } from '../types';
import { RWANDA_LOCATIONS_DATA } from '../data/rwandaLocations';
import { normalizeImageList } from '../utils/images';

/** e.g. `/api` (local Vite proxy) or `https://habify-api.onrender.com/api` (Vercel → Render) */
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api';

function healthUrl(): string {
  if (API_BASE.startsWith('http')) {
    return `${API_BASE.replace(/\/api$/i, '')}/actuator/health`;
  }
  return '/actuator/health';
}

export type BackendStatus = 'connecting' | 'online' | 'offline';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem('smartrental_token');
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem('smartrental_token', token);
  else localStorage.removeItem('smartrental_token');
}

export function getAuthToken(): string | null {
  return getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
      else if (typeof body === 'string') message = body;
    } catch {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        /* ignore */
      }
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function splitCsv(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

function toIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0] = value as number[];
    return new Date(y, m - 1, d, h, min, s).toISOString();
  }
  return String(value);
}

function bool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value == null) return fallback;
  return Boolean(value);
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Raw property shape from Spring Boot (amenities/images as CSV strings). */
export interface BackendProperty {
  id?: string;
  landlordId?: string;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  landlordAvatar?: string;
  title?: string;
  description?: string;
  locationSector?: string;
  address?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  isFurnished?: boolean;
  furnished?: boolean;
  hasParking?: boolean;
  isAvailable?: boolean;
  available?: boolean;
  featured?: boolean;
  viewsCount?: number;
  latitude?: number;
  longitude?: number;
  amenities?: string | string[];
  images?: string | string[];
  createdAt?: string | number[];
}

export interface BackendUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive?: boolean;
  active?: boolean;
  createdAt?: string | number[];
  passwordHash?: string;
}

export interface AuthResponse {
  token: string;
  tokenType?: string;
  user: BackendUser;
}

export function mapBackendUser(raw: BackendUser): User {
  return {
    id: raw.id,
    email: raw.email,
    fullName: raw.fullName,
    role: (raw.role || 'TENANT').toUpperCase() as Role,
    phoneNumber: raw.phoneNumber,
    avatarUrl: raw.avatarUrl,
    isActive: bool(raw.isActive ?? raw.active, true),
    createdAt: toIso(raw.createdAt)
  };
}

export function mapBackendProperty(raw: BackendProperty): Property {
  const sector = raw.locationSector || '';
  const loc = RWANDA_LOCATIONS_DATA[sector];
  const now = new Date().toISOString();
  const amenities = splitCsv(raw.amenities);
  const images = normalizeImageList(raw.images, raw.id || raw.title || '');

  return {
    id: raw.id || `prop-${Date.now()}`,
    landlordId: raw.landlordId || '',
    landlordName: raw.landlordName || 'Landlord',
    landlordPhone: raw.landlordPhone,
    landlordEmail: raw.landlordEmail,
    landlordAvatar: raw.landlordAvatar,
    title: raw.title || 'Untitled property',
    description: raw.description || '',
    locationSector: sector,
    province: loc?.province,
    district: loc?.district,
    address: raw.address || sector,
    monthlyRent: num(raw.monthlyRent),
    securityDeposit: num(raw.securityDeposit, num(raw.monthlyRent)),
    propertyType: (raw.propertyType || 'APARTMENT') as PropertyType,
    bedrooms: num(raw.bedrooms, 1),
    bathrooms: num(raw.bathrooms, 1),
    sizeSqm: num(raw.sizeSqm),
    isFurnished: bool(raw.isFurnished ?? raw.furnished),
    hasParking: bool(raw.hasParking),
    amenities,
    images,
    isAvailable: bool(raw.isAvailable ?? raw.available, true),
    featured: bool(raw.featured),
    latitude: num(raw.latitude, loc?.lat ?? 0),
    longitude: num(raw.longitude, loc?.lng ?? 0),
    viewsCount: num(raw.viewsCount),
    inquiriesCount: 0,
    createdAt: toIso(raw.createdAt),
    updatedAt: now
  };
}

export function toBackendProperty(property: Partial<Property> & { title: string }): Record<string, unknown> {
  return {
    id: property.id,
    landlordId: property.landlordId,
    landlordName: property.landlordName,
    landlordPhone: property.landlordPhone,
    landlordEmail: property.landlordEmail,
    landlordAvatar: property.landlordAvatar,
    title: property.title,
    description: property.description ?? '',
    locationSector: property.locationSector,
    address: property.address,
    monthlyRent: property.monthlyRent,
    securityDeposit: property.securityDeposit,
    propertyType: property.propertyType,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sizeSqm: property.sizeSqm,
    isFurnished: property.isFurnished,
    hasParking: property.hasParking,
    isAvailable: property.isAvailable ?? true,
    featured: property.featured ?? false,
    viewsCount: property.viewsCount ?? 0,
    latitude: property.latitude,
    longitude: property.longitude,
    amenities: Array.isArray(property.amenities) ? property.amenities.join(',') : property.amenities,
    images: Array.isArray(property.images) ? property.images.join(',') : property.images
  };
}

export async function checkBackendHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(healthUrl(), { signal: controller.signal });
    if (!res.ok) return false;
    const body = await res.json().catch(() => null);
    return !body?.status || body.status === 'UP';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchProperties(params?: {
  sector?: string;
  propType?: string;
  maxPrice?: number;
  minBeds?: number;
  furnished?: boolean;
}): Promise<Property[]> {
  const query = new URLSearchParams();
  if (params?.sector) query.set('sector', params.sector);
  if (params?.propType) query.set('propType', params.propType);
  if (params?.maxPrice != null) query.set('maxPrice', String(params.maxPrice));
  if (params?.minBeds != null) query.set('minBeds', String(params.minBeds));
  if (params?.furnished != null) query.set('furnished', String(params.furnished));
  const qs = query.toString();
  const data = await request<BackendProperty[]>(`/properties${qs ? `?${qs}` : ''}`);
  return (data || []).map(mapBackendProperty);
}

export async function createPropertyApi(property: Partial<Property> & { title: string }): Promise<Property> {
  const data = await request<BackendProperty>('/properties', {
    method: 'POST',
    body: JSON.stringify(toBackendProperty(property))
  });
  return mapBackendProperty(data);
}

export async function updatePropertyApi(id: string, property: Partial<Property> & { title: string }): Promise<Property> {
  const data = await request<BackendProperty>(`/properties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toBackendProperty({ ...property, id }))
  });
  return mapBackendProperty(data);
}

export async function deletePropertyApi(id: string): Promise<void> {
  await request<void>(`/properties/${id}`, { method: 'DELETE' });
}

export async function loginApi(email: string, password: string): Promise<{ token: string; user: User }> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  setAuthToken(data.token);
  return { token: data.token, user: mapBackendUser(data.user) };
}

export async function registerApi(payload: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  role: Role;
}): Promise<{ token: string; user: User }> {
  const data = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  setAuthToken(data.token);
  return { token: data.token, user: mapBackendUser(data.user) };
}

export async function createViewingRequestApi(req: Omit<ViewingRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<void> {
  await request('/viewing-requests', {
    method: 'POST',
    body: JSON.stringify({
      propertyId: req.propertyId,
      propertyTitle: req.propertyTitle,
      propertyLocation: req.propertyLocation,
      propertyRent: req.propertyRent,
      propertyImage: req.propertyImage,
      tenantId: req.tenantId,
      tenantName: req.tenantName,
      tenantEmail: req.tenantEmail,
      tenantPhone: req.tenantPhone,
      landlordId: req.landlordId,
      requestedDate: req.requestedDate,
      requestedTimeSlot: req.requestedTimeSlot,
      notes: req.notes,
      status: 'PENDING'
    })
  });
}

export async function createInquiryApi(inq: Omit<Inquiry, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
  await request('/inquiries', {
    method: 'POST',
    body: JSON.stringify({
      propertyId: inq.propertyId,
      propertyTitle: inq.propertyTitle,
      propertyImage: inq.propertyImage,
      propertyLocation: inq.propertyLocation,
      tenantId: inq.tenantId,
      tenantName: inq.tenantName,
      tenantEmail: inq.tenantEmail,
      landlordId: inq.landlordId,
      landlordName: inq.landlordName,
      subject: inq.subject,
      message: inq.message,
      status: 'UNREAD'
    })
  });
}
