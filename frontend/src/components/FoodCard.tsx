import React from 'react';
import { MenuItem } from '../types';
import { Check, Plus, Flame, Sparkles, AlertCircle } from 'lucide-react';

interface FoodCardProps {
  item: MenuItem;
  isSelected: boolean;
  onToggle: (item: MenuItem) => void;
  customQuantity?: number;
  onQuantityChange?: (qty: number) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  isSelected,
  onToggle,
  customQuantity = 1,
  onQuantityChange
}) => {
  const isPerPerson = item.pricing_unit === 'PER_PERSON' || item.pricing_unit === 'PER_PLATE';

  const formatUnit = (unit: string) => {
    switch (unit) {
      case 'PER_PERSON': return '/ person';
      case 'PER_PLATE': return '/ plate';
      case 'PER_KG': return '/ kg';
      case 'PER_EVENT': return '/ event';
      default: return `/${unit.toLowerCase()}`;
    }
  };

  return (
    <div
      onClick={() => onToggle(item)}
      style={{
        backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: isSelected ? '2px solid var(--brand-gold)' : '1px solid var(--border-subtle)',
        boxShadow: isSelected ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
        padding: '1.15rem',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="food-card"
    >
      {/* Top Banner or Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
        {item.service_type === 'LIVE_COUNTER' && (
          <span className="badge badge-live">
            <Flame size={11} />
            LIVE
          </span>
        )}
        {item.is_seasonal === 1 && (
          <span className="badge badge-seasonal" title="Subject to seasonal market availability">
            <AlertCircle size={11} />
            SEASONAL
          </span>
        )}
      </div>

      {/* Main Info */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <h4 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: isSelected ? 'var(--brand-emerald)' : 'var(--text-main)',
            lineHeight: 1.25,
            marginBottom: '0.35rem'
          }}>
            {item.name}
          </h4>

          {/* Selection indicator pill */}
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: isSelected ? 'var(--brand-emerald)' : 'var(--bg-parchment)',
            border: isSelected ? 'none' : '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}>
            {isSelected ? <Check size={14} /> : <Plus size={14} color="var(--text-muted)" />}
          </div>
        </div>

        {item.description && (
          <p style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.35,
            marginBottom: '0.85rem'
          }}>
            {item.description}
          </p>
        )}
      </div>

      {/* Pricing Footer */}
      <div style={{
        marginTop: '0.75rem',
        paddingTop: '0.65rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div>
          {item.selling_price !== null ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--brand-emerald)'
              }}>
                ₹{item.selling_price}
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontWeight: 600
              }}>
                {formatUnit(item.pricing_unit)}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--brand-gold)', fontWeight: 600 }}>
              Price via Admin
            </span>
          )}
        </div>

        {/* Bulk quantity input if PER_KG */}
        {!isPerPerson && isSelected && onQuantityChange && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty:</span>
            <input
              type="number"
              min={1}
              value={customQuantity}
              onChange={(e) => onQuantityChange(Math.max(1, parseFloat(e.target.value) || 1))}
              style={{
                width: '60px',
                padding: '0.2rem 0.4rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                border: '1px solid var(--brand-gold)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FFFFFF',
                textAlign: 'center'
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        .food-card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};
