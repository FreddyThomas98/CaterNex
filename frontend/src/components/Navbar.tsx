import React from 'react';
import { User, Tenant } from '../types';
import { LogOut, ShieldCheck, Eye, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTenant: Tenant | null;
  allTenants?: Tenant[];
  onLogout: () => void;
  toggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTenant,
  onLogout
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isStaffUser = currentUser?.role === 'USER';

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
        {/* Role Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: isAdmin ? 'rgba(22, 101, 52, 0.1)' : 'rgba(37, 99, 235, 0.1)',
          color: isAdmin ? '#15803D' : '#1D4ED8',
          border: `1px solid ${isAdmin ? 'rgba(22, 101, 52, 0.25)' : 'rgba(37, 99, 235, 0.25)'}`,
          padding: '0.25rem 0.65rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 700
        }}>
          {isAdmin ? <ShieldCheck size={14} /> : <Eye size={14} />}
          <span>{isAdmin ? 'Admin (Full Edit Access)' : 'Staff User (View Only)'}</span>
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
