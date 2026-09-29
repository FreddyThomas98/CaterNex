import React, { useState } from 'react';
import { X, Send, Copy, Check, MessageSquare } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationNumber: string;
  clientName: string;
  clientPhone: string;
  eventType: string;
  guestCount: number;
  perPersonRate: number;
  grandTotal: number;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  quotationNumber,
  clientName,
  clientPhone,
  eventType,
  guestCount,
  perPersonRate,
  grandTotal
}) => {
  const [phone, setPhone] = useState(clientPhone || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Proposal link
  const shareUrl = `${window.location.origin}/proposal/${quotationNumber}`;

  // Formatted message
  const message = `Warm greetings ${clientName || 'valued guest'}!\n\nHere is your custom wedding & event catering proposal from *B & Co Wedding Events and Caters*:\n\n✨ *Event:* ${eventType || 'Wedding Celebration'}\n👥 *Guest Count:* ${guestCount} Guests\n🍽️ *Base Rate:* ₹${perPersonRate.toLocaleString()} / person\n💰 *Total Investment:* ₹${grandTotal.toLocaleString()}\n📄 *Quotation Ref:* ${quotationNumber}\n\nReview your digital proposal anytime: ${shareUrl}\n\nFor inquiries or customizations, call us directly at +91 790 725 4973.\nSasthamcotta, Kollam & Trivandrum.`;

  const handleOpenWhatsApp = () => {
    // Sanitize phone
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          padding: '1.75rem',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#DCFCE7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#15803D'
          }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--brand-emerald)' }}>
              Share via WhatsApp
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Send proposal directly to the client's phone or copy link
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Recipient WhatsApp Number:
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 7736094757 or 917736094757"
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Message Preview:
          </label>
          <div style={{
            backgroundColor: 'var(--bg-parchment)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            fontSize: '0.75rem',
            color: 'var(--text-main)',
            whiteSpace: 'pre-wrap',
            maxHeight: '160px',
            overflowY: 'auto',
            lineHeight: 1.4
          }}>
            {message}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-outline"
            style={{ flex: 1 }}
          >
            {copied ? <Check size={16} color="green" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Text & Link'}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="btn"
            style={{
              flex: 1,
              backgroundColor: '#15803D',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)'
            }}
          >
            <Send size={16} />
            Open WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
