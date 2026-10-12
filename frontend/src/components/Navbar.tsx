import React from 'react';
import { User, Tenant } from '../types';
import { LogOut, ShieldCheck, Crown, Building2, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTenant: Tenant | null;
  allTenants?: Tenant[];
  onSelectTenant?: (tenant: Tenant) => void;
  onNavigate?: (view: string) => void;
  onLogout: () => void;
  toggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTenant,
  allTenants = [],
  onSelectTenant,
  onNavigate,
  onLogout
}) => {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand Identity / Active Catering Service */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          fontWeight: 800,
          color: 'var(--brand-emerald)',
          letterSpacing: '0.01em'
        }}>
          {activeTenant?.name || 'Catering Services'}
        </span>
        <span style={{ color: 'var(--border-medium)' }}>|</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {activeTenant?.tagline || 'Banquets & Event Catering'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Super Admin Tenant Switcher */}
        {isSuperAdmin && allTenants.length > 0 && onSelectTenant && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Viewing Tenant:
            </span>
            <select
              value={activeTenant?.id || ''}
              onChange={(e) => {
                const selected = allTenants.find(t => t.id === Number(e.target.value));
                if (selected) onSelectTenant(selected);
              }}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--brand-emerald)',
                backgroundColor: 'var(--bg-parchment)',
                border: '1.5px solid var(--brand-gold)',
                borderRadius: 'var(--radius-md)',
                padding: '0.3rem 0.6rem',
                cursor: 'pointer'
              }}
            >
              {allTenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Super Admin Hub Button */}
        {isSuperAdmin && onNavigate && (
          <button
            onClick={() => onNavigate('super-admin')}
            className="btn btn-outline btn-sm"
            style={{
              fontSize: '0.75rem',
              gap: '0.35rem',
              color: 'var(--brand-gold)',
              borderColor: 'var(--brand-gold)',
              backgroundColor: 'rgba(185, 146, 75, 0.08)'
            }}
          >
            <Crown size={14} />
            <span>Super Admin Hub</span>
          </button>
        )}

        {/* Administrator Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: isSuperAdmin ? 'rgba(185, 146, 75, 0.15)' : 'rgba(14, 51, 33, 0.08)',
          color: isSuperAdmin ? 'var(--brand-gold)' : 'var(--brand-emerald)',
          padding: '0.25rem 0.65rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 700
        }}>
          {isSuperAdmin ? <Crown size={13} /> : <ShieldCheck size={14} />}
          <span>{isSuperAdmin ? 'Super User' : (currentUser?.role || 'Admin')}</span>
        </div>

        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {currentUser.full_name}
            </span>
            <button
              onClick={onLogout}
              title="Logout"
              className="btn btn-outline btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                padding: '0.3rem 0.65rem',
                color: '#B91C1C',
                borderColor: '#FECACA',
                backgroundColor: '#FEF2F2'
              }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
