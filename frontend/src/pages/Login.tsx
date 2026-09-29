import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@bandco.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email.trim(), password);
      localStorage.setItem('bandco_token', res.token);
      localStorage.setItem('bandco_user', JSON.stringify(res.user));
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setEmail('admin@bandco.com');
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
        {/* Left Column: Heritage Brand Presentation */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <img
                src="/logo.jpg"
                alt="B & Co"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '2px solid var(--brand-gold)',
                  boxShadow: '0 4px 14px rgba(185, 146, 75, 0.4)',
                  objectFit: 'cover'
                }}
              />
              <div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: '#FFFFFF', lineHeight: 1.1 }}>
                  B & Co
                </h1>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--brand-gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Wedding Events and Caters
                </div>
              </div>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.55rem', color: '#FAF3E3', lineHeight: 1.35, marginBottom: '1rem' }}>
              Bespoke Kerala Wedding Catering & Quotation Platform
            </h2>

            <p style={{ fontSize: '0.875rem', color: '#B0C4B8', lineHeight: 1.6 }}>
              Administrative portal for wedding quotations, client bookings, event calendar, bespoke brochure menu customization, and cost management.
            </p>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(185, 146, 75, 0.25)', fontSize: '0.75rem', color: '#8FA89A' }}>
            <div style={{ fontWeight: 700, color: 'var(--brand-gold)', marginBottom: '0.2rem' }}>
              Sasthamcotta, Kollam • Trivandrum
            </div>
            <div>+91 790 725 4973 | +91 9072 400 824</div>
          </div>
        </div>

        {/* Right Column: Admin Login Card */}
        <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(185, 146, 75, 0.12)',
              color: 'var(--brand-gold)',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.65rem'
            }}>
              <ShieldCheck size={13} />
              Administrator Access
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', color: 'var(--brand-emerald)', marginBottom: '0.35rem' }}>
              Admin Sign In
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Sign in with your administrative credentials to manage quotations, events, and pricing.
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              color: '#B91C1C',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
              border: '1px solid #FECACA'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Admin Email Address
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1.5px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#FAFAF9'
              }}>
                <Mail size={16} color="var(--text-muted)" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bandco.com"
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem', backgroundColor: 'transparent' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Admin Password
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1.5px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#FAFAF9'
              }}>
                <Lock size={16} color="var(--text-muted)" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem', backgroundColor: 'transparent' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-gold btn-lg"
              style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
            >
              <span>{loading ? 'Verifying Admin...' : 'Sign In as Administrator'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Fill Helper for Demo / Testing */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1rem',
            borderTop: '1px dashed var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <span>Default Admin Account:</span>
            <button
              type="button"
              onClick={handleFillAdmin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-gold)',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Fill Credentials (admin@bandco.com)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
