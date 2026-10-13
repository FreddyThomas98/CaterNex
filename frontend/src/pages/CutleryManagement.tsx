import React, { useState, useEffect } from 'react';
import { CutleryMasterItem, UserRole } from '../types';
import { api } from '../services/api';
import {
  UtensilsCrossed, Plus, Search, Edit3, Trash2, CheckCircle2,
  Package, Layers, DollarSign, RefreshCw, X, AlertCircle
} from 'lucide-react';

interface CutleryManagementProps {
  userRole: UserRole;
}

const DEFAULT_CATEGORIES = [
  'Plates & Dinnerware',
  'Cutlery',
  'Glassware',
  'Buffet Equipment',
  'Linen & Setup',
  'Serving Ware'
];

export const CutleryManagement: React.FC<CutleryManagementProps> = ({ userRole }) => {
  const isReadOnly = userRole === 'USER';
  const [items, setItems] = useState<CutleryMasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CutleryMasterItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Plates & Dinnerware');
  const [customCategory, setCustomCategory] = useState('');
  const [calcType, setCalcType] = useState<'PER_GUEST' | 'FIXED'>('PER_GUEST');
  const [defaultRatio, setDefaultRatio] = useState<number>(1.0);
  const [unitCost, setUnitCost] = useState<number>(5.0);
  const [isSaving, setIsSaving] = useState(false);

  const loadCutlery = async () => {
    try {
      setLoading(true);
      const data = await api.getCutleryMaster();
      setItems(data);
    } catch (err) {
      console.error('Failed to load cutlery master catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCutlery();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemCategory('Plates & Dinnerware');
    setCustomCategory('');
    setCalcType('PER_GUEST');
    setDefaultRatio(1.0);
    setUnitCost(5.0);
    setIsModalOpen(true);
  };

  const openEditModal = (item: CutleryMasterItem) => {
    setEditingItem(item);
    setItemName(item.name);
    if (DEFAULT_CATEGORIES.includes(item.category)) {
      setItemCategory(item.category);
      setCustomCategory('');
    } else {
      setItemCategory('CUSTOM');
      setCustomCategory(item.category);
    }
    setCalcType(item.calculation_type);
    setDefaultRatio(item.default_ratio || 1.0);
    setUnitCost(item.default_unit_cost || 0.0);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert('Please enter item name');
      return;
    }
    const finalCat = itemCategory === 'CUSTOM' ? (customCategory.trim() || 'General Tableware') : itemCategory;

    try {
      setIsSaving(true);
      const payload: Partial<CutleryMasterItem> = {
        name: itemName.trim(),
        category: finalCat,
        calculation_type: calcType,
        default_ratio: defaultRatio > 0 ? defaultRatio : 1.0,
        default_unit_cost: unitCost >= 0 ? unitCost : 0.0
      };

      if (editingItem) {
        const updated = await api.updateCutleryMasterItem(editingItem.id, payload);
        setItems(prev => prev.map(i => i.id === editingItem.id ? updated : i));
      } else {
        const created = await api.createCutleryMasterItem(payload);
        setItems(prev => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error saving item: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Cutlery State
  const [cutleryToDelete, setCutleryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeletingCutlery, setIsDeletingCutlery] = useState(false);

  const handleDeleteItem = (id: number, name: string) => {
    setCutleryToDelete({ id, name });
  };

  const confirmDeleteCutlery = async () => {
    if (!cutleryToDelete) return;
    const { id } = cutleryToDelete;
    setIsDeletingCutlery(true);
    try {
      setItems(prev => prev.filter(i => i.id !== id));
      setCutleryToDelete(null);
      await api.deleteCutleryMasterItem(id);
      await loadCutlery();
    } catch (err: any) {
      console.error('Error deleting cutlery item:', err);
      alert(`Error deleting item: ${err.message}`);
      await loadCutlery();
    } finally {
      setIsDeletingCutlery(false);
    }
  };

  // Distinct Categories for Filtering
  const allCategories = Array.from(new Set(items.map(i => i.category || 'Tableware')));

  // Filtered Items
  const filteredItems = items.filter(i => {
    const matchesCategory = selectedCategory === 'ALL' || i.category === selectedCategory;
    const matchesSearch = !search.trim() ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.category && i.category.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // KPI Calculations
  const totalItemsCount = items.length;
  const avgCostPerItem = totalItemsCount > 0
    ? (items.reduce((acc, curr) => acc + (curr.default_unit_cost || 0), 0) / totalItemsCount).toFixed(2)
    : '0.00';
  const perGuestCount = items.filter(i => i.calculation_type === 'PER_GUEST').length;
  const fixedCount = items.filter(i => i.calculation_type === 'FIXED').length;

  return (
    <div className="page-wrapper" style={{ maxWidth: '1240px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
              <Layers size={13} />
              Master Catalog
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({totalItemsCount} inventory items)
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', lineHeight: 1.15 }}>
            Cutlery & Tableware Management
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Maintain standard inventory, replacement rates, and unit cost per piece for automatic proposal allocation.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={openAddModal}
            className="btn btn-gold btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
          >
            <Plus size={15} />
            + Add Cutlery Item
          </button>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="luxury-card" style={{ padding: '1.15rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-gold)' }}>
            Total Catalog Items
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 800, color: 'var(--brand-emerald)', marginTop: '0.25rem' }}>
            {totalItemsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Across {allCategories.length} tableware categories
          </div>
        </div>

        <div className="luxury-card" style={{ padding: '1.15rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-gold)' }}>
            Per-Guest Scaled Items
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 800, color: 'var(--brand-emerald)', marginTop: '0.25rem' }}>
            {perGuestCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Plates, tumblers, and flatware
          </div>
        </div>

        <div className="luxury-card" style={{ padding: '1.15rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-gold)' }}>
            Fixed Banquet Gear
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 800, color: 'var(--brand-emerald)', marginTop: '0.25rem' }}>
            {fixedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Chafing dishes, ladles, dispensers
          </div>
        </div>

        <div className="luxury-card" style={{ padding: '1.15rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-gold)' }}>
            Average Cost Per One
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 800, color: 'var(--brand-emerald)', marginTop: '0.25rem' }}>
            ₹{avgCostPerItem}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Unit cost per piece in master catalog
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}>
        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`cat-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
          >
            All Categories ({totalItemsCount})
          </button>
          {allCategories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          backgroundColor: 'var(--bg-canvas)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-full)',
          padding: '0.35rem 0.75rem',
          minWidth: '220px'
        }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search cutlery by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.8125rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Cutlery Inventory Table */}
      <div className="luxury-card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Tableware / Cutlery Item</th>
              <th style={{ width: '18%' }}>Category</th>
              <th style={{ width: '18%' }}>Calculation Formula</th>
              <th style={{ width: '14%' }}>Cost Per One (₹)</th>
              <th style={{ width: '12%' }}>500 Pax Projection</th>
              <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading tableware inventory...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No tableware items found. Click "+ Add Cutlery Item" to start catalog.
                </td>
              </tr>
            ) : (
              filteredItems.map(item => {
                const sampleGuests = 500;
                const sampleQty = item.calculation_type === 'PER_GUEST'
                  ? Math.ceil(sampleGuests * item.default_ratio)
                  : Math.ceil(item.default_ratio);
                const sampleCost = Math.round(sampleQty * item.default_unit_cost);

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-parchment)',
                          border: '1px solid var(--border-medium)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--brand-emerald)',
                          flexShrink: 0
                        }}>
                          <UtensilsCrossed size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            ID #{item.id} • {item.calculation_type}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {item.category}
                      </span>
                    </td>

                    <td>
                      <div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: item.calculation_type === 'PER_GUEST' ? 'var(--brand-emerald)' : '#1E40AF'
                        }}>
                          {item.calculation_type === 'PER_GUEST'
                            ? `${item.default_ratio} × Guest Count`
                            : `${item.default_ratio} Fixed Items`}
                        </span>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {item.calculation_type === 'PER_GUEST' ? 'Scales with headcount' : 'Fixed set per banquet'}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{
                        fontFamily: 'var(--font-serif)',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        color: 'var(--brand-emerald)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.15rem'
                      }}>
                        <span>₹</span>
                        <span>{item.default_unit_cost.toFixed(2)}</span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
                          / piece
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{sampleQty} pcs</span>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                          ₹{sampleCost.toLocaleString()} est.
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {!isReadOnly && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.3rem 0.5rem', color: 'var(--brand-emerald)' }}
                              title="Edit Item"
                            >
                              <Edit3 size={13} color="var(--brand-gold)" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.3rem 0.5rem', color: '#DC2626' }}
                              title="Delete Item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT CUTLERY MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 25, 47, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-parchment)'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--brand-emerald)', margin: 0 }}>
                  {editingItem ? 'Edit Tableware Item' : 'Add New Cutlery / Tableware'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                  Define item specifications and cost per one piece.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveItem} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Item Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Porcelain Dinner Plates (Full) or SS Water Glass"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Tableware Category *
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 500
                  }}
                >
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="CUSTOM">+ Custom Category...</option>
                </select>

                {itemCategory === 'CUSTOM' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom category name..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    style={{
                      marginTop: '0.5rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  />
                )}
              </div>

              {/* Calculation Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Calculation Method *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: calcType === 'PER_GUEST' ? '2px solid var(--brand-emerald)' : '1px solid var(--border-medium)',
                    backgroundColor: calcType === 'PER_GUEST' ? 'var(--bg-parchment)' : '#FFFFFF',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="calcType"
                      checked={calcType === 'PER_GUEST'}
                      onChange={() => {
                        setCalcType('PER_GUEST');
                        if (defaultRatio > 5) setDefaultRatio(1.05);
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Per Guest</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Scales with headcount</div>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: calcType === 'FIXED' ? '2px solid var(--brand-emerald)' : '1px solid var(--border-medium)',
                    backgroundColor: calcType === 'FIXED' ? 'var(--bg-parchment)' : '#FFFFFF',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="calcType"
                      checked={calcType === 'FIXED'}
                      onChange={() => {
                        setCalcType('FIXED');
                        if (defaultRatio < 2) setDefaultRatio(8.0);
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Fixed Quantity</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Standard equipment set</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Ratio & Cost Per Piece Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    {calcType === 'PER_GUEST' ? 'Multiplier per Guest' : 'Default Quantity'} *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    required
                    value={defaultRatio}
                    onChange={(e) => setDefaultRatio(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {calcType === 'PER_GUEST' ? 'e.g. 1.05 = 105 plates per 100 pax' : 'e.g. 8 chafing dishes per event'}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Cost Per One Piece (₹) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.75rem', top: '0.55rem', fontWeight: 700, color: 'var(--brand-gold)' }}>₹</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={unitCost}
                      onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 1.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        outline: 'none',
                        color: 'var(--brand-emerald)'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Unit cost/rental rate per item
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-gold btn-sm"
                  style={{ padding: '0.5rem 1.25rem', fontWeight: 700 }}
                >
                  {isSaving ? 'Saving...' : (editingItem ? 'Update Tableware' : 'Add to Inventory')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Cutlery Confirmation Modal */}
      {cutleryToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => !isDeletingCutlery && setCutleryToDelete(null)}
          style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', width: '90%', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}
          >
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Delete Item?
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{cutleryToDelete.name}</strong> from master inventory?
              <br />
              <span style={{ color: '#B91C1C', fontSize: '0.8rem', fontWeight: 600 }}>This will remove it from the master tableware catalog.</span>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setCutleryToDelete(null)}
                className="btn btn-outline"
                disabled={isDeletingCutlery}
                style={{ flex: 1, padding: '0.65rem', fontWeight: 600 }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteCutlery}
                className="btn"
                disabled={isDeletingCutlery}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: isDeletingCutlery ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeletingCutlery ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
