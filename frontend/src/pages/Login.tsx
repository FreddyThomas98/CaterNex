import React, { useState } from 'react';
import { User, Tenant } from '../types';
import { api } from '../services/api';
import { Lock, Mail, ShieldCheck, ArrowRight, Crown, Building2, ChefHat, ShoppingCart } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User, token: string, tenant: Tenant | null) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('superadmin@cateringos.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email.trim(), password);
      localStorage.setItem('catering_token', res.token);
      localStorage.setItem('catering_user', JSON.stringify(res.user));
      if (res.tenant) {
        localStorage.setItem('active_tenant', JSON.stringify(res.tenant));
        localStorage.setItem('active_tenant_id', String(res.tenant.id));
      } else {
        localStorage.removeItem('active_tenant_id');
      }
      onLoginSuccess(res.user, res.token, res.tenant);
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillSuperAdmin = () => {
    setEmail('superadmin@cateringos.com');
    setPassword('admin123');
    setError(null);
  };

  const fillBusinessAdmin = () => {
    setEmail('admin@royalfeast.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-canvas)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(185, 146, 75, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(14, 51, 33, 0.08) 0%, transparent 40%)'
    }}>
      <div style={{
        maxWidth: '920px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1.5px solid var(--brand-gold-border)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
      }}>
        {/* Left Column: SaaS Platform Presentation */}
        <div style={{
          backgroundColor: '#092417',
          color: '#FFFFFF',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(185, 146, 75, 0.25)',
                border: '2px solid var(--brand-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-gold)'
              }}>
                <ChefHat size={28} />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: '#FFFFFF', lineHeight: 1.1 }}>
                  CateringOS
                </h1>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--brand-gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Multi-Tenant Banquet Platform
                </div>
              </div>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#FAF3E3', lineHeight: 1.35, marginBottom: '1rem' }}>
              White-Label Catering ERP, Recipes & Billing Platform
            </h2>

            <p style={{ fontSize: '0.875rem', color: '#B0C4B8', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Universal software built for any catering company. Add recipes, generate automated raw material purchase lists for events, manage banquets, and produce custom branded client proposals.
            </p>

            {/* Platform Feature highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.8125rem', color: '#EAF2EC' }}>
                <Crown size={16} color="var(--brand-gold)" />
                <span>Super Admin hub to onboard any catering client</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.8125rem', color: '#EAF2EC' }}>
                <Building2 size={16} color="var(--brand-gold)" />
                <span>Fully white-labeled with client logo, name & GST</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.8125rem', color: '#EAF2EC' }}>
                <ShoppingCart size={16} color="var(--brand-gold)" />
                <span>Automated purchase & grocery lists scaled to headcounts</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            Universal Catering SaaS Platform
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.55rem', color: 'var(--brand-emerald)', marginBottom: '0.35rem' }}>
              Sign In to Your Workspace
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Enter your credentials to access the management portal.
            </p>
          </div>

          {/* Quick Demo Login Chips */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Quick Login Demo Profiles:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={fillSuperAdmin}
                className="btn btn-outline btn-sm"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--brand-gold)',
                  borderColor: 'var(--brand-gold)',
                  backgroundColor: 'rgba(185, 146, 75, 0.08)',
                  gap: '0.35rem'
                }}
              >
                <Crown size={13} />
                <span>Super Admin (Us)</span>
              </button>
              <button
                type="button"
                onClick={fillBusinessAdmin}
                className="btn btn-outline btn-sm"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--brand-emerald)',
                  borderColor: 'var(--brand-emerald)',
                  backgroundColor: 'rgba(14, 51, 33, 0.06)',
                  gap: '0.35rem'
                }}
              >
                <Building2 size={13} />
                <span>Catering Business Admin</span>
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cateringos.com"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                marginTop: '0.5rem',
                justifyContent: 'center'
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
