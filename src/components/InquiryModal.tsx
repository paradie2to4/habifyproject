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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-white rounded-xl max-w-lg w-full shadow-xl border border-cream-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-terra-600/30 border border-terra-500/40 flex items-center justify-center text-terra-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Ask Question</h2>
              <p className="text-xs text-cream-400">Message {property.landlordName}</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 text-cream-400 hover:text-white rounded-lg hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-navy-800">
          
          {/* Property snippet */}
          <div className="p-3 rounded-lg bg-cream-50 border border-cream-200 flex items-center gap-3">
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-navy-900 truncate">{property.title}</h4>
              <p className="text-[11px] text-cream-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-terra-600" />
                {property.locationSector} • {property.monthlyRent.toLocaleString()} RWF/mo
              </p>
            </div>
          </div>

          {/* Quick preset questions */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-cream-600 mb-1.5 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-terra-600" />
              <span>Quick questions:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickQuestion(q)}
                  className="px-2.5 py-1 rounded-lg bg-cream-100 hover:bg-cream-200 text-navy-700 text-[11px] transition-colors text-left"
                >
                  + {q}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block mb-1">
              Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-terra-500 text-xs font-medium text-navy-900"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block mb-1">
              Your Message *
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your inquiry here..."
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
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
