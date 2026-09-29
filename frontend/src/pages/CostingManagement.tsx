import React, { useState, useEffect } from 'react';
import { UserRole, CostingOverview, CostingItem } from '../types';
import { api } from '../services/api';
import { ShieldAlert, TrendingUp, Edit3, Check, X, Search, DollarSign } from 'lucide-react';

interface CostingManagementProps {
  userRole: UserRole;
}

export const CostingManagement: React.FC<CostingManagementProps> = ({ userRole }) => {
  const isAuthorized = userRole === 'ADMIN' || userRole === 'MANAGER';
  const [overview, setOverview] = useState<CostingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit Cost Modal State
  const [editingItem, setEditingItem] = useState<CostingItem | null>(null);
  const [editSellingPrice, setEditSellingPrice] = useState<number>(0);
  const [editFoodCost, setEditFoodCost] = useState<number>(0);
  const [editLabourCost, setEditLabourCost] = useState<number>(0);
  const [editPackagingCost, setEditPackagingCost] = useState<number>(0);
  const [editOverheadCost, setEditOverheadCost] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const loadCosting = async () => {
    try {
      setLoading(true);
      const ov = await api.getCostingOverview();
      setOverview(ov);
    } catch (err) {
      console.error('Failed to load costing', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    loadCosting();
  }, [isAuthorized]);

  const handleOpenEdit = (item: CostingItem) => {
    setEditingItem(item);
    setEditSellingPrice(item.selling_price);
    setEditFoodCost(item.food_cost);
    setEditLabourCost(item.labour_cost);
    setEditPackagingCost(item.packaging_cost);
    setEditOverheadCost(item.overhead_cost);
  };

  const handleSaveCost = async () => {
    if (!editingItem) return;
    try {
      setIsSaving(true);
      await api.updateItemCost(editingItem.id, {
        selling_price: editSellingPrice,
        food_cost: editFoodCost,
        labour_cost: editLabourCost,
        packaging_cost: editPackagingCost,
        overhead_cost: editOverheadCost
      });
      setEditingItem(null);
      await loadCosting();
    } catch (err: any) {
      alert(`Error updating cost: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Preview calculations for modal
  const previewTotalCost = Math.round((editFoodCost + editLabourCost + editPackagingCost + editOverheadCost) * 100) / 100;
  const previewProfit = Math.round((editSellingPrice - previewTotalCost) * 100) / 100;
  const previewMargin = editSellingPrice > 0 ? Math.round((previewProfit / editSellingPrice) * 1000) / 10 : 0;

  const filteredItems = overview?.items.filter(item => {
    if (!search.trim()) return true;
    return item.name.toLowerCase().includes(search.toLowerCase());
  }) || [];

  if (!isAuthorized) {
    return (
      <div className="page-wrapper" style={{ maxWidth: '600px', margin: '4rem auto' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #FECACA',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          textAlign: 'center'
        }}>
          <ShieldAlert size={40} color="#DC2626" style={{ marginBottom: '0.75rem' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', color: '#991B1B', fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            Internal Costing Confidential
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#7F1D1D', lineHeight: 1.5 }}>
            Internal recipe ingredient costs, staff wages, and profit margins are confidential to Management and hidden from Salesperson proposals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '1240px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', lineHeight: 1.15 }}>
            Internal Costing & Margins
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Confidential back-office costing for menu dishes. Click any row to edit food, labour, or packaging costs.
          </p>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--brand-gold-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Average Profit Margin
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
              {overview?.average_margin_pct ?? 32.4}%
            </div>
          </div>
          <TrendingUp size={20} color="var(--brand-gold)" />
        </div>
      </div>

      {/* Search Toolbar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '0.75rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '320px' }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search dishes to edit cost..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '0.8125rem',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Showing {filteredItems.length} of {overview?.item_count || 0} items
        </div>
      </div>

      {/* Item Margin Breakdown Table */}
      <div className="luxury-card" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Dish Name</th>
              <th>Selling Price</th>
              <th>Food Cost</th>
              <th>Labour</th>
              <th>Packaging</th>
              <th>Overhead</th>
              <th>Total Cost</th>
              <th>Profit</th>
              <th>Margin %</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  Loading costing records...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No items matched your search.
                </td>
              </tr>
            ) : (
              filteredItems.map(i => (
                <tr key={i.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--brand-emerald)' }}>{i.name}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>
                      {i.pricing_unit.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                      ₹{i.selling_price}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>₹{i.food_cost}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₹{i.labour_cost}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₹{i.packaging_cost}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₹{i.overhead_cost}</td>
                  <td style={{ fontWeight: 700 }}>₹{i.total_internal_cost}</td>
                  <td style={{ fontWeight: 700, color: '#15803D' }}>₹{i.internal_profit}</td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: i.margin_pct >= 30 ? '#15803D' : '#D97706',
                      backgroundColor: i.margin_pct >= 30 ? '#DCFCE7' : '#FEF3C7',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem'
                    }}>
                      {i.margin_pct}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleOpenEdit(i)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                      title="Edit Cost Breakdown"
                    >
                      <Edit3 size={13} color="var(--brand-gold)" />
                      <span>Edit Cost</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT COST MODAL */}
      {editingItem && (
        <div className="modal-backdrop" onClick={() => setEditingItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: '0.25rem' }}>
                  Internal Costing
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--brand-emerald)' }}>
                  Edit Cost: {editingItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={editSellingPrice}
                  onChange={(e) => setEditSellingPrice(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Food Cost (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editFoodCost}
                    onChange={(e) => setEditFoodCost(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Labour Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editLabourCost}
                    onChange={(e) => setEditLabourCost(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Packaging Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editPackagingCost}
                    onChange={(e) => setEditPackagingCost(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Overhead Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editOverheadCost}
                    onChange={(e) => setEditOverheadCost(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div style={{
                backgroundColor: 'var(--bg-parchment)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--brand-gold-border)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.5rem',
                marginTop: '0.5rem',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Total Cost</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    ₹{previewTotalCost}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Profit</div>
                  <div style={{ fontWeight: 700, color: previewProfit >= 0 ? '#15803D' : '#DC2626', fontSize: '0.95rem' }}>
                    ₹{previewProfit}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Margin</div>
                  <div style={{
                    fontWeight: 800,
                    color: previewMargin >= 30 ? '#15803D' : '#D97706',
                    fontSize: '0.95rem'
                  }}>
                    {previewMargin}%
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCost}
                  disabled={isSaving}
                  className="btn btn-gold"
                >
                  {isSaving ? 'Saving...' : 'Save Cost Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
