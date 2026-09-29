import React from 'react';
import { UserRole } from '../types';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = () => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
      case 'APPROVED':
        return { bg: '#EBF3EE', text: '#0E3321', border: 'rgba(14, 51, 33, 0.25)' };
      case 'SENT':
      case 'UNDER_REVIEW':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'DRAFT':
      case 'PLANNING':
        return { bg: '#FAF3E3', text: '#8C6D3F', border: 'rgba(185, 146, 75, 0.35)' };
      case 'CANCELLED':
      case 'EXPIRED':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
      default:
        return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
    }
  };

  const style = getStyle();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`
      }}
    >
      {status.replace('_', ' ')}
    </span>
  );
};
