import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Property } from '../types';
import {
  MessageSquare,
  X,
  Send,
  HelpCircle,
  MapPin
} from 'lucide-react';

interface InquiryModalProps {
  property: Property;
}

const COMMON_QUESTIONS = [
  'Is the rent negotiable for a 12-month lease?',
  'What is the electricity token policy and generator fuel schedule?',
  'Are pets (cats or dogs) allowed on the premises?',
  'How secure is the compound at night?'
];

export const InquiryModal: React.FC<InquiryModalProps> = ({ property }) => {
  const { currentUser, sendInquiry, closeModal } = useApp();

  const [subject, setSubject] = useState(`Inquiry regarding ${property.title}`);
  const [message, setMessage] = useState('');

  const handleQuickQuestion = (q: string) => {
    setMessage(prev => (prev ? `${prev}\n\n${q}` : q));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendInquiry({
      propertyId: property.id,
      propertyTitle: property.title,
      propertyImage: property.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
      propertyLocation: property.locationSector,
      tenantId: currentUser?.id || 'usr-tenant-01',
      tenantName: currentUser?.fullName || 'Claire Mukamana',
      tenantEmail: currentUser?.email || 'tenant@smartrental.rw',
      landlordId: property.landlordId,
      landlordName: property.landlordName,
      subject,
      message
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
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Ask Question</h2>
              <p className="text-xs text-stone-400">Message {property.landlordName}</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-tea-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-ink-800">
          
          {/* Property snippet */}
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-3">
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-ink-900 truncate">{property.title}</h4>
              <p className="text-[11px] text-stone-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-tea-600" />
                {property.locationSector} • {property.monthlyRent.toLocaleString()} RWF/mo
              </p>
            </div>
          </div>

          {/* Quick preset questions */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-tea-600" />
              <span>Quick questions:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickQuestion(q)}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-ink-700 text-[11px] transition-colors text-left"
                >
                  + {q}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block mb-1">
              Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-tea-500 text-xs font-medium text-ink-900"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block mb-1">
              Your Message *
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your inquiry here..."
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
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold bg-tea-700 hover:bg-tea-800 text-white transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
