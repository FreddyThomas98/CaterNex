import React from 'react';
import { UserRole, Tenant } from '../types';
import {
  Sparkles,
  FileText,
  Calendar,
  Users,
  UtensilsCrossed,
  Calculator,
  ShoppingCart,
  Crown
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole?: UserRole;
  activeTenant?: Tenant | null;
  isOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  userRole = 'ADMIN',
  activeTenant,
  isOpen = true
}) => {
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const navItems = [
    ...(isSuperAdmin ? [{ id: 'super-admin', label: 'Catering Clients', icon: Crown, superAdminOnly: true }] : []),
    { id: 'new-quotation', label: 'New Quotation', icon: Sparkles, primary: true },
    { id: 'quotations', label: 'All Quotations', icon: FileText },
    { id: 'events', label: 'Events & Calendar', icon: Calendar },
    { id: 'procurement', label: 'Purchase Lists', icon: ShoppingCart },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'menu', label: 'Menu & Recipes', icon: UtensilsCrossed },
    { id: 'costing', label: 'Costing & Margins', icon: Calculator }
  ];

  const logoSrc = activeTenant?.logo_path || '/images/default-catering-logo.png';
  const brandName = activeTenant?.name || 'Catering ERP';
  const tagline = activeTenant?.tagline || 'Banquets & Events';
  const locationText = activeTenant?.location1 ? `${activeTenant.location1}${activeTenant.location2 ? ' • ' + activeTenant.location2 : ''}` : 'Catering Management OS';

  return (
    <aside style={{
      width: '240px',
      backgroundColor: '#0A2518',
      color: '#EAF2EC',
      display: isOpen ? 'flex' : 'none',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid rgba(185, 146, 75, 0.25)',
      position: 'sticky',
      top: 0,
      height: '100vh'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.5rem 1.25rem',
        borderBottom: '1px solid rgba(185, 146, 75, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem'
      }}>
        <img
          src={logoSrc}
          alt={brandName}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '2px solid var(--brand-gold)',
            objectFit: 'cover',
            backgroundColor: '#FAF7F2',
            flexShrink: 0
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/default-catering-logo.png';
          }}
        />
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.15rem',
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {brandName}
          </div>
          <div style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            color: 'var(--brand-gold)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '2px'
          }}>
            {tagline}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '1.25rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid rgba(185, 146, 75, 0.4)',
                  background: isActive
                    ? 'linear-gradient(135deg, #C59B4B 0%, #A37D39 100%)'
                    : 'rgba(185, 146, 75, 0.15)',
                  color: isActive ? '#FFFFFF' : '#FAF3E3',
                  marginBottom: '0.5rem',
                  textAlign: 'left',
                  boxShadow: isActive ? 'var(--shadow-gold)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} color="var(--brand-gold)" />
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            );
          }

          const isCrown = item.id === 'super-admin';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: isActive ? 'rgba(235, 243, 238, 0.12)' : (isCrown ? 'rgba(185, 146, 75, 0.1)' : 'transparent'),
                color: isActive ? '#FFFFFF' : (isCrown ? 'var(--brand-gold)' : '#A3BAAD'),
                textAlign: 'left',
                borderLeft: isActive ? '3px solid var(--brand-gold)' : '3px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={17} color={isActive ? '#FFFFFF' : (isCrown ? 'var(--brand-gold)' : '#7D988A')} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(185, 146, 75, 0.15)',
        fontSize: '0.6875rem',
        color: '#6F8A7D',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {locationText}
      </div>
    </aside>
  );
};
