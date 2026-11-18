import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, LoaderCircle, Smartphone, X, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LeaseAgreement } from '../types';
import {
  checkMomoPaymentApi,
  MomoPayment,
  MomoProvider,
  MomoStatus,
  providerForPhone,
  requestMomoPaymentApi
} from '../services/featuresApi';

const NAMES: Record<MomoProvider, string> = { MTN: 'MTN MoMo', AIRTEL: 'Airtel Money' };
const thisMonth = () => new Date().toISOString().slice(0, 7);

/** Pay rent from your phone: we send a request, you approve it with your PIN, the receipt appears here. */
export const MobileMoneyPayModal: React.FC<{
  lease: LeaseAgreement;
  status: MomoStatus;
  onClose: () => void;
  onPaid: (paymentId: string) => void;
}> = ({ lease, status, onClose, onPaid }) => {
  const { currentUser, refreshFromServer } = useApp();
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
  const guess = providerForPhone(phone);
  const [provider, setProvider] = useState<MomoProvider>(status.mtn ? 'MTN' : 'AIRTEL');
  const [amount, setAmount] = useState(lease.monthlyRent);
  const [period, setPeriod] = useState(thisMonth());
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<MomoPayment | null>(null);
  const [sending, setSending] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  // Pick the network from the number as the tenant types
  useEffect(() => {
    if (guess && status[guess === 'MTN' ? 'mtn' : 'airtel']) setProvider(guess);
  }, [guess, status]);

  // Poll until approved, declined or expired
  useEffect(() => {
    if (!payment || payment.providerStatus !== 'REQUESTED') return;
    timer.current = window.setTimeout(async () => {
      try {
        const p = await checkMomoPaymentApi(payment.id);
        setPayment(p);
        if (p.status === 'VERIFIED') {
          await refreshFromServer();
          onPaidRef.current(p.id);
        }
      } catch {
        setPayment({ ...payment }); // try again on the next tick
      }
    }, 4000);
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  const mismatch = guess && guess !== provider;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      setPayment(await requestMomoPaymentApi({ leaseId: lease.id, provider, phone, amount, period }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const close = () => {
    window.clearTimeout(timer.current);
    if (payment) refreshFromServer();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-[3px] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Pay rent with mobile money" onKeyDown={e => e.key === 'Escape' && close()}>
      <div className="animate-pop bg-white rounded-3xl max-w-md w-full border border-stone-200 overflow-hidden my-6 text-left">
        <div className="flex items-center justify-between px-6 h-16 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-ink-900">Pay rent by phone</h2>
          <button type="button" onClick={close} className="w-9 h-9 rounded-full inline-flex items-center justify-center hover:bg-stone-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!payment ? (
          <form onSubmit={submit} className="p-6 space-y-4">
            {status.testMode && (
              <p className="text-xs text-saffron-900 bg-saffron-50 border border-saffron-200 rounded-lg px-3 py-2">
                Test mode: no real money moves.
              </p>
            )}
            <fieldset>
              <legend className="text-label block mb-1.5">Network</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['MTN', 'AIRTEL'] as MomoProvider[]).map(p => {
                  const on = provider === p;
                  const enabled = status[p === 'MTN' ? 'mtn' : 'airtel'];
                  return (
                    <label
                      key={p}
                      className={`h-12 rounded-xl border inline-flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer transition-colors ${
                        !enabled ? 'opacity-40 cursor-not-allowed' : on ? 'border-tea-700 bg-tea-50 text-tea-800 ring-2 ring-tea-600/20' : 'border-stone-300 text-ink-800 hover:border-ink-400'
                      }`}
                    >
                      <input type="radio" name="provider" value={p} checked={on} disabled={!enabled} onChange={() => setProvider(p)} className="sr-only" />
                      <span className={`w-2.5 h-2.5 rounded-full ${p === 'MTN' ? 'bg-[#FFCB05]' : 'bg-[#E40000]'}`} aria-hidden />
                      {NAMES[p]}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="momo-phone" className="text-label block mb-1.5">Phone number that pays</label>
              <input id="momo-phone" type="tel" inputMode="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder={provider === 'MTN' ? '078 123 4567' : '073 123 4567'} className="input-base tabular-nums" />
              {mismatch && <p className="mt-1 text-xs text-saffron-900">That looks like an {NAMES[guess!]} number.</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="momo-amount" className="text-label block mb-1.5">Amount (RWF)</label>
                <input id="momo-amount" type="number" min={100} step={1} required value={amount} onChange={e => setAmount(Number(e.target.value))} className="input-base tabular-nums" />
              </div>
              <div>
                <label htmlFor="momo-month" className="text-label block mb-1.5">For the month of</label>
                <input id="momo-month" type="month" required value={period} onChange={e => setPeriod(e.target.value)} className="input-base" />
              </div>
            </div>

            {error && <p className="text-sm text-red-700" role="alert">{error}</p>}

            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={close} className="btn-ghost rounded-full">Cancel</button>
              <button type="submit" disabled={sending || !phone.trim() || amount < 100} className="btn-primary rounded-full">
                {sending ? 'Sending…' : `Send ${Math.round(amount).toLocaleString()} RWF request`}
              </button>
            </div>
          </form>
        ) : payment.providerStatus === 'REQUESTED' ? (
          <div className="p-8 text-center" aria-live="polite">
            <span className="relative mx-auto w-16 h-16 rounded-2xl bg-tea-50 text-tea-700 inline-flex items-center justify-center">
              <Smartphone className="w-8 h-8" />
              <LoaderCircle className="w-5 h-5 absolute -right-1.5 -bottom-1.5 animate-spin text-saffron-600 bg-white rounded-full" />
            </span>
            <h3 className="mt-4 font-display text-xl font-bold text-ink-900">Check your phone</h3>
            <p className="mt-2 text-sm text-stone-600">
              Approve the {NAMES[payment.paymentMethod === 'AIRTEL_MONEY' ? 'AIRTEL' : 'MTN']} request for{' '}
              <strong className="text-ink-900">{Math.round(payment.amountRwf).toLocaleString()} RWF</strong> with your PIN. This page updates by itself.
            </p>
            <p className="mt-4 text-xs text-stone-500">No prompt after a minute? Open your mobile-money menu and look for pending approvals. Requests expire after 30 minutes.</p>
          </div>
        ) : payment.status === 'VERIFIED' ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-14 h-14 mx-auto text-tea-700" />
            <h3 className="mt-3 font-display text-xl font-bold text-ink-900">Paid</h3>
            <p className="mt-1 text-sm text-stone-600">Receipt {payment.receiptNumber}. Your landlord has been told.</p>
          </div>
        ) : (
          <div className="p-8 text-center">
            <XCircle className="w-14 h-14 mx-auto text-red-700" />
            <h3 className="mt-3 font-display text-xl font-bold text-ink-900">Payment didn’t go through</h3>
            <p className="mt-1 text-sm text-stone-600">{payment.failureReason || 'It was declined or cancelled.'} No money was taken.</p>
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" onClick={close} className="btn-ghost rounded-full">Close</button>
              <button type="button" onClick={() => setPayment(null)} className="btn-primary rounded-full">Try again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
