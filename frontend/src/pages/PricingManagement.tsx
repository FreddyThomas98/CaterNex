import React, { useState, useEffect } from 'react';
import { MenuItem, UserRole } from '../types';
import { api } from '../services/api';
import { Tag, Search, Edit3, History, Save, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PricingManagementProps {
  userRole: UserRole;
}

export const PricingManagement: React.FC<PricingManagementProps> = ({ userRole }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Price Edit Modal
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [changeReason, setChangeReason] = useState<string>('Standard menu revision');

  // History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyItemName, setHistoryItemName] = useState('');

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await api.getMenuItems();
      setItems(res);
    } catch (err) {
      console.error('Failed to load items for pricing', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = items.filter(i => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return i.name.toLowerCase().includes(q) || (i.category_name && i.category_name.toLowerCase().includes(q));
  });

  const handleUpdatePrice = async () => {
    if (!selectedItem) return;
    try {
      await api.updatePrice(selectedItem.id, newPrice, changeReason);
      setSelectedItem(null);
      loadItems();
    } catch (err: any) {
      alert(`Error updating price: ${err.message}`);
    }
  };

  const handleOpenHistory = async (item: MenuItem) => {
    try {
      const records = await api.getPriceHistory(item.id);
      setHistoryRecords(records);
      setHistoryItemName(item.name);
      setIsHistoryModalOpen(true);
    } catch (err: any) {
      alert(`Error loading history: ${err.message}`);
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
            Commercial Administration
          </span>
          <h1 style={{ fontSize: '2rem', lineHeight: 1.15 }}>
            Selling Price Management
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Direct commercial control over customer-facing prices. Independent from internal costs.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          backgroundColor: 'var(--bg-canvas)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '0.4rem 0.75rem',
          maxWidth: '320px',
          width: '100%'
        }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search items for price adjustment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.8125rem', width: '100%' }}
          />
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Showing {filteredItems.length} menu dishes
        </div>
      </div>

      {/* Pricing Table */}
      <div className="luxury-card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Dish</th>
              <th>Category</th>
              <th>Pricing Unit</th>
              <th>Current Selling Price</th>
              <th>Type / Origin</th>
              <th>Audit Log</th>
              <th style={{ textAlign: 'right' }}>Update</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading pricing master...
                </td>
              </tr>
            ) : filteredItems.map(item => (
              <tr key={item.id}>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--brand-emerald)' }}>
                    {item.name}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {item.category_name}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {item.pricing_unit.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  {item.selling_price !== null ? (
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                      ₹{item.selling_price}
                    </span>
                  ) : (
                    <span className="badge badge-gold">Pending Review</span>
                  )}
                </td>
                <td>
                  <span className="badge badge-emerald">Active Brochure</span>
                </td>
                <td>
                  <button
                    onClick={() => handleOpenHistory(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--brand-gold)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    <History size={13} />
                    Audit Logs
                  </button>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setNewPrice(item.selling_price || 0);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    <Edit3 size={13} />
                    Change Price
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PRICE UPDATE MODAL */}
      {selectedItem && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--brand-emerald)', marginBottom: '0.5rem' }}>
              Update Selling Price
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {selectedItem.name} ({selectedItem.pricing_unit})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  New Customer Selling Price (₹)
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    fontSize: '1.25rem',
                    fontFamily: 'var(--font-serif)',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--brand-gold)',
                    color: 'var(--brand-emerald)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Reason for Revision
                </label>
                <input
                  type="text"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdatePrice}
                  className="btn btn-gold"
                  style={{ flex: 1 }}
                >
                  Confirm New Price
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRICE HISTORY AUDIT MODAL */}
      {isHistoryModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsHistoryModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--brand-emerald)' }}>
                Price History: {historyItemName}
              </h3>
              <button onClick={() => setIsHistoryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {historyRecords.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '1.5rem 0', textAlign: 'center' }}>
                No prior price adjustments logged for this dish.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {historyRecords.map(r => (
                  <div
                    key={r.id}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-parchment)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>₹{r.old_price ?? 'N/A'} → <span style={{ color: 'var(--brand-emerald)' }}>₹{r.new_price}</span></span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{r.created_at?.slice(0, 16)}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Reason: {r.reason || 'None specified'} • Changed by: {r.changed_by}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
