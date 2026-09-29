import React, { useState, useEffect } from 'react';
import { Client, UserRole } from '../types';
import { api } from '../services/api';
import { Users, Search, Plus, Phone, Mail, MapPin, Sparkles, Edit3, Trash2, Calendar } from 'lucide-react';

interface ClientManagementProps {
  userRole: UserRole;
  onNavigate: (view: string, params?: any) => void;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({ userRole, onNavigate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Edit / Add modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await api.getClients(search);
      setClients(res);
    } catch (err) {
      console.error('Failed to load clients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadClients();
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      alert('Client Name and Phone are required');
      return;
    }
    try {
      if (formData.id) {
        await api.updateClient(formData.id, formData);
      } else {
        await api.createClient(formData);
      }
      setIsModalOpen(false);
      loadClients();
    } catch (err: any) {
      alert(`Error saving client: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this client and associated records?')) return;
    try {
      await api.deleteClient(id);
      loadClients();
    } catch (err: any) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  const handleViewDetail = async (id: number) => {
    try {
      const detail = await api.getClient(id);
      setSelectedClient(detail);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
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
            Client Relations
          </span>
          <h1 style={{ fontSize: '2rem', lineHeight: 1.15 }}>
            Client Directory
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage client profiles, contact information, booking history, and proposals.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ name: '', phone: '', email: '', address: 'Trivandrum', company: '' });
            setIsModalOpen(true);
          }}
          className="btn btn-gold"
        >
          <Plus size={16} />
          Add New Client
        </button>
      </div>

      {/* Search Bar */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '350px', width: '100%' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by name, phone, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.875rem', width: '100%' }}
          />
        </form>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Total registered clients: {clients.length}
        </div>
      </div>

      {/* Grid of Client Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading clients...
          </div>
        ) : clients.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No clients registered yet.
          </div>
        ) : (
          clients.map(client => (
            <div key={client.id} className="luxury-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--brand-emerald)', marginBottom: '0.15rem' }}>
                      {client.name}
                    </h3>
                    {client.company && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--brand-gold)', fontWeight: 600 }}>
                        {client.company}
                      </span>
                    )}
                  </div>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-emerald-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-emerald)',
                    fontWeight: 700,
                    fontSize: '0.8125rem'
                  }}>
                    {client.name.charAt(0)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={13} color="var(--brand-gold)" />
                    <span>{client.phone}</span>
                  </div>
                  {client.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={13} color="var(--brand-gold)" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={13} color="var(--brand-gold)" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{
                marginTop: '1.25rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <button
                  type="button"
                  onClick={() => onNavigate('new-quotation', { clientId: client.id })}
                  className="btn btn-gold btn-sm"
                >
                  <Sparkles size={13} />
                  New Proposal
                </button>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => {
                      setFormData(client);
                      setIsModalOpen(true);
                    }}
                    className="btn btn-outline btn-sm"
                    title="Edit client"
                  >
                    <Edit3 size={13} />
                  </button>
                  {userRole === 'ADMIN' && (
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#B91C1C' }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT CLIENT MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--brand-emerald)', marginBottom: '1.25rem' }}>
              {formData.id ? 'Edit Client Record' : 'Register New Client'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Full Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr Liya Zara Saji"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Phone Number *</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 7736094757"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Email Address</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. liya.zara@example.com"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Location / City</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Trivandrum, Kerala"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="button" onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }}>
                  Save Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
