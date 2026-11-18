/**
 * API calls for notifications, conversations, account, tenancy (leases, payments, repairs) and uploads.
 */
import {
  AppNotification,
  LeaseAgreement,
  MaintenanceTicket,
  RentPayment,
  ThreadMessage,
  User
} from '../types';
import { mapBackendUser, request, splitCsv, toIso, num } from './api';

type Raw = Record<string, any>;

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

const mapNotification = (n: Raw): AppNotification => ({
  id: n.id,
  type: n.type,
  title: n.title,
  body: n.body || undefined,
  link: n.link || undefined,
  readAt: n.readAt ? toIso(n.readAt) : undefined,
  createdAt: toIso(n.createdAt)
});

export async function fetchNotificationsApi(): Promise<{ items: AppNotification[]; unread: number }> {
  const data = await request<{ items: Raw[]; unread: number }>('/notifications?limit=40');
  return { items: (data.items || []).map(mapNotification), unread: data.unread ?? 0 };
}

export const markNotificationReadApi = (id: string) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsReadApi = () => request('/notifications/read-all', { method: 'POST' });

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

const mapMessage = (m: Raw): ThreadMessage => ({
  id: m.id,
  inquiryId: m.inquiryId,
  senderId: m.senderId,
  senderName: m.senderName || undefined,
  senderRole: (m.senderRole || 'TENANT') as ThreadMessage['senderRole'],
  body: m.body,
  createdAt: toIso(m.createdAt),
  readAt: m.readAt ? toIso(m.readAt) : undefined
});

export async function fetchThreadApi(inquiryId: string): Promise<ThreadMessage[]> {
  return ((await request<Raw[]>(`/inquiries/${inquiryId}/messages`)) || []).map(mapMessage);
}

export async function sendThreadMessageApi(inquiryId: string, body: string): Promise<ThreadMessage> {
  return mapMessage(await request<Raw>(`/inquiries/${inquiryId}/messages`, { method: 'POST', body: JSON.stringify({ body }) }));
}

export const markThreadReadApi = (inquiryId: string) => request(`/inquiries/${inquiryId}/read`, { method: 'POST' });

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export async function updateProfileApi(fields: { fullName?: string; phoneNumber?: string; avatarUrl?: string }): Promise<User> {
  return mapBackendUser(await request('/auth/me', { method: 'PUT', body: JSON.stringify(fields) }));
}

export const changePasswordApi = (currentPassword: string, newPassword: string) =>
  request('/auth/password/change', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });

export const forgotPasswordApi = (email: string) =>
  request<{ message: string }>('/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email }) });

export const resetPasswordApi = (token: string, newPassword: string) =>
  request('/auth/password/reset', { method: 'POST', body: JSON.stringify({ token, newPassword }) });

export const sendVerificationApi = () => request('/auth/verify/send', { method: 'POST' });

export async function confirmVerificationApi(token: string): Promise<User> {
  return mapBackendUser(await request('/auth/verify/confirm', { method: 'POST', body: JSON.stringify({ token }) }));
}

// ---------------------------------------------------------------------------
// Leases, payments, repairs
// ---------------------------------------------------------------------------

const mapLease = (l: Raw): LeaseAgreement => ({
  id: l.id,
  propertyId: l.propertyId,
  propertyTitle: l.propertyTitle || '',
  propertyAddress: l.propertyAddress || '',
  propertySector: l.propertySector || '',
  tenantId: l.tenantId || '',
  tenantName: l.tenantName,
  tenantPhone: l.tenantPhone || '',
  tenantEmail: l.tenantEmail || '',
  landlordId: l.landlordId,
  landlordName: l.landlordName || undefined,
  monthlyRent: num(l.monthlyRent),
  securityDeposit: num(l.securityDeposit),
  startDate: l.startDate,
  endDate: l.endDate || '',
  paymentDueDay: num(l.paymentDueDay, 5),
  status: l.status,
  lastPaymentDate: l.lastPaymentDate || undefined,
  paymentStatus: l.paymentStatus || 'DUE'
});

const mapPayment = (p: Raw): RentPayment => ({
  id: p.id,
  receiptNumber: p.receiptNumber,
  leaseId: p.leaseId,
  propertyId: p.propertyId || '',
  propertyTitle: p.propertyTitle || '',
  tenantName: p.tenantName || '',
  tenantId: p.tenantId || undefined,
  landlordId: p.landlordId || undefined,
  landlordName: p.landlordName || '',
  amountRwf: num(p.amountRwf),
  paymentMethod: p.paymentMethod,
  transactionReference: p.transactionReference || '',
  paidForMonth: p.paidForMonth || '',
  period: p.period || undefined,
  paymentDate: p.paymentDate || '',
  status: p.status,
  notes: p.notes || undefined
});

const mapTicket = (t: Raw): MaintenanceTicket => ({
  id: t.id,
  propertyId: t.propertyId,
  propertyTitle: t.propertyTitle || '',
  propertySector: t.propertySector || '',
  tenantName: t.tenantName || undefined,
  tenantId: t.tenantId || undefined,
  landlordId: t.landlordId || undefined,
  reportedBy: t.reportedBy || undefined,
  photos: splitCsv(t.photos),
  landlordNotes: t.landlordNotes || undefined,
  category: t.category || 'PLUMBING',
  title: t.title,
  description: t.description || '',
  priority: t.priority || 'MEDIUM',
  estimatedCostRwf: num(t.estimatedCostRwf),
  actualCostRwf: t.actualCostRwf != null ? num(t.actualCostRwf) : undefined,
  status: t.status,
  contractorName: t.contractorName || undefined,
  reportedDate: t.reportedDate || '',
  resolvedDate: t.resolvedDate || undefined
});

export async function fetchTenancyApi(): Promise<{ leases: LeaseAgreement[]; payments: RentPayment[]; tickets: MaintenanceTicket[] }> {
  const [leases, payments, tickets] = await Promise.all([
    request<Raw[]>('/leases'),
    request<Raw[]>('/payments'),
    request<Raw[]>('/maintenance')
  ]);
  return { leases: (leases || []).map(mapLease), payments: (payments || []).map(mapPayment), tickets: (tickets || []).map(mapTicket) };
}

export async function createLeaseApi(body: Raw): Promise<LeaseAgreement> {
  return mapLease(await request('/leases', { method: 'POST', body: JSON.stringify(body) }));
}

export async function updateLeaseApi(id: string, body: Raw): Promise<LeaseAgreement> {
  return mapLease(await request(`/leases/${id}`, { method: 'PATCH', body: JSON.stringify(body) }));
}

export async function recordPaymentApi(body: Raw): Promise<RentPayment> {
  return mapPayment(await request('/payments', { method: 'POST', body: JSON.stringify(body) }));
}

export async function confirmPaymentApi(id: string): Promise<RentPayment> {
  return mapPayment(await request(`/payments/${id}/confirm`, { method: 'POST' }));
}

export async function createTicketApi(body: Raw): Promise<MaintenanceTicket> {
  return mapTicket(await request('/maintenance', { method: 'POST', body: JSON.stringify(body) }));
}

export async function updateTicketApi(id: string, body: Raw): Promise<MaintenanceTicket> {
  return mapTicket(await request(`/maintenance/${id}`, { method: 'PATCH', body: JSON.stringify(body) }));
}

// ---------------------------------------------------------------------------
// Photo uploads
// ---------------------------------------------------------------------------

export type UploadFolder = 'listings' | 'avatars' | 'maintenance';

interface UploadTicket {
  provider: 'cloudinary' | 'server';
  cloudName?: string;
  apiKey?: string;
  timestamp?: number;
  folder?: string;
  signature?: string;
  uploadUrl?: string;
}

/** Shrink a photo in the browser before upload: max 1600px on the long side, JPEG ~82%. */
export async function resizeImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Use a JPEG, PNG or WebP photo');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('That photo couldn’t be read');
  });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser can’t process photos');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error('That photo couldn’t be processed');
  return blob;
}

/** Resize and upload one photo; returns its public URL. Uses Cloudinary when the server is configured for it. */
export async function uploadImage(file: File, folder: UploadFolder, onProgress?: (pct: number) => void): Promise<string> {
  const blob = await resizeImage(file, folder === 'avatars' ? 512 : 1600);
  const ticket = await request<UploadTicket>(`/uploads/signature?folder=${folder}`);
  onProgress?.(15);

  if (ticket.provider === 'cloudinary' && ticket.uploadUrl) {
    const form = new FormData();
    form.append('file', blob, 'photo.jpg');
    form.append('api_key', ticket.apiKey!);
    form.append('timestamp', String(ticket.timestamp));
    form.append('folder', ticket.folder!);
    form.append('signature', ticket.signature!);
    const res = await fetch(ticket.uploadUrl, { method: 'POST', body: form });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.secure_url) throw new Error(data?.error?.message || 'Upload failed');
    onProgress?.(100);
    return data.secure_url as string;
  }

  const form = new FormData();
  form.append('file', blob, 'photo.jpg');
  const data = await request<{ url: string }>('/uploads', { method: 'POST', body: form });
  onProgress?.(100);
  return data.url;
}
