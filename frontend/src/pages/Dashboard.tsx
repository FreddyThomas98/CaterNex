import React, { useState, useEffect } from 'react';
import { DashboardData, UserRole, Quotation } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Sparkles, TrendingUp, Calendar, FileText, CheckCircle2,
  DollarSign, Users, ArrowUpRight, Plus, Download, Share2, Copy
} from 'lucide-react';

interface DashboardProps {
  userRole: UserRole;
  onNavigate: (view: string, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userRole, onNavigate }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const canViewCosting = userRole === 'ADMIN' || userRole === 'MANAGER';

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const metrics = data?.metrics;

  return (
    <div className="page-wrapper">
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <span className="badge badge-gold" style={{ marginBottom: '0.35rem' }}>
            Executive Overview
          </span>
          <h1 style={{ fontSize: '2rem', lineHeight: 1.15 }}>
            B & Co Catering Management
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Welcome back. Monitor live event pipelines, quotations, and banquet operations.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-quotation')}
          className="btn btn-gold btn-lg"
          style={{ boxShadow: 'var(--shadow-gold)' }}
        >
          <Sparkles size={18} />
          Create New Proposal
        </button>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* KPI 1: Pipeline Value */}
        <div className="luxury-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Total Quotation Pipeline
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--brand-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-gold)' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
            ₹{(metrics?.total_pipeline_value || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Across {metrics?.total_quotations || 0} active client proposals
          </div>
        </div>

        {/* KPI 2: Confirmed Revenue */}
        <div className="luxury-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Confirmed Banquet Revenue
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--brand-emerald-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-emerald)' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 800, color: '#15803D' }}>
            ₹{(metrics?.confirmed_revenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {metrics?.confirmed_events || 0} confirmed weddings & events
          </div>
        </div>

        {/* KPI 3: Avg Price Per Person */}
        <div className="luxury-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Avg Selling Price / Pax
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
            ₹{(metrics?.avg_price_per_person || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Average guest plate value
          </div>
        </div>

        {/* KPI 4: Internal Margin (RESTRICTED TO ADMIN & MANAGER) */}
        {canViewCosting ? (
          <div className="luxury-card" style={{ padding: '1.25rem', backgroundColor: '#FDFBF7', border: '1px solid var(--brand-gold-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-gold)' }}>
                Target Internal Margin
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--brand-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-gold)' }}>
                <TrendingUp size={16} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
              {metrics?.estimated_margin_pct ?? 32.4}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              🔒 Protected internal costing intelligence
            </div>
          </div>
        ) : (
          <div className="luxury-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Active Proposals
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <FileText size={16} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
              {(metrics?.draft_quotations || 0) + (metrics?.sent_quotations || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Pending client review & sign-off
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid: Recent Proposals & Upcoming Banquets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '2rem'
      }}>
        {/* Recent Quotations Card */}
        <div className="luxury-card" style={{ padding: '1.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <h3 style={{ fontSize: '1.15rem' }}>Recent Catering Quotations</h3>
            <button
              onClick={() => onNavigate('quotations')}
              className="btn btn-outline btn-sm"
            >
              View All ({data?.metrics.total_quotations || 0})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data?.recent_quotations && data.recent_quotations.length > 0 ? (
              data.recent_quotations.map(q => (
                <div
                  key={q.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--bg-parchment)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--brand-emerald)', fontSize: '0.875rem' }}>
                        {q.quotation_number}
                      </span>
                      <StatusBadge status={q.status} />
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {q.client_name} • {q.event_type} ({q.guest_count} pax)
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, color: 'var(--brand-emerald)', fontSize: '1.05rem' }}>
                        ₹{q.grand_total.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {q.created_at?.slice(0, 10)}
                      </div>
                    </div>

                    <a
                      href={`/api/quotations/${q.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm"
                      title="Download PDF"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No quotations generated yet.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events Card */}
        <div className="luxury-card" style={{ padding: '1.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <h3 style={{ fontSize: '1.15rem' }}>Upcoming Banquet Engagements</h3>
            <button
              onClick={() => onNavigate('events')}
              className="btn btn-outline btn-sm"
            >
              Event Calendar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data?.upcoming_events && data.upcoming_events.length > 0 ? (
              data.upcoming_events.map(ev => (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      backgroundColor: 'var(--brand-gold-light)',
                      color: '#8C6D3F',
                      padding: '0.4rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      lineHeight: 1.2
                    }}>
                      <div>{new Date(ev.event_date).toLocaleDateString('en-GB', { day: '2-digit' })}</div>
                      <div>{new Date(ev.event_date).toLocaleDateString('en-GB', { month: 'short' })}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--brand-emerald)', fontSize: '0.875rem' }}>
                        {ev.client_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ev.event_type} • {ev.venue}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-emerald">
                      {ev.guest_count} Guests
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No scheduled events yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
