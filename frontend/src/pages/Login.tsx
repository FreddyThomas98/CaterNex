import React, { useState } from 'react';
import { User, Tenant } from '../types';
import { api } from '../services/api';
import { Lock, Mail, ArrowRight, ShieldCheck, ChefHat, Sparkles, Eye, EyeOff, Layers, CheckCircle2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User, token: string, tenant: Tenant | null) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your email and password');
      return;
    }
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
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#071810',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      backgroundImage: `
        radial-gradient(circle at 15% 20%, rgba(185, 146, 75, 0.15) 0%, transparent 45%),
        radial-gradient(circle at 85% 85%, rgba(22, 101, 52, 0.22) 0%, transparent 50%),
        linear-gradient(180deg, #071810 0%, #05120C 100%)
      `
    }}>
      <div style={{
        maxWidth: '960px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(185, 146, 75, 0.25)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))'
      }}>
        {/* Left Column: CaterNex Branding */}
        <div style={{
          backgroundColor: '#0A192F',
          color: '#FFFFFF',
          padding: '3.5rem 2.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(185, 146, 75, 0.18) 0%, transparent 55%)'
        }}>
          <div>
            {/* Brand Logo & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #C59B4B 0%, #8E6822 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 8px 20px rgba(185, 146, 75, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <ChefHat size={30} strokeWidth={2.2} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <h1 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '2rem',
                    color: '#FAF3E3',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    margin: 0
                  }}>
                    CaterNex
                  </h1>
                  <Sparkles size={16} color="var(--brand-gold)" />
                </div>
                <div style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--brand-gold)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginTop: '0.25rem'
                }}>
                  Catering Operations Cloud
                </div>
              </div>
            </div>

            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.45rem',
              color: '#FFFFFF',
              lineHeight: 1.35,
              marginBottom: '1rem',
              fontWeight: 600
            }}>
              High-Precision Catering, Recipe Costing & Proposal Management
            </h2>

            <p style={{
              fontSize: '0.875rem',
              color: '#B0C4B8',
              lineHeight: 1.6,
              marginBottom: '2rem'
            }}>
              The unified cloud operating system engineered for catering businesses and banquets. Dynamic recipe formulas, automated headcount procurement lists, and client proposals.
            </p>

            {/* Feature List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: '#EAF2EC' }}>
                <CheckCircle2 size={16} color="var(--brand-gold)" />
                <span>Multi-Tenant Architecture with Dedicated Client Brands</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: '#EAF2EC' }}>
                <CheckCircle2 size={16} color="var(--brand-gold)" />
                <span>Automated Raw Ingredient Procurement Lists</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: '#EAF2EC' }}>
                <CheckCircle2 size={16} color="var(--brand-gold)" />
                <span>Distinct Admin Management & View-Only Staff Access</span>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '2.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>CaterNex Platform v2.0</span>
            <span style={{ color: 'var(--brand-gold)' }}>Secure Access</span>
          </div>
        </div>

        {/* Right Column: Clean Login Form */}
        <div style={{
          padding: '3.5rem 2.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.6875rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--brand-gold)',
              backgroundColor: 'var(--brand-gold-light)',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              marginBottom: '0.75rem'
            }}>
              Welcome Back
            </span>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              color: 'var(--brand-emerald)',
              marginBottom: '0.35rem',
              lineHeight: 1.2
            }}>
              Sign In to Your Account
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Enter your registered username / email and password to proceed.
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              fontSize: '0.8125rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ShieldCheck size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '0.4rem',
                letterSpacing: '0.02em'
              }}>
                Username / Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={17}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="form-control"
                  style={{
                    paddingLeft: '2.6rem',
                    fontSize: '0.875rem',
                    height: '46px',
                    borderRadius: '10px',
                    borderColor: 'var(--border-medium)'
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  letterSpacing: '0.02em'
                }}>
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={17}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-control"
                  style={{
                    paddingLeft: '2.6rem',
                    paddingRight: '2.6rem',
                    fontSize: '0.875rem',
                    height: '46px',
                    borderRadius: '10px',
                    borderColor: 'var(--border-medium)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                marginTop: '0.5rem',
                height: '46px',
                borderRadius: '10px',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(14, 51, 33, 0.25)'
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={17} />
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Need access or account assistance? Contact your Platform Super Admin.
          </div>
        </div>
      </div>
    </div>
  );
};
