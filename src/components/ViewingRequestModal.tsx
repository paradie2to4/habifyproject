import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Property } from '../types';
import {
  Calendar,
  X,
  Clock,
  MapPin,
  CheckCircle2,
  Phone,
  User,
  MessageSquare
} from 'lucide-react';
import { SlotPicker, clockLabel } from './ViewingCalendar';

interface ViewingRequestModalProps {
  property: Property;
}

const TIME_SLOTS = [
  '09:00 - 10:00 AM',
  '10:30 - 11:30 AM',
  '02:00 - 03:00 PM',
  '04:00 - 05:00 PM',
  '05:30 - 06:30 PM'
];

export const ViewingRequestModal: React.FC<ViewingRequestModalProps> = ({ property }) => {
  const { currentUser, createViewingRequest, closeModal, isLive } = useApp();

  // Pick tomorrow's date by default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  const [requestedDate, setRequestedDate] = useState(minDateStr);
  const [requestedTimeSlot, setRequestedTimeSlot] = useState(TIME_SLOTS[1]);
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
  const [slot, setSlot] = useState<{ date: string; time: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLive && !slot) return;
    if (!requestedDate) return;

    createViewingRequest({
      propertyId: property.id,
      propertyTitle: property.title,
      propertyLocation: property.locationSector,
      propertyRent: property.monthlyRent,
      propertyImage: property.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
      tenantId: currentUser?.id || 'usr-tenant-01',
      tenantName: currentUser?.fullName || 'Claire Mukamana',
      tenantEmail: currentUser?.email || 'tenant@smartrental.rw',
      tenantPhone: phone,
      landlordId: property.landlordId,
      requestedDate: isLive && slot ? slot.date : requestedDate,
      requestedTimeSlot: isLive && slot ? slot.time : requestedTimeSlot,
      notes: notes.trim() ? notes : 'Looking forward to viewing the apartment.'
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-[3px] overflow-y-auto">
      <div
        className="animate-pop bg-white rounded-3xl max-w-lg w-full w-full border border-stone-200 overflow-hidden my-6 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="palette-light topo p-5 sm:p-6 bg-tea-700 text-white flex items-center justify-between border-b border-tea-600">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-tea-700/30 border border-tea-500/40 flex items-center justify-center text-saffron-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Schedule Viewing</h2>
              <p className="text-xs text-stone-400">Request a property tour</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-tea-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-ink-800">
          
          {/* Property Summary Pill */}
          <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-3">
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-14 h-14 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-ink-900 truncate">{property.title}</h4>
              <p className="text-[11px] text-stone-600 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-tea-600" />
                {property.locationSector}
              </p>
              <p className="text-xs font-bold text-tea-600 mt-0.5 font-mono">
                {property.monthlyRent.toLocaleString()} RWF/mo
              </p>
            </div>
          </div>

          {isLive ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-700 mb-2">Pick a time the landlord is free *</p>
              <SlotPicker propertyId={property.id} value={slot} onChange={setSlot} />
              {slot && (
                <p className="mt-2 text-xs text-tea-800 font-semibold">
                  {new Date(slot.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} at {clockLabel(slot.time)}
                </p>
              )}
            </div>
          ) : (
          <>
          {/* Date Picker */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block mb-1">
              Preferred Date *
            </label>
            <input
              type="date"
              required
              min={minDateStr}
              value={requestedDate}
              onChange={e => setRequestedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-tea-500 text-sm font-medium text-ink-900"
            />
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block mb-2">
              Preferred Time Slot *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TIME_SLOTS.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setRequestedTimeSlot(slot)}
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
                    requestedTimeSlot === slot
                      ? 'bg-saffron-50 border-tea-500 text-saffron-900 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-ink-700 hover:bg-stone-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-tea-600" />
                  <span>{slot}</span>
                </button>
              ))}
            </div>
          </div>
          </>
          )}

          {/* Contact Phone */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+250 788 123 456"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-tea-500 text-sm font-medium text-ink-900"
              />
            </div>
          </div>

          {/* Special Notes / Requests */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special requests or questions..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-tea-500 text-xs text-ink-900"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLive && !slot}
              className="disabled:opacity-50 flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold bg-tea-700 hover:bg-tea-800 text-white transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Send Request</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
