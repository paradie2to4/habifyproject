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
  const { currentUser, createViewingRequest, closeModal } = useApp();

  // Pick tomorrow's date by default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  const [requestedDate, setRequestedDate] = useState(minDateStr);
  const [requestedTimeSlot, setRequestedTimeSlot] = useState(TIME_SLOTS[1]);
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '+250 788 345 678');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      requestedDate,
      requestedTimeSlot,
      notes: notes.trim() ? notes : 'Looking forward to viewing the apartment.'
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-white rounded-xl max-w-lg w-full shadow-xl border border-cream-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-terra-600/30 border border-terra-500/40 flex items-center justify-center text-terra-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Schedule Viewing</h2>
              <p className="text-xs text-cream-400">Request a property tour</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 text-cream-400 hover:text-white rounded-lg hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-navy-800">
          
          {/* Property Summary Pill */}
          <div className="p-3.5 rounded-lg bg-cream-50 border border-cream-200 flex items-center gap-3">
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-14 h-14 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-navy-900 truncate">{property.title}</h4>
              <p className="text-[11px] text-cream-600 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-terra-600" />
                {property.locationSector}
              </p>
              <p className="text-xs font-extrabold text-terra-600 mt-0.5 font-mono">
                {property.monthlyRent.toLocaleString()} RWF/mo
              </p>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block mb-1">
              Preferred Date *
            </label>
            <input
              type="date"
              required
              min={minDateStr}
              value={requestedDate}
              onChange={e => setRequestedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-terra-500 text-sm font-medium text-navy-900"
            />
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block mb-2">
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
                      ? 'bg-terra-50 border-terra-500 text-terra-900 shadow-xs'
                      : 'bg-cream-50 border-cream-200 text-navy-700 hover:bg-cream-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-terra-600" />
                  <span>{slot}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-cream-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+250 788 123 456"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-terra-500 text-sm font-medium text-navy-900"
              />
            </div>
          </div>

          {/* Special Notes / Requests */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special requests or questions..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-terra-500 text-xs text-navy-900"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-cream-200 flex items-center justify-between">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-semibold text-navy-600 hover:text-navy-900"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold bg-terra-600 hover:bg-terra-700 text-white transition-all"
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
