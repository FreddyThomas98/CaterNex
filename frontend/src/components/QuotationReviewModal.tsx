import React from 'react';
import { MenuItem, Addon, Client, CateringEvent, CompanySettings, CutleryItem } from '../types';
import { X, Download, Printer, Edit3, Sparkles } from 'lucide-react';

interface QuotationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationNumber?: string;
  client: Partial<Client> | null;
  event: Partial<CateringEvent> | null;
  guestCount: number;
  selectedItems: { item: MenuItem; quantity: number }[];
  selectedAddons: { addon: Addon; quantity: number }[];
  cutlery?: CutleryItem[];
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  taxPercentage: number;
  settings?: CompanySettings | null;
  onDownloadPdf: () => void;
  onEdit?: () => void;
}

export const QuotationReviewModal: React.FC<QuotationReviewModalProps> = ({
  isOpen,
  onClose,
  quotationNumber = 'QT-2026-000001',
  client,
  event,
  guestCount,
  selectedItems,
  selectedAddons,
  cutlery = [],
  discountType,
  discountValue,
  taxPercentage,
  settings,
  onDownloadPdf,
  onEdit
}) => {
  if (!isOpen) return null;

  // Filter ONLY active/selected cutlery
  const activeCutlery = (cutlery || []).filter(
    (c: any) => c.is_selected !== false && (c.quantity || 0) > 0
  );

  // Group items by category
  const categories: { [cat: string]: { item: MenuItem; quantity: number }[] } = {};
  selectedItems.forEach(entry => {
    const cat = entry.item.category_name || 'Special Delicacies';
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

  let cutlerySum = 0;
  activeCutlery.forEach(c => {
    if (c.is_included === 0) {
      cutlerySum += (c.total_cost && c.total_cost > 0) ? c.total_cost : (c.unit_cost * c.quantity);
    }
  });

  const subtotal = (perPersonSum * guestCount) + bulkItemsSum + addonsSum + cutlerySum;
  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    discountAmount = Math.round((subtotal * (discountValue || 0)) / 100.0);
  } else {
    discountAmount = Math.min(subtotal, discountValue || 0);
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableAmount * (taxPercentage || 5.0)) / 100.0);
  const grandTotal = taxableAmount + taxAmount;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200, padding: '1.5rem' }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(10, 25, 47, 0.35), 0 0 0 1px rgba(0,0,0,0.06)',
          padding: '2.25rem',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto'
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
            background: '#F1F5F9',
            border: 'none',
            cursor: 'pointer',
            color: '#64748B',
            padding: '0.45rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title="Close Preview"
        >
          <X size={18} />
        </button>

        {/* Action Header Bar (Hidden from print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.75rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid #E2E8F0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#ECFDF5',
              color: '#065F46',
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              <Sparkles size={13} color="#059669" />
              OFFICIAL PROPOSAL PREVIEW
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>
              {quotationNumber}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {onEdit && (
              <button
                onClick={onEdit}
                className="btn btn-outline btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--brand-emerald)',
                  borderColor: '#CBD5E1',
                  fontWeight: 600
                }}
              >
                <Edit3 size={15} />
                Edit Proposal
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="btn btn-outline btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: '#CBD5E1',
                fontWeight: 600
              }}
            >
              <Printer size={15} />
              Print
            </button>
            <button
              onClick={onDownloadPdf}
              className="btn btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'var(--brand-emerald)',
                color: '#FFFFFF',
                fontWeight: 700,
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(15, 76, 58, 0.25)',
                cursor: 'pointer'
              }}
            >
              <Download size={15} />
              Download Official PDF
            </button>
          </div>
        </div>

        {/* FLYER-STYLE PROPOSAL SHEET */}
        <div
          id="printable-proposal"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: '12px',
            padding: '2.25rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
          }}
        >
          {/* Top Brand Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '1.5rem',
            borderBottom: '2px solid var(--brand-gold)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img
                src={settings?.logo_path || '/images/default-catering-logo.png'}
                alt={settings?.company_name || 'Catering Services'}
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--brand-gold)',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/default-catering-logo.png';
                }}
              />
              <div>
                <h1 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: 'var(--brand-emerald)',
                  lineHeight: 1.15,
                  margin: 0
                }}>
                  {settings?.company_name || 'Catering Services'}
                </h1>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--brand-gold)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginTop: '0.25rem'
                }}>
                  {settings?.tagline || 'Banquets & Event Catering'}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.78125rem', color: '#64748B', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, color: 'var(--brand-emerald)', fontSize: '0.85rem' }}>
                {[settings?.phone1, settings?.phone2].filter(Boolean).join(' | ') || '+91 98765 43210'}
              </div>
              <div>{[settings?.location1, settings?.location2].filter(Boolean).join(' | ') || 'City Center'}</div>
              <div style={{
                marginTop: '0.35rem',
                display: 'inline-block',
                backgroundColor: '#F1F5F9',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontWeight: 700,
                color: 'var(--brand-emerald)',
                fontSize: '0.75rem'
              }}>
                Proposal #{quotationNumber}
              </div>
            </div>
          </div>

          {/* Client & Event Details Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            margin: '1.5rem 0'
          }}>
            <div style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                Client Particulars
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--brand-emerald)' }}>
                {client?.name ? client.name : 'Walk-in Client'}
              </div>
              {client?.phone ? (
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>
                  <b>Phone:</b> {client.phone}
                </div>
              ) : null}
              {client?.address ? (
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.15rem' }}>
                  <b>Address:</b> {client.address}
                </div>
              ) : null}
            </div>

            <div style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                Occasion & Venue
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-emerald)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>{event?.event_type || 'Catering Event'}</span>
                <span style={{
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px'
                }}>
                  {guestCount} Guests
                </span>
              </div>
              {event?.event_date ? (
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>
                  <b>Event Date:</b> {event.event_date.includes('-') ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : event.event_date}
                </div>
              ) : null}
              {event?.venue ? (
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.15rem' }}>
                  <b>Venue:</b> {event.venue}
                </div>
              ) : null}
            </div>
          </div>

          {/* Curated Menu Grid */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #E2E8F0',
              paddingBottom: '0.5rem',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--brand-emerald)',
                margin: 0
              }}>
                Curated Menu Selection
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                {selectedItems.length} delicacies curated
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem'
            }}>
              {Object.keys(categories).map(catName => (
                <div key={catName} style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #F1F5F9',
                  borderRadius: '8px',
                  padding: '0.85rem'
                }}>
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--brand-gold)',
                    borderBottom: '1px dashed #CBD5E1',
                    paddingBottom: '0.35rem',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {catName}
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {categories[catName].map(({ item, quantity }) => (
                      <li
                        key={item.id}
                        style={{
                          fontSize: '0.85rem',
                          color: '#1E293B',
                          padding: '0.3rem 0',
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '0.45rem',
                          borderBottom: '1px dotted #F1F5F9'
                        }}
                      >
                        <span style={{ color: 'var(--brand-gold)', fontWeight: 800 }}>•</span>
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                        {item.service_type === 'LIVE_COUNTER' && (
                          <span style={{
                            fontSize: '0.65rem',
                            color: '#BE123C',
                            backgroundColor: '#FFE4E6',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            Live Counter
                          </span>
                        )}
                        {item.pricing_unit !== 'PER_PERSON' && (
                          <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: 'auto' }}>
                            {quantity} {item.pricing_unit.replace('PER_', '')}
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
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--brand-emerald)', marginBottom: '0.5rem' }}>
                Additional Live Stations & Services
              </div>
              {selectedAddons.map(({ addon, quantity }) => (
                <div key={addon.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', padding: '0.25rem 0' }}>
                  <span>• {addon.name} ({addon.pricing_unit})</span>
                  <span style={{ fontWeight: 600 }}>₹{addon.selling_price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tableware & Cutlery Allocation (ONLY RENDER IF ACTIVE CUTLERY SELECTED) */}
          {activeCutlery.length > 0 && (
            <div style={{
              marginBottom: '1.75rem',
              padding: '1.15rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--brand-emerald)',
                marginBottom: '0.65rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Tableware & Cutlery Allocation ({activeCutlery.length} items)</span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: cutlerySum > 0 ? '#FEF3C7' : '#DCFCE7',
                  color: cutlerySum > 0 ? '#92400E' : '#166534',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px'
                }}>
                  {cutlerySum > 0 ? `+ ₹${cutlerySum.toLocaleString()} Extra Rental` : 'Included in Package'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.45rem' }}>
                {activeCutlery.map((cut, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '0.8125rem',
                      color: '#1E293B',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.35rem 0.6rem',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>• {cut.cutlery_name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--brand-emerald)' }}>
                      {cut.quantity} pcs
                      {cut.is_included === 0 && (
                        <span style={{ color: '#DC2626', marginLeft: '0.35rem', fontSize: '0.75rem' }}>
                          +₹{(cut.total_cost && cut.total_cost > 0) ? cut.total_cost : (cut.unit_cost * cut.quantity)}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Summary Box */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '12px',
            border: '1.5px solid var(--brand-gold)',
            padding: '1.35rem',
            marginTop: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.45rem', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 600, color: '#475569' }}>
                Per Person Plate Rate ({guestCount} pax):
              </span>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--brand-emerald)', fontSize: '1.05rem' }}>
                ₹{perPersonSum.toLocaleString()} / person
              </span>
            </div>

            {cutlerySum > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', fontSize: '0.875rem', color: '#475569' }}>
                <span>Special Tableware & Cutlery Rental:</span>
                <span style={{ fontWeight: 600 }}>+ ₹{cutlerySum.toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', fontSize: '0.875rem', color: '#475569' }}>
              <span>Menu & Services Subtotal:</span>
              <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString()}</span>
            </div>

            {discountAmount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '0.45rem',
                fontSize: '0.875rem',
                color: '#059669',
                backgroundColor: '#ECFDF5',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                marginBottom: '0.4rem'
              }}>
                <span style={{ fontWeight: 700 }}>
                  Special Discount ({discountType === 'PERCENTAGE' ? `${discountValue}%` : `₹${discountValue.toLocaleString()}`}):
                </span>
                <span style={{ fontWeight: 800 }}>- ₹{discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
              <span>Catering GST ({taxPercentage || 5}%):</span>
              <span style={{ fontWeight: 600 }}>₹{taxAmount.toLocaleString()}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '0.85rem',
              borderTop: '1.5px solid var(--brand-gold)',
              marginTop: '0.4rem'
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                  Total Quotation Amount
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Strictly confidential client proposal • All taxes included
                </div>
              </div>

              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.95rem',
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
