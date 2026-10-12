import React, { useState, useEffect } from 'react';
import { Tenant } from '../types';
import { api } from '../services/api';
import {
  Building2, Plus, Users, UtensilsCrossed, FileText, Calendar,
  ExternalLink, Edit3, Check, X, ShieldCheck, Upload, Phone, Mail, MapPin, Globe
} from 'lucide-react';

interface SuperAdminPortalProps {
  onSwitchTenant: (tenant: Tenant) => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({ onSwitchTenant }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State: Onboard Tenant
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoPath, setLogoPath] = useState('/images/default-catering-logo.png');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [location1, setLocation1] = useState('');
  const [location2, setLocation2] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [quotationPrefix, setQuotationPrefix] = useState('QT-');
  const [defaultTerms, setDefaultTerms] = useState('1. 50% advance on confirmation, balance prior to event.\n2. Final headcount confirmed 3 days prior.');
  
  // Primary Admin User
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Edit Tenant Modal
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await api.getTenants();
      setTenants(res);
    } catch (err) {
      console.error('Failed to load tenants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const res = await api.uploadLogo(file);
      setLogoPath(res.url);
    } catch (err: any) {
      alert(`Logo upload failed: ${err.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Business name is required');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.createTenant({
        name: name.trim(),
        tagline: tagline.trim(),
        logo_path: logoPath,
        phone1: phone1.trim(),
        phone2: phone2.trim(),
        email: email.trim(),
        website: website.trim(),
        location1: location1.trim(),
        location2: location2.trim(),
        gst_number: gstNumber.trim(),
        currency_symbol: currencySymbol,
        quotation_prefix: quotationPrefix.trim() || 'QT-',
        default_terms: defaultTerms,
        admin_name: adminName.trim(),
        admin_email: adminEmail.trim(),
        admin_password: adminPassword.trim()
      });
      setIsOnboardModalOpen(false);
      resetForm();
      await loadTenants();
    } catch (err: any) {
      alert(`Error creating business: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setTagline('');
    setLogoPath('/images/default-catering-logo.png');
    setPhone1('');
    setPhone2('');
    setEmail('');
    setWebsite('');
    setLocation1('');
    setLocation2('');
    setGstNumber('');
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.email && t.email.toLowerCase().includes(search.toLowerCase())) ||
    (t.location1 && t.location1.toLowerCase().includes(search.toLowerCase()))
  );

  const totalMenuItems = tenants.reduce((acc, t) => acc + (t.item_count || 0), 0);
  const totalQuotations = tenants.reduce((acc, t) => acc + (t.quotation_count || 0), 0);
  const totalEvents = tenants.reduce((acc, t) => acc + (t.event_count || 0), 0);

  return (
    <div className="page-wrapper" style={{ padding: '2rem 2.5rem' }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: '#0A2518',
        borderRadius: 'var(--radius-xl)',
        padding: '2rem 2.5rem',
        color: '#FFFFFF',
        marginBottom: '2rem',
        backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(185, 146, 75, 0.25) 0%, transparent 60%)',
        border: '1.5px solid rgba(185, 146, 75, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(185, 146, 75, 0.2)', color: 'var(--brand-gold)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} />
            <span>Platform Owner Hub</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: '#FAF3E3', lineHeight: 1.2, margin: 0 }}>
            Catering Businesses & Tenant Management
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#B0C4B8', marginTop: '0.35rem', maxWidth: '650px' }}>
            Onboard new catering services, brand their workspace with custom logos and business details, provision their admin credentials, and manage multi-tenant operations.
          </p>
        </div>

        <button
          onClick={() => setIsOnboardModalOpen(true)}
          className="btn btn-primary"
          style={{ gap: '0.5rem', padding: '0.75rem 1.35rem', fontSize: '0.875rem', fontWeight: 700 }}
        >
          <Plus size={18} />
          <span>Onboard New Catering Service</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--brand-gold)', marginBottom: '0.5rem' }}>
            <Building2 size={20} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Catering Businesses</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
            {tenants.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Active SaaS client accounts
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--brand-gold)', marginBottom: '0.5rem' }}>
            <UtensilsCrossed size={20} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Platform Dishes</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
            {totalMenuItems}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Custom recipes and menus
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--brand-gold)', marginBottom: '0.5rem' }}>
            <FileText size={20} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Quotations</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
            {totalQuotations}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Generated proposals & bills
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--brand-gold)', marginBottom: '0.5rem' }}>
            <Calendar size={20} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Events</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
            {totalEvents}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Weddings & banquets planned
          </div>
        </div>
      </div>

      {/* Tenants Table / Cards */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--brand-emerald)' }}>
              Onboarded Catering Services ({tenants.length})
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Select a catering client to inspect or switch into their customized workspace.
            </div>
          </div>

          <div style={{ maxWidth: '280px', width: '100%' }}>
            <input
              type="text"
              placeholder="Search by business name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading catering clients...
          </div>
        ) : filteredTenants.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No catering businesses found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Catering Service & Logo</th>
                  <th style={{ width: '22%' }}>Contact & Locations</th>
                  <th style={{ width: '18%' }}>Admin Account</th>
                  <th style={{ width: '15%' }}>Catalog & Events</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <img
                          src={t.logo_path || '/images/default-catering-logo.png'}
                          alt={t.name}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1.5px solid var(--brand-gold)',
                            backgroundColor: '#FAF7F2',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/images/default-catering-logo.png';
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--brand-emerald)', fontSize: '0.95rem' }}>
                            {t.name}
                          </div>
                          {t.tagline && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--brand-gold)', fontWeight: 600 }}>
                              {t.tagline}
                            </div>
                          )}
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            Slug: {t.slug} • Prefix: {t.quotation_prefix}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {t.phone1 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                            <Phone size={12} color="var(--brand-gold)" />
                            <span>{t.phone1}</span>
                          </div>
                        )}
                        {t.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                            <Mail size={12} color="var(--brand-gold)" />
                            <span>{t.email}</span>
                          </div>
                        )}
                        {t.location1 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <MapPin size={12} color="var(--brand-gold)" />
                            <span>{t.location1}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {t.admin_email || 'admin@' + t.slug + '.com'}
                        </span>
                        <div style={{ fontSize: '0.6875rem', color: '#16A34A', fontWeight: 600 }}>
                          Role: Business Admin
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <div><b>{t.item_count || 0}</b> dishes in menu</div>
                        <div><b>{t.quotation_count || 0}</b> quotations</div>
                        <div><b>{t.event_count || 0}</b> events</div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onSwitchTenant(t)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', gap: '0.35rem', padding: '0.35rem 0.75rem' }}
                        title="Enter and manage this catering company's workspace"
                      >
                        <ExternalLink size={13} />
                        <span>Open Workspace</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Onboard New Catering Client */}
      {isOnboardModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 30, 20, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1.5rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            maxWidth: '820px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            border: '1.5px solid var(--brand-gold-border)'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 2rem',
              backgroundColor: '#0A2518',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(185, 146, 75, 0.3)'
            }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#FAF3E3', margin: 0 }}>
                  Onboard New Catering Business
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--brand-gold)', marginTop: '0.2rem' }}>
                  Set up brand identity, logo, quotation prefix, and primary business administrator
                </div>
              </div>
              <button
                onClick={() => setIsOnboardModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ color: '#EAF2EC', padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '1.5rem 2rem', flex: 1, overflowY: 'auto' }}>
                {/* Brand Identity Section */}
                <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-emerald)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  1. Business & Brand Identity
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Catering Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Feast Catering"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.875rem', fontWeight: 600 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Tagline / Motto
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Premium Banquets & Wedding Caters"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {/* Logo Upload */}
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-parchment)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem'
                }}>
                  <img
                    src={logoPath}
                    alt="Logo preview"
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--brand-gold)',
                      backgroundColor: '#FFFFFF'
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/default-catering-logo.png';
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-emerald)' }}>
                      Catering Company Logo
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      This logo will appear on the top bar, sidebar, and all generated quotation PDFs.
                    </div>
                    <label className="btn btn-outline btn-sm" style={{ display: 'inline-flex', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                      <Upload size={13} />
                      <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>

                {/* Contact & Location Details */}
                <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-emerald)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  2. Contact & Billing Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Primary Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={phone1}
                      onChange={(e) => setPhone1(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Secondary Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43211"
                      value={phone2}
                      onChange={(e) => setPhone2(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Official Email</label>
                    <input
                      type="email"
                      placeholder="events@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>GST / Tax Number</label>
                    <input
                      type="text"
                      placeholder="32AAAAA0000A1Z5"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Address / Branch 1</label>
                    <input
                      type="text"
                      placeholder="Main Office, City Center"
                      value={location1}
                      onChange={(e) => setLocation1(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Quotation Number Prefix</label>
                    <input
                      type="text"
                      placeholder="e.g. QT- or RF-"
                      value={quotationPrefix}
                      onChange={(e) => setQuotationPrefix(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                {/* Provision Admin User */}
                <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-emerald)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  3. Provision Primary Admin User
                </h3>

                <div style={{
                  padding: '1.25rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #E2E8F0',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Admin Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Suresh Kumar"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Login Email
                    </label>
                    <input
                      type="email"
                      placeholder="admin@cateringbrand.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Initial Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter strong password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '1.25rem 2rem',
                backgroundColor: 'var(--bg-parchment)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ minWidth: '150px' }}
                >
                  {isSubmitting ? 'Onboarding...' : 'Create & Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
