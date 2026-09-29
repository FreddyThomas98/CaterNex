import React from 'react';
import { MenuItem, Addon, Client, CateringEvent, UserRole } from '../types';
import {
  FileText, Download, Share2, Sparkles, X, ChevronRight,
  ShieldCheck, Calculator, CheckCircle2
} from 'lucide-react';

interface SelectedItemWithQty {
  item: MenuItem;
  quantity: number;
}

interface SelectedAddonWithQty {
  addon: Addon;
  quantity: number;
}

interface LiveQuotationSummaryProps {
  client: Partial<Client> | null;
  event: Partial<CateringEvent> | null;
  guestCount: number;
  selectedItems: SelectedItemWithQty[];
  selectedAddons: SelectedAddonWithQty[];
  onRemoveItem: (itemId: number) => void;
  onRemoveAddon: (addonId: number) => void;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  onDiscountChange: (type: 'PERCENTAGE' | 'FIXED', val: number) => void;
  taxPercentage: number;
  userRole: UserRole;
  onReview: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

export const LiveQuotationSummary: React.FC<LiveQuotationSummaryProps> = ({
  client,
  event,
  guestCount,
  selectedItems,
  selectedAddons,
  onRemoveItem,
  onRemoveAddon,
  discountType,
  discountValue,
  onDiscountChange,
  taxPercentage,
  userRole,
  onReview,
  onSave,
  isSaving
}) => {
  // Max discount allowed by role
  const maxDiscountPct = userRole === 'ADMIN' ? 100 : (userRole === 'MANAGER' ? 15 : 5);

  // Separate per-person items vs bulk/fixed items
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

  // Addons total
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
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1.5px solid var(--brand-gold-border)',
      borderRadius: 'var(--radius-xl)',
      padding: '1.5rem',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'sticky',
      top: '90px'
    }}>
      {/* Header */}
      <div style={{
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--brand-gold)'
          }}>
            Live Proposal
          </div>
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.35rem',
            fontWeight: 700,
            color: 'var(--brand-emerald)',
            lineHeight: 1.15
          }}>
            Quotation Summary
          </h3>
        </div>

        {/* Guest Count Pill */}
        <div style={{
          backgroundColor: 'var(--brand-emerald)',
          color: '#FFFFFF',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8125rem',
          fontWeight: 700,
          boxShadow: '0 2px 8px rgba(14, 51, 33, 0.25)'
        }}>
          {guestCount} Guests
        </div>
      </div>

      {/* Client & Event Quick context */}
      <div style={{
        padding: '0.75rem 0',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--brand-emerald)' }}>
          {client?.name ? client.name : 'Select or Add Client'}
        </div>
        <div>
          {event?.event_type || 'Wedding Event'} • {event?.venue || 'Venue Pending'}
        </div>
      </div>

      {/* Selected Items Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        maxHeight: '260px',
        padding: '0.75rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Selected Dishes ({selectedItems.length})
        </div>

        {selectedItems.length === 0 ? (
          <div style={{
            padding: '1.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.8125rem',
            backgroundColor: 'var(--bg-parchment)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-medium)'
          }}>
            Tap on any food item to start building your proposal.
          </div>
        ) : (
          selectedItems.map(({ item, quantity }) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.65rem',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8125rem'
              }}
            >
              <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {item.name}
                </span>
                {item.service_type === 'LIVE_COUNTER' && (
                  <span style={{ fontSize: '0.6875rem', color: '#BE123C', marginLeft: '0.35rem', fontWeight: 700 }}>
                    (Live)
                  </span>
                )}
                {item.pricing_unit !== 'PER_PERSON' && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                    × {quantity} {item.pricing_unit.replace('PER_', '')}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--brand-emerald)', fontFamily: 'var(--font-serif)' }}>
                  ₹{item.selling_price || 0}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '0.15rem'
                  }}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Selected Addons */}
        {selectedAddons.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--brand-gold)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.35rem'
            }}>
              Add-on Stations ({selectedAddons.length})
            </div>
            {selectedAddons.map(({ addon, quantity }) => (
              <div
                key={addon.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.65rem',
                  backgroundColor: 'var(--brand-gold-light)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--brand-gold-border)',
                  fontSize: '0.8125rem',
                  marginBottom: '0.35rem'
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {addon.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--brand-gold)', fontFamily: 'var(--font-serif)' }}>
                    ₹{addon.selling_price}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveAddon(addon.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing Breakdown Card */}
      <div style={{
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem'
      }}>
        {/* Price Per Person Highlight */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-parchment)',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Base Price Per Plate
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--brand-emerald)', fontWeight: 600 }}>
              (Total for {selectedItems.filter(i => i.item.pricing_unit === 'PER_PERSON').length} dishes)
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.35rem',
            fontWeight: 800,
            color: 'var(--brand-emerald)'
          }}>
            ₹{perPersonSum.toLocaleString()}
          </div>
        </div>

        {/* Subtotal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <span>Subtotal ({guestCount} pax + bulk):</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{subtotal.toLocaleString()}</span>
        </div>

        {/* Discount Control */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.35rem 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Discount:</span>
            <select
              value={discountType}
              onChange={(e) => onDiscountChange(e.target.value as any, discountValue)}
              style={{
                fontSize: '0.75rem',
                padding: '0.15rem 0.35rem',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-canvas)'
              }}
            >
              <option value="PERCENTAGE">%</option>
              <option value="FIXED">₹</option>
            </select>
            <input
              type="number"
              min={0}
              max={discountType === 'PERCENTAGE' ? maxDiscountPct : subtotal}
              value={discountValue}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                const limited = discountType === 'PERCENTAGE' ? Math.min(maxDiscountPct, val) : val;
                onDiscountChange(discountType, limited);
              }}
              style={{
                width: '55px',
                padding: '0.2rem 0.35rem',
                fontSize: '0.8125rem',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}
            />
          </div>

          {discountAmount > 0 && (
            <span style={{ color: 'var(--brand-emerald)', fontWeight: 700, fontSize: '0.8125rem' }}>
              - ₹{discountAmount.toLocaleString()}
            </span>
          )}
        </div>

        {/* Role limit note */}
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          Max permitted discount for {userRole}: <b>{maxDiscountPct}%</b>
        </div>

        {/* Tax */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <span>Catering GST ({taxPercentage}%):</span>
          <span style={{ fontWeight: 600 }}>₹{taxAmount.toLocaleString()}</span>
        </div>

        {/* Grand Total */}
        <div style={{
          marginTop: '0.5rem',
          padding: '0.85rem 1rem',
          backgroundColor: '#0E3321',
          borderRadius: 'var(--radius-md)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 14px rgba(14, 51, 33, 0.25)'
        }}>
          <div>
            <div style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--brand-gold)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Grand Total
            </div>
            <div style={{ fontSize: '0.75rem', color: '#B0C4B8' }}>
              All inclusive quotation
            </div>
          </div>

          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#FFFFFF'
          }}>
            ₹{grandTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        marginTop: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <button
          type="button"
          onClick={onReview}
          className="btn btn-gold"
          style={{ width: '100%', padding: '0.75rem' }}
        >
          <Sparkles size={16} />
          Review & Finalize Proposal
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || selectedItems.length === 0}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.75rem' }}
        >
          <CheckCircle2 size={16} />
          {isSaving ? 'Saving Proposal...' : 'Save Quotation to System'}
        </button>
      </div>
    </div>
  );
};
