import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Receipt, Wrench, X, Printer, CheckCircle2, Clock, LoaderCircle, Smartphone, XCircle } from 'lucide-react';
import { MobileMoneyPayModal } from './MobileMoneyPayModal';
import { fetchMomoStatusApi, MomoStatus } from '../services/featuresApi';
import { useApp } from '../context/AppContext';
import { LeaseAgreement, MaintenanceTicket, RentPayment } from '../types';
import { PhotoUploader } from './PhotoUploader';
import { propertyPath } from '../routes';

const METHODS: Array<[RentPayment['paymentMethod'], string]> = [
  ['MTN_MOMO', 'MTN MoMo'],
  ['AIRTEL_MONEY', 'Airtel Money'],
  ['BK_TRANSFER', 'Bank of Kigali transfer'],
  ['IM_BANK', 'I&M Bank transfer'],
  ['CASH', 'Cash']
];
const CATEGORIES: Array<[MaintenanceTicket['category'], string]> = [
  ['PLUMBING', 'Plumbing / leaks'],
  ['ELECTRICAL_SOLAR', 'Electricity / solar'],
  ['WATER_PUMP_TANK', 'Water tank / pump'],
  ['APPLIANCES', 'Appliances'],
  ['STRUCTURAL_PAINTING', 'Walls, roof, doors'],
  ['INTERNET_SECURITY', 'Internet / security']
];
const TICKET_STATUS: Record<MaintenanceTicket['status'], { label: string; tone: string }> = {
  REPORTED: { label: 'Sent to landlord', tone: 'bg-saffron-100 text-saffron-800' },
  IN_PROGRESS: { label: 'Being fixed', tone: 'bg-tea-50 text-tea-800' },
  RESOLVED: { label: 'Fixed', tone: 'bg-tea-700 text-white' },
  CANCELLED: { label: 'Closed', tone: 'bg-stone-100 text-ink-700' }
};

const thisMonth = () => new Date().toISOString().slice(0, 7);
const rwf = (n: number) => `${Math.round(n).toLocaleString()} RWF`;

function nextDue(lease: LeaseAgreement): Date {
  const now = new Date();
  const due = new Date(now.getFullYear(), now.getMonth(), Math.min(lease.paymentDueDay || 5, 28));
  return lease.paymentStatus === 'PAID' ? new Date(now.getFullYear(), now.getMonth() + 1, Math.min(lease.paymentDueDay || 5, 28)) : due;
}

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-[3px] overflow-y-auto" role="dialog" aria-modal="true" aria-label={title} onKeyDown={e => e.key === 'Escape' && onClose()}>
    <div className="animate-pop bg-white rounded-3xl max-w-lg w-full border border-stone-200 overflow-hidden my-6 text-left">
      <div className="flex items-center justify-between px-6 h-16 border-b border-stone-200">
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
        <button type="button" onClick={onClose} className="w-9 h-9 rounded-full inline-flex items-center justify-center hover:bg-stone-100" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

/** The tenant's side of renting: lease, rent, receipts and repairs. */
export const TenantHomeSection: React.FC = () => {
  const { currentUser, leases, payments, maintenanceTickets, recordPayment, addMaintenanceTicket, updateMaintenanceTicket, isLive } = useApp();
  const navigate = useNavigate();
  const [paying, setPaying] = useState<LeaseAgreement | null>(null);
  const [reporting, setReporting] = useState<LeaseAgreement | null>(null);
  const [receipt, setReceipt] = useState<RentPayment | null>(null);
  const [momo, setMomo] = useState<MomoStatus | null>(null);
  const [momoLease, setMomoLease] = useState<LeaseAgreement | null>(null);
  const [paidId, setPaidId] = useState<string | null>(null);

  const hasLease = !!currentUser && isLive && leases.some(l => l.tenantId === currentUser.id && l.status === 'ACTIVE');
  useEffect(() => {
    if (!hasLease) return;
    fetchMomoStatusApi().then(setMomo).catch(() => setMomo(null));
  }, [hasLease]);

  // Open the receipt as soon as a mobile-money payment lands in the list
  useEffect(() => {
    if (!paidId) return;
    const p = payments.find(x => x.id === paidId && x.status === 'VERIFIED');
    if (p) {
      setMomoLease(null);
      setReceipt(p);
      setPaidId(null);
    }
  }, [paidId, payments]);

  if (!currentUser || !isLive) return null;
  const canMomo = !!momo && (momo.mtn || momo.airtel);
  const myLeases = leases.filter(l => l.tenantId === currentUser.id);
  const active = myLeases.filter(l => l.status === 'ACTIVE');
  if (myLeases.length === 0) return null;

  const myPayments = payments.filter(p => myLeases.some(l => l.id === p.leaseId));
  const myTickets = maintenanceTickets.filter(t => t.tenantId === currentUser.id);

  return (
    <section aria-labelledby="your-home" className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="your-home" className="text-section flex items-center gap-2">
            <Home className="w-5 h-5 text-tea-700" /> Your home
          </h2>
          <p className="text-sm text-stone-600 mt-1">Rent, receipts and repairs for the home you rent.</p>
        </div>
      </div>

      {active.map(lease => {
        const due = nextDue(lease);
        const tone =
          lease.paymentStatus === 'PAID' ? 'bg-tea-50 text-tea-800 border-tea-200' : lease.paymentStatus === 'OVERDUE' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-saffron-50 text-saffron-800 border-saffron-200';
        return (
          <div key={lease.id} className="card p-5 sm:p-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] items-center">
            <div className="min-w-0">
              <button type="button" onClick={() => navigate(propertyPath(lease.propertyId))} className="text-lg font-semibold text-ink-900 hover:text-tea-700 text-left">
                {lease.propertyTitle}
              </button>
              <p className="text-sm text-stone-600">
                {lease.propertySector}
                {lease.landlordName ? ` · Landlord: ${lease.landlordName}` : ''}
              </p>
              <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-stone-600">Monthly rent</dt>
                  <dd className="font-display text-xl font-bold text-ink-900 tabular-nums">{lease.monthlyRent.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-600">{lease.paymentStatus === 'PAID' ? 'Next due' : 'Due'}</dt>
                  <dd className="font-semibold text-ink-900">{due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-600">This month</dt>
                  <dd>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${tone}`}>
                      {lease.paymentStatus === 'PAID' ? 'Paid' : lease.paymentStatus === 'OVERDUE' ? 'Overdue' : 'Due'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-600">Lease ends</dt>
                  <dd className="font-semibold text-ink-900">{lease.endDate ? new Date(lease.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Open-ended'}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {canMomo && (
                <button type="button" onClick={() => setMomoLease(lease)} className="btn-primary rounded-full">
                  <Smartphone className="w-4 h-4" /> Pay with mobile money
                </button>
              )}
              <button type="button" onClick={() => setPaying(lease)} className={`${canMomo ? 'btn-secondary' : 'btn-primary'} rounded-full`}>
                <Receipt className="w-4 h-4" /> {canMomo ? 'I paid another way' : 'Report a payment'}
              </button>
              <button type="button" onClick={() => setReporting(lease)} className="btn-secondary rounded-full">
                <Wrench className="w-4 h-4" /> Report a problem
              </button>
            </div>
          </div>
        );
      })}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4 text-tea-700" /> Payments and receipts
          </h3>
          {myPayments.length === 0 ? (
            <p className="text-sm text-stone-600">No payments yet. After you pay, report it here and your landlord will confirm it.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {myPayments.slice(0, 8).map(p => (
                <li key={p.id} className="py-2.5 flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl inline-flex items-center justify-center ${p.status === 'VERIFIED' ? 'bg-tea-50 text-tea-700' : p.status === 'FAILED' ? 'bg-stone-100 text-stone-600' : 'bg-saffron-50 text-saffron-800'}`}>
                    {p.status === 'VERIFIED' ? <CheckCircle2 className="w-4 h-4" /> : p.status === 'FAILED' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink-900">{p.paidForMonth}</span>
                    <span className="block text-xs text-stone-600">
                      {rwf(p.amountRwf)} ·{' '}
                      {p.status === 'VERIFIED'
                        ? p.channel === 'MOBILE_MONEY' ? 'Paid by mobile money' : 'Confirmed'
                        : p.status === 'FAILED'
                          ? 'Not completed'
                          : p.channel === 'MOBILE_MONEY' ? 'Waiting for approval on your phone' : 'Waiting for your landlord'}
                    </span>
                  </span>
                  {p.status === 'VERIFIED' && (
                    <button type="button" onClick={() => setReceipt(p)} className="text-xs font-semibold text-tea-700 hover:text-tea-800">
                      Receipt
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-tea-700" /> Repair requests
          </h3>
          {myTickets.length === 0 ? (
            <p className="text-sm text-stone-600">Something broken? Use “Report a problem” and add photos so your landlord can act quickly.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {myTickets.slice(0, 8).map(t => (
                <li key={t.id} className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900 flex-1 min-w-0 truncate">{t.title}</span>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${TICKET_STATUS[t.status].tone}`}>{TICKET_STATUS[t.status].label}</span>
                  </div>
                  <p className="text-xs text-stone-600">Reported {t.reportedDate}{t.resolvedDate ? ` · fixed ${t.resolvedDate}` : ''}</p>
                  {t.landlordNotes && <p className="mt-1 text-xs text-ink-700">Landlord: {t.landlordNotes}</p>}
                  {t.photos && t.photos.length > 0 && (
                    <div className="mt-2 flex gap-1.5">
                      {t.photos.map(src => (
                        <img key={src} src={src} alt="" className="w-12 h-12 rounded-lg object-cover border border-stone-200" />
                      ))}
                    </div>
                  )}
                  {t.status === 'REPORTED' && (
                    <button type="button" onClick={() => updateMaintenanceTicket(t.id, { status: 'CANCELLED' })} className="mt-1 text-xs font-semibold text-stone-600 hover:text-red-800">
                      Withdraw request
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {momoLease && momo && (
        <MobileMoneyPayModal lease={momoLease} status={momo} onClose={() => setMomoLease(null)} onPaid={id => setPaidId(id)} />
      )}
      {paying && <ReportPaymentModal lease={paying} onClose={() => setPaying(null)} onSave={recordPayment} />}
      {reporting && <ReportProblemModal lease={reporting} onClose={() => setReporting(null)} onSave={addMaintenanceTicket} />}
      {receipt && <ReceiptModal payment={receipt} lease={myLeases.find(l => l.id === receipt.leaseId)} onClose={() => setReceipt(null)} />}
    </section>
  );
};

const ReportPaymentModal: React.FC<{
  lease: LeaseAgreement;
  onClose: () => void;
  onSave: ReturnType<typeof useApp>['recordPayment'];
}> = ({ lease, onClose, onSave }) => {
  const [amount, setAmount] = useState(lease.monthlyRent);
  const [method, setMethod] = useState<RentPayment['paymentMethod']>('MTN_MOMO');
  const [reference, setReference] = useState('');
  const [period, setPeriod] = useState(thisMonth());
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const saved = await onSave({
      leaseId: lease.id,
      propertyId: lease.propertyId,
      propertyTitle: lease.propertyTitle,
      tenantName: lease.tenantName,
      landlordName: lease.landlordName || '',
      amountRwf: amount,
      paymentMethod: method,
      transactionReference: reference.trim(),
      paidForMonth: '',
      period,
      paymentDate: new Date().toISOString().slice(0, 10)
    });
    setSaving(false);
    if (saved) onClose();
  };

  return (
    <Modal title="Report a rent payment" onClose={onClose}>
      <p className="text-sm text-stone-600 -mt-1 mb-5">
        Paid already? Tell your landlord here. Once they confirm it, your official receipt appears in your dashboard.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pay-amount" className="text-label block mb-1.5">Amount (RWF)</label>
            <input id="pay-amount" type="number" min={1} required value={amount} onChange={e => setAmount(Number(e.target.value))} className="input-base tabular-nums" />
          </div>
          <div>
            <label htmlFor="pay-month" className="text-label block mb-1.5">For the month of</label>
            <input id="pay-month" type="month" required value={period} onChange={e => setPeriod(e.target.value)} className="input-base" />
          </div>
        </div>
        <div>
          <label htmlFor="pay-method" className="text-label block mb-1.5">How you paid</label>
          <select id="pay-method" value={method} onChange={e => setMethod(e.target.value as RentPayment['paymentMethod'])} className="input-base">
            {METHODS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pay-ref" className="text-label block mb-1.5">Transaction ID <span className="font-normal text-stone-600">(from your MoMo or bank SMS)</span></label>
          <input id="pay-ref" type="text" value={reference} onChange={e => setReference(e.target.value)} className="input-base" placeholder="e.g. 7812345678" required={method !== 'CASH'} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost rounded-full">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary rounded-full">
            {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : 'Send to landlord'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const ReportProblemModal: React.FC<{
  lease: LeaseAgreement;
  onClose: () => void;
  onSave: ReturnType<typeof useApp>['addMaintenanceTicket'];
}> = ({ lease, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MaintenanceTicket['category']>('PLUMBING');
  const [priority, setPriority] = useState<MaintenanceTicket['priority']>('MEDIUM');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await onSave({
      propertyId: lease.propertyId,
      propertyTitle: lease.propertyTitle,
      propertySector: lease.propertySector,
      tenantName: lease.tenantName,
      category,
      title: title.trim(),
      description: description.trim(),
      priority,
      estimatedCostRwf: 0,
      photos
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal title="Report a problem" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="prob-title" className="text-label block mb-1.5">What’s wrong?</label>
          <input id="prob-title" type="text" required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} className="input-base" placeholder="Kitchen sink is leaking" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="prob-cat" className="text-label block mb-1.5">Type</label>
            <select id="prob-cat" value={category} onChange={e => setCategory(e.target.value as MaintenanceTicket['category'])} className="input-base">
              {CATEGORIES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prob-prio" className="text-label block mb-1.5">How urgent?</label>
            <select id="prob-prio" value={priority} onChange={e => setPriority(e.target.value as MaintenanceTicket['priority'])} className="input-base">
              <option value="URGENT">Urgent — safety or no water/power</option>
              <option value="HIGH">Soon — getting worse</option>
              <option value="MEDIUM">This week</option>
              <option value="LOW">Whenever possible</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="prob-desc" className="text-label block mb-1.5">Details</label>
          <textarea id="prob-desc" rows={3} value={description} onChange={e => setDescription(e.target.value)} className="input-base h-auto py-3 resize-none" placeholder="When did it start? Where exactly?" />
        </div>
        <PhotoUploader value={photos} onChange={setPhotos} folder="maintenance" max={4} label="Photos (optional)" hint="A clear photo helps your landlord send the right person." />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost rounded-full">Cancel</button>
          <button type="submit" disabled={saving || !title.trim()} className="btn-primary rounded-full">
            {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : 'Send to landlord'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const ReceiptModal: React.FC<{ payment: RentPayment; lease?: LeaseAgreement; onClose: () => void }> = ({ payment, lease, onClose }) => (
  <Modal title="Rent receipt" onClose={onClose}>
    <div className="receipt-print rounded-2xl border border-stone-200 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-xl font-bold text-ink-900">habify<span className="text-saffron-500">.</span></p>
          <p className="text-xs text-stone-600">Rent receipt</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-tea-50 text-tea-800 text-xs font-semibold inline-flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
        </span>
      </div>
      <p className="font-mono text-sm text-ink-900">{payment.receiptNumber}</p>
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-stone-600">Amount</dt>
        <dd className="text-right font-display text-lg font-bold text-ink-900">{rwf(payment.amountRwf)}</dd>
        <dt className="text-stone-600">For</dt>
        <dd className="text-right text-ink-900">{payment.paidForMonth}</dd>
        <dt className="text-stone-600">Paid on</dt>
        <dd className="text-right text-ink-900">{payment.paymentDate}</dd>
        <dt className="text-stone-600">Method</dt>
        <dd className="text-right text-ink-900">{METHODS.find(m => m[0] === payment.paymentMethod)?.[1] || payment.paymentMethod}</dd>
        <dt className="text-stone-600">Reference</dt>
        <dd className="text-right font-mono text-ink-900">{payment.transactionReference}</dd>
        <dt className="text-stone-600">Home</dt>
        <dd className="text-right text-ink-900">{payment.propertyTitle}</dd>
        <dt className="text-stone-600">Tenant</dt>
        <dd className="text-right text-ink-900">{payment.tenantName}</dd>
        <dt className="text-stone-600">Landlord</dt>
        <dd className="text-right text-ink-900">{payment.landlordName || lease?.landlordName || '—'}</dd>
      </dl>
    </div>
    <div className="flex justify-end gap-2 mt-5">
      <button type="button" onClick={() => window.print()} className="btn-secondary rounded-full">
        <Printer className="w-4 h-4" /> Print or save PDF
      </button>
      <button type="button" onClick={onClose} className="btn-primary rounded-full">Done</button>
    </div>
  </Modal>
);

