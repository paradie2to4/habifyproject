import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';
import { MessageSquare, Send } from 'lucide-react';

export const InquiriesView: React.FC = () => {
  const { inquiries, currentUser, sendInquiry, setCurrentTab } = useApp();
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>(inquiries[0]?.id || '');
  const [replyText, setReplyText] = useState('');

  const selectedInquiry = inquiries.find(i => i.id === selectedInquiryId) || inquiries[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedInquiry) return;

    sendInquiry({
      propertyId: selectedInquiry.propertyId,
      propertyTitle: selectedInquiry.propertyTitle,
      propertyImage: selectedInquiry.propertyImage,
      propertyLocation: selectedInquiry.propertyLocation,
      tenantId: currentUser?.id || 'usr-tenant-01',
      tenantName: currentUser?.fullName || 'Claire Mukamana',
      tenantEmail: currentUser?.email || 'tenant@habify.rw',
      landlordId: selectedInquiry.landlordId,
      landlordName: selectedInquiry.landlordName,
      subject: `Re: ${selectedInquiry.subject}`,
      message: replyText
    });

    setReplyText('');
  };

  return (
    <div id="inquiries-view-container" className="space-y-8 text-left">
      <header>
        <h1 className="font-display text-3xl font-semibold text-navy-900">Messages</h1>
        <p className="text-sm text-cream-600 mt-2">
          Conversations with landlords about homes you&apos;re considering.
        </p>
      </header>

      {inquiries.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 bg-white rounded-xl border border-cream-200 overflow-hidden min-h-[520px]">
          <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-cream-200 divide-y divide-cream-100 overflow-y-auto max-h-[600px]">
            <div className="p-4 text-xs font-semibold uppercase tracking-wide text-cream-600">
              Threads ({inquiries.length})
            </div>
            {inquiries.map(inq => {
              const active = inq.id === selectedInquiryId;
              return (
                <button
                  key={inq.id}
                  type="button"
                  onClick={() => setSelectedInquiryId(inq.id)}
                  className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                    active ? 'bg-cream-100' : 'hover:bg-cream-50'
                  }`}
                >
                  <img
                    src={inq.propertyImage}
                    alt=""
                    className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 text-xs mb-0.5">
                      <span className="font-semibold text-navy-900 truncate">{inq.tenantName}</span>
                      <span className="text-cream-500 flex-shrink-0">
                        {new Date(inq.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-navy-800 truncate">{inq.subject}</p>
                    <p className="text-[11px] text-cream-600 truncate mt-0.5">{inq.message}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedInquiry ? (
            <div className="lg:col-span-2 p-6 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-navy-900">{selectedInquiry.subject}</h2>
                  <p className="text-sm text-cream-600 mt-1">
                    {selectedInquiry.propertyTitle} · {selectedInquiry.propertyLocation}
                  </p>
                  <p className="text-xs text-cream-500 mt-2">
                    {selectedInquiry.tenantName} → {selectedInquiry.landlordName}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-cream-50 border border-cream-200">
                  <div className="flex items-center justify-between text-xs text-cream-600 mb-2">
                    <span className="font-semibold text-navy-900">{selectedInquiry.tenantName}</span>
                    <span>{new Date(selectedInquiry.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-navy-800 leading-relaxed whitespace-pre-line">
                    {selectedInquiry.message}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendReply} className="flex items-end gap-2 pt-4 border-t border-cream-200">
                <label htmlFor="inquiry-reply" className="sr-only">Reply</label>
                <textarea
                  id="inquiry-reply"
                  rows={2}
                  required
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a reply…"
                  className="input-base flex-1 resize-none"
                />
                <button
                  type="submit"
                  className="btn-primary p-3"
                  aria-label="Send reply"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center text-cream-500 text-sm p-8">
              Select a conversation to read it.
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<MessageSquare className="w-5 h-5" />}
          title="No conversations yet."
          description="When you inquire about a home, the thread will appear here."
          actionLabel="Explore properties"
          onAction={() => setCurrentTab('BROWSE')}
        />
      )}
    </div>
  );
};
