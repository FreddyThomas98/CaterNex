import React, { useState, useEffect } from 'react';
import { UserRole, DashboardData } from '../types';
import { api } from '../services/api';
import { BarChart3, TrendingUp, DollarSign, PieChart, ShieldAlert } from 'lucide-react';

interface ReportsProps {
  userRole: UserRole;
}

export const Reports: React.FC<ReportsProps> = ({ userRole }) => {
  const isAuthorized = userRole === 'ADMIN' || userRole === 'MANAGER';
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!isAuthorized) return;
    const load = async () => {
      try {
        const res = await api.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load reports', err);
      }
    };
    load();
  }, [isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="page-wrapper">
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1.5px solid #F87171',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '3rem auto'
        }}>
          <ShieldAlert size={48} color="#DC2626" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', color: '#991B1B', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Financial Reports Restricted
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#7F1D1D' }}>
            Internal profitability reports, profit margins, and cost analytics are confidential to Management.
          </p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.75rem' }}>
        <span className="badge badge-gold" style={{ marginBottom: '0.35rem' }}>
          Intelligence & Analytics
        </span>
        <h1 style={{ fontSize: '2rem', lineHeight: 1.15 }}>
          Profitability & Commercial Reports
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Review event margins, proposal conversion ratios, and catering financial performance.
        </p>
      </div>

      {/* KPI Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="luxury-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Gross Pipeline Value
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-emerald)', marginTop: '0.25rem' }}>
            ₹{(metrics?.total_pipeline_value || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Total quotations submitted
          </div>
        </div>

        <div className="luxury-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Confirmed Banquet Revenue
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 800, color: '#15803D', marginTop: '0.25rem' }}>
            ₹{(metrics?.confirmed_revenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Secured bookings
          </div>
        </div>

        <div className="luxury-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Estimated Profit Realized
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-gold)', marginTop: '0.25rem' }}>
            ₹{Math.round((metrics?.confirmed_revenue || 0) * 0.324).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Based on ~32.4% net margin
          </div>
        </div>
      </div>

      {/* Breakdown by Quotation Status */}
      <div className="luxury-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          Proposal Pipeline by Status
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data?.status_breakdown.map(s => {
            const pct = metrics?.total_quotations ? Math.round((s.count / metrics.total_quotations) * 100) : 0;
            return (
              <div key={s.status} style={{ padding: '0.85rem', backgroundColor: 'var(--bg-parchment)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.875rem' }}>
                  <span>{s.status.replace('_', ' ')} ({s.count} proposals)</span>
                  <span style={{ color: 'var(--brand-emerald)' }}>₹{s.value.toLocaleString()}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: s.status === 'CONFIRMED' ? '#15803D' : 'var(--brand-gold)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
