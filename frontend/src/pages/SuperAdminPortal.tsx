import React, { useState, useEffect } from 'react';
import { Tenant, User } from '../types';
import { api } from '../services/api';
import {
  Building2, Plus, Users, UtensilsCrossed, FileText, Calendar,
  Edit3, Check, X, ShieldCheck, Upload, Phone, Mail, MapPin, Globe,
  Lock, KeyRound, Trash2, UserPlus, Sparkles, LogOut, CheckCircle2,
  AlertCircle, ChefHat, ExternalLink
} from 'lucide-react';

interface SuperAdminPortalProps {
  onLogout: () => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({ onLogout }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State: Onboard Tenant
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [onboardSuccess, setOnboardSuccess] = useState<string | null>(null);

  // Onboard Form State
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

  // Initial Admin User on Onboard
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Modal State: Manage Accounts for a Tenant
  const [accountsModalTenant, setAccountsModalTenant] = useState<Tenant | null>(null);
  const [tenantUsers, setTenantUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'USER'>('USER');
  const [savingUser, setSavingUser] = useState(false);

  // Edit / Password Reset for User
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState<'ADMIN' | 'USER'>('USER');

  // Modal State: Edit Tenant Details
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [savingTenantEdit, setSavingTenantEdit] = useState(false);

  // Modal State: Delete Tenant
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDeleteTenant = async () => {
    if (!deletingTenant) return;
    try {
      setIsDeletingTenant(true);
      setDeleteError(null);
      await api.deleteTenant(deletingTenant.id);
      setDeletingTenant(null);
      await loadTenants();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete catering business');
    } finally {
      setIsDeletingTenant(false);
    }
  };

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const res = await api.uploadLogo(file);
      if (isEdit && editingTenant) {
        setEditingTenant({ ...editingTenant, logo_path: res.url });
      } else {
        setLogoPath(res.url);
      }
    } catch (err: any) {
      alert(`Logo upload failed: ${err.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError(null);
    setOnboardSuccess(null);

    if (!name.trim()) {
      setOnboardError('Please specify the Catering Business Name (under Section 1).');
      return;
    }
    if (adminEmail.trim() && !adminPassword.trim()) {
      setOnboardError('Please enter a password for the initial Admin Account.');
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
      setOnboardSuccess('Business onboarded and admin credentials provisioned successfully!');
      await loadTenants();
      setTimeout(() => {
        setIsOnboardModalOpen(false);
        resetOnboardForm();
      }, 1200);
    } catch (err: any) {
      setOnboardError(err.message || 'Error creating catering business');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOnboardForm = () => {
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
    setOnboardError(null);
    setOnboardSuccess(null);
  };

  // Open Accounts Modal
  const openAccountsModal = async (tenant: Tenant) => {
    setAccountsModalTenant(tenant);
    setIsAddUserOpen(false);
    setEditingUser(null);
    try {
      setLoadingUsers(true);
      const users = await api.getTenantUsers(tenant.id);
      setTenantUsers(users);
    } catch (err: any) {
      alert(`Failed to load accounts: ${err.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Add User to Tenant
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountsModalTenant) return;
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      alert('All fields are required');
      return;
    }
    try {
      setSavingUser(true);
      await api.createTenantUser(accountsModalTenant.id, {
        full_name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
        role: newUserRole
      });
      // Refresh user list & tenant count
      const updated = await api.getTenantUsers(accountsModalTenant.id);
      setTenantUsers(updated);
      setIsAddUserOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('USER');
      await loadTenants();
    } catch (err: any) {
      alert(`Error creating account: ${err.message}`);
    } finally {
      setSavingUser(false);
    }
  };

  // Save User Edit (role, name, password)
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountsModalTenant || !editingUser) return;
    try {
      setSavingUser(true);
      const payload: any = {
        full_name: editUserName.trim(),
        role: editUserRole
      };
      if (editUserPassword.trim()) {
        payload.password = editUserPassword.trim();
      }
      await api.updateTenantUser(accountsModalTenant.id, editingUser.id, payload);
      const updated = await api.getTenantUsers(accountsModalTenant.id);
      setTenantUsers(updated);
      setEditingUser(null);
      setEditUserPassword('');
      await loadTenants();
    } catch (err: any) {
      alert(`Error updating account: ${err.message}`);
    } finally {
      setSavingUser(false);
    }
  };

  // Delete User from Tenant
  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!accountsModalTenant) return;
    if (!window.confirm(`Are you sure you want to delete account ${userEmail}?`)) return;
    try {
      await api.deleteTenantUser(accountsModalTenant.id, userId);
      const updated = await api.getTenantUsers(accountsModalTenant.id);
      setTenantUsers(updated);
      await loadTenants();
    } catch (err: any) {
      alert(`Error deleting account: ${err.message}`);
    }
  };

  // Save Tenant Details Edit
  const handleSaveTenantEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      setSavingTenantEdit(true);
      await api.updateTenant(editingTenant.id, {
        name: editingTenant.name,
        tagline: editingTenant.tagline,
        logo_path: editingTenant.logo_path,
        phone1: editingTenant.phone1,
        phone2: editingTenant.phone2,
        email: editingTenant.email,
        website: editingTenant.website,
        location1: editingTenant.location1,
        location2: editingTenant.location2,
        gst_number: editingTenant.gst_number,
        quotation_prefix: editingTenant.quotation_prefix,
        default_terms: editingTenant.default_terms,
        is_active: editingTenant.is_active
      });
      setEditingTenant(null);
      await loadTenants();
    } catch (err: any) {
      alert(`Error updating business: ${err.message}`);
    } finally {
      setSavingTenantEdit(false);
    }
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.email && t.email.toLowerCase().includes(search.toLowerCase())) ||
    (t.location1 && t.location1.toLowerCase().includes(search.toLowerCase()))
  );

  const totalAccounts = tenants.reduce((acc, t) => acc + (t.user_count || 1), 0);
  const totalMenuItems = tenants.reduce((acc, t) => acc + (t.item_count || 0), 0);
  const totalQuotations = tenants.reduce((acc, t) => acc + (t.quotation_count || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAF9', display: 'flex', flexDirection: 'column' }}>
      {/* Super Admin Master Header */}
      <header style={{
        height: '70px',
        backgroundColor: '#0A192F',
        borderBottom: '1px solid rgba(185, 146, 75, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #C59B4B 0%, #8E6822 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(185, 146, 75, 0.35)'
          }}>
            <ChefHat size={24} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#FAF3E3',
                letterSpacing: '-0.01em'
              }}>
                CaterNex
              </span>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                color: 'var(--brand-gold)',
                backgroundColor: 'rgba(185, 146, 75, 0.2)',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                Master Console
              </span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#9CA8A0', fontWeight: 500 }}>
              Platform Super Admin Control • Client Provisioning & Security
            </div>
          </div>
        </div>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'rgba(185, 146, 75, 0.15)',
            color: 'var(--brand-gold)',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <ShieldCheck size={14} />
            <span>Super Admin (Platform Owner)</span>
          </div>

          <button
            onClick={onLogout}
            className="btn btn-outline btn-sm"
            style={{
              fontSize: '0.8125rem',
              color: '#F87171',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem'
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ padding: '2.5rem 3rem', maxWidth: '1440px', margin: '0 auto', width: '100%', flex: 1 }}>
        {/* Hero Banner */}
        <div style={{
          backgroundColor: '#0A192F',
          borderRadius: '20px',
          padding: '2.25rem 2.75rem',
          color: '#FFFFFF',
          marginBottom: '2rem',
          backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(185, 146, 75, 0.25) 0%, transparent 60%)',
          border: '1.5px solid rgba(185, 146, 75, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 10px 30px rgba(10, 37, 24, 0.15)'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(185, 146, 75, 0.2)',
              color: 'var(--brand-gold)',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '0.5rem'
            }}>
              <ShieldCheck size={14} />
              <span>Catering Client Management Hub</span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2rem',
              color: '#FAF3E3',
              lineHeight: 1.2,
              margin: 0
            }}>
              Onboarded Catering Services & Accounts
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#B0C4B8', marginTop: '0.4rem', maxWidth: '680px', lineHeight: 1.6 }}>
              Onboard new catering businesses to provision their workspace. Maintain 1 Admin account (with full editing privileges) and staff User accounts (view-only mode) for each client.
            </p>
          </div>

          <button
            onClick={() => setIsOnboardModalOpen(true)}
            className="btn btn-primary"
            style={{
              gap: '0.5rem',
              padding: '0.85rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(185, 146, 75, 0.3)'
            }}
          >
            <Plus size={19} />
            <span>Onboard New Catering Service</span>
          </button>
        </div>

        {/* Overview Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(14, 51, 33, 0.08)', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--brand-gold)', marginBottom: '0.5rem' }}>
              <Building2 size={20} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Catering Clients</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
              {tenants.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Onboarded businesses
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(14, 51, 33, 0.08)', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--brand-gold)', marginBottom: '0.5rem' }}>
              <Users size={20} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Managed Accounts</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
              {totalAccounts}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Admins & Staff User accounts
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(14, 51, 33, 0.08)', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--brand-gold)', marginBottom: '0.5rem' }}>
              <UtensilsCrossed size={20} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Dishes</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
              {totalMenuItems}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Across all client catalogs
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(14, 51, 33, 0.08)', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--brand-gold)', marginBottom: '0.5rem' }}>
              <FileText size={20} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Quotations</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
              {totalQuotations}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Proposals created
            </div>
          </div>
        </div>

        {/* Clients Directory */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(14, 51, 33, 0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(14, 51, 33, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-emerald)', margin: 0 }}>
                Client Directory ({tenants.length})
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                All catering companies provisioned under your CaterNex platform license
              </div>
            </div>

            <div style={{ maxWidth: '300px', width: '100%' }}>
              <input
                type="text"
                placeholder="Search business name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ fontSize: '0.8125rem', height: '38px', borderRadius: '8px' }}
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
                    <th style={{ width: '28%' }}>Catering Service & Brand</th>
                    <th style={{ width: '22%' }}>Contact & Locations</th>
                    <th style={{ width: '22%' }}>Account Summary</th>
                    <th style={{ width: '13%' }}>Catalog</th>
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
                              width: '48px',
                              height: '48px',
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
                            <div style={{ fontWeight: 800, color: 'var(--brand-emerald)', fontSize: '1rem' }}>
                              {t.name}
                            </div>
                            {t.tagline && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--brand-gold)', fontWeight: 600 }}>
                                {t.tagline}
                              </div>
                            )}
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              Prefix: <span style={{ fontWeight: 700 }}>{t.quotation_prefix}</span> • Slug: {t.slug}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px'
                            }}>
                              {t.admin_count ?? 1} Admin Account
                            </span>
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              backgroundColor: '#EFF6FF',
                              color: '#1D4ED8',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px'
                            }}>
                              {t.staff_count ?? 0} Staff User
                            </span>
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            Total Accounts: <b>{(t.admin_count ?? 1) + (t.staff_count ?? 0)}</b>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <div><b>{t.item_count || 0}</b> dishes</div>
                          <div><b>{t.quotation_count || 0}</b> quotations</div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => openAccountsModal(t)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.75rem', gap: '0.35rem', padding: '0.35rem 0.75rem' }}
                            title="Manage Admin & User Accounts for this catering service"
                          >
                            <Users size={13} />
                            <span>Manage Accounts</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTenant(t)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
                            title="Edit Brand Details & Settings"
                          >
                            <Edit3 size={13} />
                            <span>Edit Brand</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingTenant(t);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{
                              fontSize: '0.75rem',
                              gap: '0.35rem',
                              padding: '0.35rem 0.65rem',
                              color: '#DC2626',
                              borderColor: 'rgba(239, 68, 68, 0.35)',
                              backgroundColor: 'rgba(239, 68, 68, 0.05)'
                            }}
                            title={`Delete ${t.name}`}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODAL: MANAGE ACCOUNTS (ADMIN & USER) ==================== */}
      {accountsModalTenant && (
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
            borderRadius: '20px',
            maxWidth: '780px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            border: '1.5px solid var(--brand-gold-border)'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 2rem',
              backgroundColor: '#0A192F',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(185, 146, 75, 0.3)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--brand-gold)" />
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#FAF3E3', margin: 0 }}>
                    Account Administration: {accountsModalTenant.name}
                  </h2>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#B0C4B8', marginTop: '0.2rem' }}>
                  Maintained strictly by Super Admin • Admin Account (Full Edit) & User Accounts (View Only)
                </div>
              </div>
              <button
                onClick={() => setAccountsModalTenant(null)}
                className="btn btn-ghost btn-sm"
                style={{ color: '#EAF2EC', padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem 2rem', flex: 1, overflowY: 'auto' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-emerald)', margin: 0 }}>
                    Active Accounts for {accountsModalTenant.name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Admin accounts can edit everything. User accounts can only view.
                  </div>
                </div>

                {!isAddUserOpen && (
                  <button
                    onClick={() => setIsAddUserOpen(true)}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.35rem', fontSize: '0.78125rem' }}
                  >
                    <UserPlus size={14} />
                    <span>Create New Account</span>
                  </button>
                )}
              </div>

              {/* Add Account Inline Form */}
              {isAddUserOpen && (
                <form onSubmit={handleCreateUser} style={{
                  backgroundColor: '#F9FAF9',
                  border: '1.5px solid var(--brand-gold)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                      Add New Account for {accountsModalTenant.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddUserOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Full Name / Staff Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="e.g. Sujith (Staff) or Business Admin"
                        className="form-control"
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Login Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="e.g. user@bandco.com"
                        className="form-control"
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Enter password"
                        className="form-control"
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Account Role & Permission
                      </label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="form-control"
                        style={{ fontSize: '0.8125rem', fontWeight: 700 }}
                      >
                        <option value="ADMIN">ADMIN — Can Edit Everything (Menu, Recipes, Quotes, Events)</option>
                        <option value="USER">USER — View Only (Can only browse & view proposals)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddUserOpen(false)}
                      className="btn btn-outline btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingUser}
                      className="btn btn-primary btn-sm"
                    >
                      {savingUser ? 'Creating...' : 'Save & Provision Account'}
                    </button>
                  </div>
                </form>
              )}

              {/* Edit Account Modal / Section */}
              {editingUser && (
                <form onSubmit={handleSaveUserEdit} style={{
                  backgroundColor: '#EFF6FF',
                  border: '1.5px solid #93C5FD',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E40AF' }}>
                      Edit Account: {editingUser.email}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editUserName}
                        onChange={(e) => setEditUserName(e.target.value)}
                        className="form-control"
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Role
                      </label>
                      <select
                        value={editUserRole}
                        onChange={(e) => setEditUserRole(e.target.value as any)}
                        className="form-control"
                        style={{ fontSize: '0.8125rem', fontWeight: 700 }}
                      >
                        <option value="ADMIN">ADMIN — Can Edit Everything</option>
                        <option value="USER">USER — View Only (Staff)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Reset Password (leave empty to keep current)
                      </label>
                      <input
                        type="password"
                        value={editUserPassword}
                        onChange={(e) => setEditUserPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="form-control"
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="btn btn-outline btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingUser}
                      className="btn btn-primary btn-sm"
                    >
                      {savingUser ? 'Saving...' : 'Update Account'}
                    </button>
                  </div>
                </form>
              )}

              {/* Accounts List */}
              {loadingUsers ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading accounts...
                </div>
              ) : tenantUsers.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No accounts found for this catering service. Click "Create New Account" above to add one.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {tenantUsers.map(u => (
                    <div
                      key={u.id}
                      style={{
                        backgroundColor: u.role === 'ADMIN' ? '#F0FDF4' : '#F8FAFC',
                        border: u.role === 'ADMIN' ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.85rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            {u.full_name}
                          </span>
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '9999px',
                            backgroundColor: u.role === 'ADMIN' ? '#15803D' : '#2563EB',
                            color: '#FFFFFF'
                          }}>
                            {u.role === 'ADMIN' ? 'ADMIN (Can Edit Everything)' : 'USER (View Only)'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Email: <b>{u.email}</b>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u);
                            setEditUserName(u.full_name);
                            setEditUserRole(u.role === 'ADMIN' ? 'ADMIN' : 'USER');
                            setEditUserPassword('');
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', gap: '0.35rem' }}
                        >
                          <Edit3 size={13} />
                          <span>Edit / Reset Password</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', color: '#B91C1C', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
                          title="Delete Account"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              padding: '1rem 2rem',
              backgroundColor: '#F9FAF9',
              borderTop: '1px solid rgba(14, 51, 33, 0.08)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={() => setAccountsModalTenant(null)}
                className="btn btn-primary btn-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ONBOARD NEW CATERING BUSINESS ==================== */}
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
            borderRadius: '20px',
            maxWidth: '820px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            border: '1.5px solid var(--brand-gold-border)'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 2rem',
              backgroundColor: '#0A192F',
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
                  Set up brand identity, quotation prefix, and initial Business Admin credentials
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
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-emerald)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  1. Brand Identity & Business Profile
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Catering Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Royal Banquet & Caters"
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Brand Tagline
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. LUXURY WEDDINGS & CORPORATE EVENTS"
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Quotation Prefix (e.g. QT-2026-)
                    </label>
                    <input
                      type="text"
                      value={quotationPrefix}
                      onChange={(e) => setQuotationPrefix(e.target.value)}
                      placeholder="QT-"
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      GST / Tax Number
                    </label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      placeholder="32AAAAA0000A1Z5"
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                {/* Logo Upload */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#F8FAF9', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Business Logo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={logoPath}
                      alt="Logo Preview"
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--brand-gold)' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/default-catering-logo.png';
                      }}
                    />
                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', gap: '0.35rem' }}>
                      <Upload size={14} />
                      <span>{uploadingLogo ? 'Uploading...' : 'Upload Brand Logo'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e)} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* Contact & Locations */}
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-emerald)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  2. Contact & Locations
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Primary Phone</label>
                    <input
                      type="text"
                      value={phone1}
                      onChange={(e) => setPhone1(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Secondary Phone</label>
                    <input
                      type="text"
                      value={phone2}
                      onChange={(e) => setPhone2(e.target.value)}
                      placeholder="+91 98765 43211"
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Business Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="info@catering.com"
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Location 1 / Head Office</label>
                    <input
                      type="text"
                      value={location1}
                      onChange={(e) => setLocation1(e.target.value)}
                      placeholder="Kollam, Kerala"
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                {/* Primary Admin Account */}
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: '#EFF6FF',
                  borderRadius: '12px',
                  border: '1px solid #BFDBFE',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <KeyRound size={16} color="#1D4ED8" />
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E40AF', margin: 0 }}>
                      3. Initial Admin Account Credentials (Can Edit Everything)
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Admin Name</label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="e.g. Client Manager"
                        className="form-control"
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Admin Email</label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@client.com"
                        className="form-control"
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Admin Password</label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="form-control"
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#1E40AF', marginTop: '0.5rem' }}>
                    Additional Staff User accounts (view-only) can be provisioned at any time via the "Manage Accounts" button.
                  </div>
                </div>
              </div>

              {/* Inline alerts */}
              {onboardError && (
                <div style={{
                  margin: '0 2rem 1rem',
                  padding: '0.85rem 1.25rem',
                  backgroundColor: '#FEF2F2',
                  border: '1.5px solid #F87171',
                  borderRadius: '10px',
                  color: '#991B1B',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={18} />
                  <span>{onboardError}</span>
                </div>
              )}

              {onboardSuccess && (
                <div style={{
                  margin: '0 2rem 1rem',
                  padding: '0.85rem 1.25rem',
                  backgroundColor: '#ECFDF5',
                  border: '1.5px solid #34D399',
                  borderRadius: '10px',
                  color: '#065F46',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle2 size={18} />
                  <span>{onboardSuccess}</span>
                </div>
              )}

              {/* Actions Footer */}
              <div style={{
                padding: '1.25rem 2rem',
                backgroundColor: '#F8FAF9',
                borderTop: '1px solid rgba(14, 51, 33, 0.08)',
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
                >
                  {isSubmitting ? 'Onboarding...' : 'Onboard Business & Provision Accounts'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT BRAND DETAILS ==================== */}
      {editingTenant && (
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
            borderRadius: '20px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            border: '1.5px solid var(--brand-gold-border)'
          }}>
            <div style={{
              padding: '1.25rem 2rem',
              backgroundColor: '#0A192F',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(185, 146, 75, 0.3)'
            }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#FAF3E3', margin: 0 }}>
                Edit Brand: {editingTenant.name}
              </h2>
              <button
                onClick={() => setEditingTenant(null)}
                className="btn btn-ghost btn-sm"
                style={{ color: '#EAF2EC', padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTenantEdit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '1.5rem 2rem', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Business Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTenant.name}
                      onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={editingTenant.tagline || ''}
                      onChange={(e) => setEditingTenant({ ...editingTenant, tagline: e.target.value })}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Quotation Prefix
                    </label>
                    <input
                      type="text"
                      value={editingTenant.quotation_prefix || ''}
                      onChange={(e) => setEditingTenant({ ...editingTenant, quotation_prefix: e.target.value })}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={editingTenant.gst_number || ''}
                      onChange={(e) => setEditingTenant({ ...editingTenant, gst_number: e.target.value })}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Phone 1
                    </label>
                    <input
                      type="text"
                      value={editingTenant.phone1 || ''}
                      onChange={(e) => setEditingTenant({ ...editingTenant, phone1: e.target.value })}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Phone 2
                    </label>
                    <input
                      type="text"
                      value={editingTenant.phone2 || ''}
                      onChange={(e) => setEditingTenant({ ...editingTenant, phone2: e.target.value })}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingTenant.email || ''}
                      onChange={(e) => setEditingTenant({ ...editingTenant, email: e.target.value })}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={editingTenant.location1 || ''}
                      onChange={(e) => setEditingTenant({ ...editingTenant, location1: e.target.value })}
                      className="form-control"
                      style={{ fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Default Terms & Conditions
                  </label>
                  <textarea
                    rows={3}
                    value={editingTenant.default_terms || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, default_terms: e.target.value })}
                    className="form-control"
                    style={{ fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              <div style={{
                padding: '1.25rem 2rem',
                backgroundColor: '#F8FAF9',
                borderTop: '1px solid rgba(14, 51, 33, 0.08)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}>
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTenantEdit}
                  className="btn btn-primary"
                >
                  {savingTenantEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CONFIRM DELETE CATERING CLIENT ==================== */}
      {deletingTenant && (
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
          zIndex: 1200,
          padding: '1.5rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            border: '1.5px solid #FCA5A5'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              backgroundColor: '#7F1D1D',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} color="#FCA5A5" />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#FFF', margin: 0 }}>
                  Delete Catering Business?
                </h2>
              </div>
              <button
                onClick={() => { setDeletingTenant(null); setDeleteError(null); }}
                className="btn btn-ghost btn-sm"
                style={{ color: '#FEE2E2', padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.75rem' }}>
              <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6, margin: 0 }}>
                Are you sure you want to delete <b style={{ color: '#991B1B' }}>{deletingTenant.name}</b>?
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5, marginTop: '0.65rem' }}>
                This will permanently delete the catering workspace, catalog, quotations, and all associated <b>Admin & Staff User accounts</b>. This action cannot be undone.
              </p>

              {deleteError && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #F87171',
                  borderRadius: '8px',
                  color: '#991B1B',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.75rem',
              backgroundColor: '#F9FAFB',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                onClick={() => { setDeletingTenant(null); setDeleteError(null); }}
                className="btn btn-outline"
                disabled={isDeletingTenant}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTenant}
                className="btn btn-primary"
                style={{ backgroundColor: '#DC2626', borderColor: '#DC2626', color: '#FFF' }}
                disabled={isDeletingTenant}
              >
                {isDeletingTenant ? 'Deleting...' : 'Yes, Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
