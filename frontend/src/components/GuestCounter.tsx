import React from 'react';
import { Users, Minus, Plus } from 'lucide-react';

interface GuestCounterProps {
  value: number;
  onChange: (val: number) => void;
}

export const GuestCounter: React.FC<GuestCounterProps> = ({ value, onChange }) => {
  const quickPills = [100, 250, 500, 700, 1000, 1500];

  const handleStep = (delta: number) => {
    const next = Math.max(10, value + delta);
    onChange(next);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1.5px solid var(--brand-gold-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem 1.5rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--brand-gold-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-gold)'
          }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)'
            }}>
              Event Scale
            </div>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--brand-emerald)'
            }}>
              Number of Guests / Plates
            </div>
          </div>
        </div>

        {/* Stepper Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleStep(-25)}
            className="btn btn-outline"
            style={{
              width: '42px',
              height: '42px',
              padding: 0,
              borderRadius: '50%',
              fontSize: '1.25rem'
            }}
          >
            <Minus size={18} />
          </button>

          <input
            type="number"
            min={10}
            max={10000}
            step={25}
            value={value}
            onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 0))}
            style={{
              width: '100px',
              height: '42px',
              textAlign: 'center',
              fontSize: '1.35rem',
              fontWeight: 800,
              fontFamily: 'var(--font-serif)',
              color: 'var(--brand-emerald)',
              border: '1.5px solid var(--brand-gold)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-parchment)',
              outline: 'none'
            }}
          />

          <button
            type="button"
            onClick={() => handleStep(25)}
            className="btn btn-outline"
            style={{
              width: '42px',
              height: '42px',
              padding: 0,
              borderRadius: '50%',
              fontSize: '1.25rem'
            }}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Quick selection pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '1rem',
        flexWrap: 'wrap',
        paddingTop: '0.75rem',
        borderTop: '1px dashed var(--border-subtle)'
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Quick Select:
        </span>
        {quickPills.map(count => (
          <button
            key={count}
            type="button"
            onClick={() => onChange(count)}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: value === count ? '1.5px solid var(--brand-emerald)' : '1px solid var(--border-subtle)',
              backgroundColor: value === count ? 'var(--brand-emerald)' : 'var(--bg-parchment)',
              color: value === count ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            {count} pax {count === 700 ? '(Flyer)' : ''}
          </button>
        ))}
      </div>
    </div>
  );
};
