import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Property, PropertyReport } from '../types';
import { Flag, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ReportModalProps {
  property: Property;
}

const REPORT_REASONS: Array<{ value: PropertyReport['reason']; label: string }> = [
  { value: 'MISLEADING_INFO', label: 'Misleading description or fake photos' },
  { value: 'INCORRECT_PRICING', label: 'Hidden charges / different pricing than listed' },
  { value: 'UNAVAILABLE_LISTING', label: 'Property is already rented out or unavailable' },
  { value: 'FRAUD_SUSPICION', label: 'Suspected fraudulent landlord / scam attempt' },
  { value: 'OTHER', label: 'Other platform policy violation' }
];

export const ReportModal: React.FC<ReportModalProps> = ({ property }) => {
  const { currentUser, submitReport, closeModal } = useApp();

  const [reason, setReason] = useState<PropertyReport['reason']>('MISLEADING_INFO');
  const [details, setDetails] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    submitReport({
      propertyId: property.id,
      propertyTitle: property.title,
      reporterId: currentUser?.id || 'usr-tenant-01',
      reporterName: currentUser?.fullName || 'Anonymous Tenant',
      reason,
      details
    });

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-white rounded-xl max-w-md w-full shadow-xl border border-cream-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-navy-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-terra-600/30 flex items-center justify-center text-terra-400">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Report Listing</h2>
              <p className="text-[11px] text-cream-400">Submit to our moderation team</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-cream-400 hover:text-white rounded-lg hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-navy-800">
          
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block mb-1">
              Violation Category *
            </label>
            <div className="space-y-1.5">
              {REPORT_REASONS.map(r => (
                <label
                  key={r.value}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    reason === r.value
                      ? 'bg-terra-50 border-terra-400 text-terra-950 font-bold'
                      : 'bg-cream-50 border-cream-200 text-navy-700 hover:bg-cream-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="w-3.5 h-3.5 text-terra-600 focus:ring-terra-500"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy-700 block mb-1">
              Details *
            </label>
            <textarea
              rows={3}
              required
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Explain your concern..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-cream-300 focus:outline-none focus:ring-2 focus:ring-terra-500 text-xs text-navy-900"
            />
          </div>

          <div className="pt-2 border-t border-cream-200 flex items-center justify-between">
            <button
              type="button"
              onClick={closeModal}
              className="px-3.5 py-2 text-xs font-semibold text-navy-600 hover:text-navy-900"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold bg-terra-600 hover:bg-terra-700 text-white transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
