/**
 * API calls for saved searches, the viewing calendar, shared shortlists, mobile money and the AI assistant.
 */
import { API_BASE, ApiError, getToken, request } from './api';

type Raw = Record<string, any>;

// ---------------------------------------------------------------------------
// Saved searches
// ---------------------------------------------------------------------------

export interface SavedSearch {
  id: string;
  name: string;
  sectors: string[];
  province?: string;
  district?: string;
  propertyType?: string;
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
  furnished?: boolean;
  parking?: boolean;
  amenities: string[];
  alertsEnabled: boolean;
  matchCount?: number;
  createdAt?: string;
}

export interface SearchCriteria {
  name?: string;
  sectors?: string[];
  province?: string;
  district?: string;
  propertyType?: string;
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
  furnished?: boolean;
  parking?: boolean;
  amenities?: string[];
}

const csv = (v: unknown) => (typeof v === 'string' && v ? v.split(',').map(s => s.trim()).filter(Boolean) : Array.isArray(v) ? v : []);

const mapSearch = (s: Raw): SavedSearch => ({
  id: s.id,
  name: s.name,
  sectors: csv(s.sectors),
  province: s.province || undefined,
  district: s.district || undefined,
  propertyType: s.propertyType || undefined,
  minRent: s.minRent ?? undefined,
  maxRent: s.maxRent ?? undefined,
  minBedrooms: s.minBedrooms ?? undefined,
  furnished: s.furnished ?? undefined,
  parking: s.parking ?? undefined,
  amenities: csv(s.amenities),
  alertsEnabled: s.alertsEnabled !== false,
  matchCount: s.matchCount ?? undefined,
  createdAt: s.createdAt
});

export const fetchSavedSearchesApi = async () => ((await request<Raw[]>('/saved-searches')) || []).map(mapSearch);
export const createSavedSearchApi = async (c: SearchCriteria) =>
  mapSearch(await request<Raw>('/saved-searches', { method: 'POST', body: JSON.stringify(c) }));
export const updateSavedSearchApi = async (id: string, fields: { name?: string; alertsEnabled?: boolean }) =>
  mapSearch(await request<Raw>(`/saved-searches/${id}`, { method: 'PATCH', body: JSON.stringify(fields) }));
export const deleteSavedSearchApi = (id: string) => request<void>(`/saved-searches/${id}`, { method: 'DELETE' });

// ---------------------------------------------------------------------------
// Viewing calendar
// ---------------------------------------------------------------------------

export interface Slot { time: string; available: boolean }
export interface SlotDay { date: string; label: string; slots: Slot[] }
export interface AvailabilityWindow { dayOfWeek: number; startTime: string; endTime: string }
export interface Availability { windows: AvailabilityWindow[]; slotMinutes: number; custom: boolean }

export const fetchViewingSlotsApi = (propertyId: string, days = 14, rescheduleId?: string) =>
  request<SlotDay[]>(`/properties/${encodeURIComponent(propertyId)}/viewing-slots?days=${days}${rescheduleId ? `&reschedule=${rescheduleId}` : ''}`);

export async function fetchAvailabilityApi(): Promise<Availability> {
  const r = await request<Raw>('/availability');
  return { windows: r.windows || [], slotMinutes: r.slotMinutes || 60, custom: !!r.custom };
}

export const saveAvailabilityApi = (windows: AvailabilityWindow[], slotMinutes: number) =>
  request<Raw>('/availability', { method: 'PUT', body: JSON.stringify({ windows, slotMinutes }) });

export const rescheduleViewingApi = (id: string, requestedDate: string, requestedTimeSlot: string, note?: string) =>
  request<Raw>(`/viewing-requests/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ requestedDate, requestedTimeSlot, note }) });

/** Downloads the .ics file (needs the sign-in token, so it can't be a plain link). */
export async function downloadViewingCalendarFile(id: string, title = 'viewing') {
  const res = await fetch(`${API_BASE}/viewing-requests/${id}/calendar.ics`, {
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {}
  });
  if (!res.ok) throw new ApiError('Couldn’t create the calendar file', res.status);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = `habify-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---------------------------------------------------------------------------
// Shared shortlists
// ---------------------------------------------------------------------------

export interface ShortlistVote { name: string; value: number; comment?: string; key: string }
export interface ShortlistHome {
  id: string;
  title: string;
  locationSector?: string;
  monthlyRent: number;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  propertyType?: string;
  isAvailable?: boolean;
  image?: string;
  up: number;
  down: number;
  votes: ShortlistVote[];
}
export interface Shortlist {
  id?: string;
  shareToken?: string;
  title: string;
  ownerName: string;
  homes: ShortlistHome[];
  voters: number;
  updatedAt?: string;
}

export const fetchShortlistsApi = () => request<Shortlist[]>('/shortlists');
export const createShortlistApi = (title: string, propertyIds: string[]) =>
  request<Shortlist>('/shortlists', { method: 'POST', body: JSON.stringify({ title, propertyIds }) });
export const updateShortlistApi = (id: string, fields: { title?: string; propertyIds?: string[] }) =>
  request<Shortlist>(`/shortlists/${id}`, { method: 'PUT', body: JSON.stringify(fields) });
export const newShortlistLinkApi = (id: string) => request<Shortlist>(`/shortlists/${id}/new-link`, { method: 'POST' });
export const deleteShortlistApi = (id: string) => request<void>(`/shortlists/${id}`, { method: 'DELETE' });
export const fetchPublicShortlistApi = (token: string) => request<Shortlist>(`/public/shortlists/${encodeURIComponent(token)}`);
export const voteShortlistApi = (token: string, body: { propertyId: string; voterKey: string; voterName: string; value: number; comment?: string }) =>
  request<Shortlist>(`/public/shortlists/${encodeURIComponent(token)}/votes`, { method: 'POST', body: JSON.stringify(body) });

export const shortlistUrl = (token: string) => `${window.location.origin}/s/${token}`;

/** Same as Java's String.hashCode, in hex — matches the server's anonymised voter key. */
export function javaHashHex(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

/** A random id for this browser, so guests can change their own votes. */
export function voterKey(): string {
  const KEY = 'habify_voter_key';
  try {
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return 'session-' + Math.random().toString(16).slice(2).padEnd(24, '0');
  }
}

// ---------------------------------------------------------------------------
// Mobile money
// ---------------------------------------------------------------------------

export type MomoProvider = 'MTN' | 'AIRTEL';
export interface MomoStatus { mtn: boolean; airtel: boolean; testMode: boolean }
export interface MomoPayment {
  id: string;
  status: string;
  providerStatus?: 'REQUESTED' | 'SUCCESSFUL' | 'FAILED';
  receiptNumber?: string;
  amountRwf: number;
  paidForMonth?: string;
  paymentMethod?: string;
  payerPhone?: string;
  failureReason?: string;
}

export const fetchMomoStatusApi = () => request<MomoStatus>('/payments/mobile-money/status');
export const requestMomoPaymentApi = (body: { leaseId: string; provider: MomoProvider; phone: string; amount: number; period: string }) =>
  request<MomoPayment>('/payments/mobile-money', { method: 'POST', body: JSON.stringify(body) });
export const checkMomoPaymentApi = (id: string) => request<MomoPayment>(`/payments/mobile-money/${id}`);

/** Which network a Rwandan number belongs to, if we can tell. */
export function providerForPhone(raw: string): MomoProvider | null {
  const d = raw.replace(/\D/g, '').replace(/^250/, '').replace(/^0/, '');
  if (/^7[89]/.test(d)) return 'MTN';
  if (/^7[23]/.test(d)) return 'AIRTEL';
  return null;
}

// ---------------------------------------------------------------------------
// AI assistant (Claude, on the server)
// ---------------------------------------------------------------------------

export interface AssistantTurn { role: 'user' | 'assistant'; content: string }

let assistantEnabled: Promise<boolean> | null = null;

/** Asks once per page load whether the server-side assistant is switched on. */
export function assistantAvailable(): Promise<boolean> {
  if (!assistantEnabled) {
    assistantEnabled = request<{ enabled: boolean }>('/assistant/status')
      .then(r => !!r.enabled)
      .catch(() => false);
  }
  return assistantEnabled;
}

export const askAssistantApi = (messages: AssistantTurn[], propertyId?: string) =>
  request<{ reply: string; homeIds: string[] }>('/assistant/chat', { method: 'POST', body: JSON.stringify({ messages, propertyId }) });
