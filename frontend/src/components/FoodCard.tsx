import React, { useState } from 'react';
import { MenuItem } from '../types';
import { Check, Plus, Flame, AlertCircle, Utensils } from 'lucide-react';

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
  const [imgError, setImgError] = useState(false);
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
        backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: isSelected ? '2px solid var(--brand-gold)' : '1px solid var(--border-subtle)',
        boxShadow: isSelected ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="food-card"
    >
      {/* Dish Image Banner */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '140px',
        backgroundColor: '#F3EFEA',
        overflow: 'hidden'
      }}>
        {item.image_url && !imgError ? (
          <img
            src={item.image_url}
            alt={item.name}
            onError={() => setImgError(true)}
            className="food-card-img"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.35s ease'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1B3B2B15 0%, #D4AF3715 100%)',
            color: 'var(--brand-emerald)'
          }}>
            <Utensils size={28} opacity={0.6} />
            <span style={{ fontSize: '0.7rem', marginTop: '0.35rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Catering Specialty
            </span>
          </div>
        )}

        {/* Floating Gradient Overlay for text contrast */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none'
        }} />

        {/* Top Badges over image */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          zIndex: 2
        }}>
          {item.service_type === 'LIVE_COUNTER' && (
            <span className="badge badge-live" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              <Flame size={11} />
              LIVE
            </span>
          )}
          {item.is_seasonal === 1 && (
            <span className="badge badge-seasonal" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              <AlertCircle size={11} />
              SEASONAL
            </span>
          )}
        </div>

        {/* Selection indicator badge on top right */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          backgroundColor: isSelected ? 'var(--brand-gold)' : 'rgba(255, 255, 255, 0.85)',
          border: isSelected ? '1px solid #FFFFFF' : '1px solid rgba(0,0,0,0.1)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isSelected ? '#1B3B2B' : 'var(--text-muted)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
          transition: 'all 0.2s ease',
          zIndex: 2
        }}>
          {isSelected ? <Check size={16} strokeWidth={3} /> : <Plus size={15} />}
        </div>
      </div>

      {/* Card Content */}
      <div style={{
        padding: '0.85rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1
      }}>
        <div>
          <h4 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1rem',
            fontWeight: 700,
            color: isSelected ? 'var(--brand-emerald)' : 'var(--text-main)',
            lineHeight: 1.3,
            marginBottom: '0.25rem'
          }}>
            {item.name}
          </h4>

          {item.description && (
            <p style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.35,
              marginBottom: '0.5rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {item.description}
            </p>
          )}
        </div>

        {/* Pricing Footer */}
        <div style={{
          marginTop: '0.65rem',
          paddingTop: '0.55rem',
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
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--brand-emerald)'
                }}>
                  ₹{item.selling_price}
                </span>
                <span style={{
                  fontSize: '0.72rem',
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
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Qty:</span>
              <input
                type="number"
                min={1}
                value={customQuantity}
                onChange={(e) => onQuantityChange(Math.max(1, parseFloat(e.target.value) || 1))}
                style={{
                  width: '54px',
                  padding: '0.15rem 0.35rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: '1.5px solid var(--brand-gold)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#FFFFFF',
                  textAlign: 'center'
                }}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .food-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
        .food-card:hover .food-card-img {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};
