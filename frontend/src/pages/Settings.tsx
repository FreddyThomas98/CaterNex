import React, { useState, useEffect } from 'react';
import { CompanySettings, User, UserRole } from '../types';
import { api } from '../services/api';
import { Settings as SettingsIcon, Save, Building, ShieldCheck, Users, Check } from 'lucide-react';

interface SettingsProps {
  userRole: UserRole;
}

export const Settings: React.FC<SettingsProps> = ({ userRole }) => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [sett, usr] = await Promise.all([
          api.getSettings(),
          api.getUsers()
        ]);
        setSettings(sett);
        setUsers(usr);
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSuccess(false);
    try {
      await api.updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <span className="badge badge-gold" style={{ marginBottom: '0.35rem' }}>
            System Settings
          </span>
          <h1 style={{ fontSize: '2rem', lineHeight: 1.15 }}>
            Company Brand & Governance Settings
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            All business details, quotation prefixes, contact numbers, and terms are fully dynamic.
          </p>
        </div>

        {success && (
          <span className="badge badge-emerald" style={{ padding: '0.5rem 1rem' }}>
            <Check size={14} /> Settings Saved Successfully
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
        {/* Company Profile Form */}
        <form onSubmit={handleSave} className="luxury-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <Building size={18} color="var(--brand-gold)" />
            <h3 style={{ fontSize: '1.15rem' }}>Brand & Contact Credentials</h3>
          </div>

          {settings && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Company Trade Name</label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Tagline</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Primary Hotline</label>
                  <input
                    type="text"
                    value={settings.phone1}
                    onChange={(e) => setSettings({ ...settings, phone1: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Secondary Hotline</label>
                  <input
                    type="text"
                    value={settings.phone2}
                    onChange={(e) => setSettings({ ...settings, phone2: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Location 1</label>
                  <input
                    type="text"
                    value={settings.location1}
                    onChange={(e) => setSettings({ ...settings, location1: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Location 2</label>
                  <input
                    type="text"
                    value={settings.location2}
                    onChange={(e) => setSettings({ ...settings, location2: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Quotation Number Prefix</label>
                <input
                  type="text"
                  value={settings.quotation_prefix}
                  onChange={(e) => setSettings({ ...settings, quotation_prefix: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Default Quotation Terms & Conditions</label>
                <textarea
                  rows={4}
                  value={settings.default_terms}
                  onChange={(e) => setSettings({ ...settings, default_terms: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontSize: '0.8125rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ marginTop: '0.5rem' }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Company Details'}
              </button>
            </div>
          )}
        </form>

        {/* User Roles & Permissions Card */}
        <div className="luxury-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <ShieldCheck size={18} color="var(--brand-emerald)" />
            <h3 style={{ fontSize: '1.15rem' }}>Staff Roles & Discount Authority</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map(u => (
              <div
                key={u.id}
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-parchment)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--brand-emerald)', fontSize: '0.875rem' }}>
                    {u.full_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {u.email}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-gold">
                    {u.role}
                  </span>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Max Discount: <b>{u.max_discount_pct}%</b>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '0.85rem',
            backgroundColor: '#EFF6FF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #BFDBFE',
            fontSize: '0.75rem',
            color: '#1E40AF',
            lineHeight: 1.4
          }}>
            <b>Role-Based Governance:</b> Salespersons can provide up to 5% discount on proposal subtotal. Discounts above 5% require General Manager sign-off (up to 15%) or Administrator override.
          </div>
        </div>
      </div>
    </div>
  );
};
