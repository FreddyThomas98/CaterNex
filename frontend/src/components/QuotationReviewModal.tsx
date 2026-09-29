import React from 'react';
import { MenuItem, Addon, Client, CateringEvent, CompanySettings } from '../types';
import { X, Download, Printer, CheckCircle } from 'lucide-react';

interface QuotationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationNumber?: string;
  client: Partial<Client> | null;
  event: Partial<CateringEvent> | null;
  guestCount: number;
  selectedItems: { item: MenuItem; quantity: number }[];
  selectedAddons: { addon: Addon; quantity: number }[];
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  taxPercentage: number;
  settings?: CompanySettings | null;
  onDownloadPdf: () => void;
}

export const QuotationReviewModal: React.FC<QuotationReviewModalProps> = ({
  isOpen,
  onClose,
  quotationNumber = 'DRAFT-QT-2026',
  client,
  event,
  guestCount,
  selectedItems,
  selectedAddons,
  discountType,
  discountValue,
  taxPercentage,
  settings,
  onDownloadPdf
}) => {
  if (!isOpen) return null;

  // Group items by category
  const categories: { [cat: string]: { item: MenuItem; quantity: number }[] } = {};
  selectedItems.forEach(entry => {
    const cat = entry.item.category_name || 'Special Dishes';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(entry);
  });

  // Calculate pricing
  let perPersonSum = 0;
  let bulkItemsSum = 0;
  selectedItems.forEach(({ item, quantity }) => {
    const price = item.selling_price || 0;
    if (item.pricing_unit === 'PER_PERSON' || item.pricing_unit === 'PER_PLATE') {
      perPersonSum += price;
    } else {
      bulkItemsSum += price * quantity;
    }
  });

  let addonsSum = 0;
  selectedAddons.forEach(({ addon, quantity }) => {
    addonsSum += (addon.selling_price || 0) * quantity;
  });

  const subtotal = (perPersonSum * guestCount) + bulkItemsSum + addonsSum;
  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    discountAmount = Math.round((subtotal * discountValue) / 100.0);
  } else {
    discountAmount = Math.min(subtotal, discountValue);
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableAmount * taxPercentage) / 100.0);
  const grandTotal = taxableAmount + taxAmount;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          backgroundColor: '#FAF7F2', // Warm ivory canvas matching flyer
          border: '2px solid var(--brand-gold)',
          padding: '2.5rem',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="no-print"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '0.5rem',
            borderRadius: '50%'
          }}
        >
          <X size={20} />
        </button>

        {/* Action Header Bar (Hidden from print/PDF) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--brand-gold-border)'
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-emerald)' }}>
              Catering Proposal
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {quotationNumber}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => window.print()}
              className="btn btn-outline btn-sm"
              title="Print document"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={onDownloadPdf}
              className="btn btn-gold btn-sm"
            >
              <Download size={16} />
              Download Official PDF
            </button>
          </div>
        </div>

        {/* FLYER-STYLE PROPOSAL SHEET */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '2.5rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 20px rgba(14, 51, 33, 0.06)',
          border: '1px solid var(--border-medium)'
        }} id="printable-proposal">

          {/* Top Brand Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '1.5rem',
            borderBottom: '1.5px solid var(--brand-gold-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img
                src="/logo.jpg"
                alt="B & Co"
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  border: '2px solid var(--brand-gold)',
                  objectFit: 'cover'
                }}
              />
              <div>
                <h1 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--brand-emerald)',
                  lineHeight: 1.1,
                  letterSpacing: '0.02em'
                }}>
                  B & Co
                </h1>
                <div style={{
                  fontSize: '0.78125rem',
                  fontWeight: 700,
                  color: 'var(--brand-gold)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase'
                }}>
                  Wedding Events and Caters
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, color: 'var(--brand-emerald)', fontSize: '0.8125rem' }}>
                +91 790 725 4973 | +91 9072 400 824
              </div>
              <div>Sasthamcotta, Kollam | Trivandrum</div>
              <div style={{ marginTop: '0.25rem', fontWeight: 600, color: 'var(--brand-gold)' }}>
                Proposal #{quotationNumber}
              </div>
            </div>
          </div>

          {/* Client & Event Details Box */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            margin: '1.5rem 0',
            padding: '1.25rem',
            backgroundColor: '#F5EFEB',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)'
          }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                Client Particulars
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--brand-emerald)' }}>
                {client?.name ? client.name : 'Walk-in Client'}
              </div>
              {client?.phone ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  <b>Phone:</b> {client.phone}
                </div>
              ) : null}
              {client?.address ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <b>Address:</b> {client.address}
                </div>
              ) : null}
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                Occasion & Venue
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-emerald)' }}>
                {event?.event_type ? `${event.event_type} • ` : ''}
                <span style={{ color: 'var(--brand-gold)' }}>{guestCount} Guests</span>
              </div>
              {event?.event_date ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  <b>Date:</b> {event.event_date.includes('-') ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : event.event_date}
                </div>
              ) : null}
              {event?.venue ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <b>Venue:</b> {event.venue}
                </div>
              ) : null}
            </div>
          </div>

          {/* Proposed Menu Grid (Flyer Layout) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.35rem',
              color: 'var(--brand-emerald)',
              borderBottom: '1px solid var(--brand-gold-border)',
              paddingBottom: '0.5rem',
              marginBottom: '1rem'
            }}>
              Curated Event Menu
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {Object.keys(categories).map(catName => (
                <div key={catName} style={{ marginBottom: '0.5rem' }}>
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--brand-gold)',
                    borderBottom: '1px dashed var(--brand-gold-border)',
                    paddingBottom: '0.25rem',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {catName}
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {categories[catName].map(({ item, quantity }) => (
                      <li
                        key={item.id}
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-main)',
                          padding: '0.25rem 0',
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '0.4rem'
                        }}
                      >
                        <span style={{ color: 'var(--brand-gold)', fontWeight: 800 }}>•</span>
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                        {item.service_type === 'LIVE_COUNTER' && (
                          <span style={{ fontSize: '0.6875rem', color: '#BE123C', fontWeight: 700 }}>
                            (live)
                          </span>
                        )}
                        {item.pricing_unit !== 'PER_PERSON' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            — {quantity} {item.pricing_unit.replace('PER_', '')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons if any */}
          {selectedAddons.length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#FDFBF7', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brand-gold-border)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--brand-emerald)', marginBottom: '0.5rem' }}>
                Additional Live Stations & Services
              </div>
              {selectedAddons.map(({ addon, quantity }) => (
                <div key={addon.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', padding: '0.2rem 0' }}>
                  <span>• {addon.name} ({addon.pricing_unit})</span>
                  <span style={{ fontWeight: 600 }}>₹{addon.selling_price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Financial Summary Box */}
          <div style={{
            backgroundColor: '#F5EFEB',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--brand-gold)',
            padding: '1.25rem',
            marginTop: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                Per Person Plate Rate ({guestCount} pax):
              </span>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--brand-emerald)', fontSize: '1rem' }}>
                ₹{perPersonSum.toLocaleString()} / person
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString()}</span>
            </div>

            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem', fontSize: '0.875rem', color: 'var(--brand-emerald)' }}>
                <span>Discount ({discountValue}{discountType === 'PERCENTAGE' ? '%' : '₹'}):</span>
                <span style={{ fontWeight: 700 }}>- ₹{discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span>Catering GST ({taxPercentage}%):</span>
              <span style={{ fontWeight: 600 }}>₹{taxAmount.toLocaleString()}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--brand-gold-border)',
              marginTop: '0.35rem'
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                  Total Quotation Amount
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Strictly confidential client proposal
                </div>
              </div>

              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.85rem',
                fontWeight: 800,
                color: 'var(--brand-emerald)'
              }}>
                ₹{grandTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
