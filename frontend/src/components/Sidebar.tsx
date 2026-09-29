import React from 'react';
import { UserRole } from '../types';
import {
  Sparkles,
  FileText,
  Calendar,
  Users,
  UtensilsCrossed,
  Calculator,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole?: UserRole;
  isOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen = true
}) => {
  const navItems = [
    { id: 'new-quotation', label: 'New Quotation', icon: Sparkles, primary: true },
    { id: 'quotations', label: 'All Quotations', icon: FileText },
    { id: 'events', label: 'Events & Calendar', icon: Calendar },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'costing', label: 'Costing', icon: Calculator }
  ];

  return (
    <aside style={{
      width: '240px',
      backgroundColor: '#0A2518', // Deep heritage Kerala emerald
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
        padding: '1.75rem 1.25rem 1.5rem',
        borderBottom: '1px solid rgba(185, 146, 75, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem'
      }}>
        <img
          src="/logo.jpg"
          alt="B & Co"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '2px solid var(--brand-gold)',
            objectFit: 'cover'
          }}
        />
        <div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.1,
            letterSpacing: '0.02em'
          }}>
            B & Co
          </div>
          <div style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            color: 'var(--brand-gold)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase'
          }}>
            Events & Caters
          </div>
        </div>
      </div>

      {/* Minimal Navigation Links */}
      <nav style={{ padding: '1.25rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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
                backgroundColor: isActive ? 'rgba(235, 243, 238, 0.12)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#A3BAAD',
                textAlign: 'left',
                borderLeft: isActive ? '3px solid var(--brand-gold)' : '3px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={17} color={isActive ? '#FFFFFF' : '#7D988A'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Minimal Footer */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(185, 146, 75, 0.15)',
        fontSize: '0.6875rem',
        color: '#6F8A7D',
        textAlign: 'center'
      }}>
        Sasthamcotta, Kollam • Trivandrum
      </div>
    </aside>
  );
};
