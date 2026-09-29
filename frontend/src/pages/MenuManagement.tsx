import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, Category, UserRole, PricingUnit, ServiceType } from '../types';
import { api } from '../services/api';
import { Search, Plus, Edit3, Check, X, Flame, Sparkles, Trash2, Upload, Image as ImageIcon, Utensils } from 'lucide-react';

interface MenuManagementProps {
  userRole: UserRole;
}

export const MenuManagement: React.FC<MenuManagementProps> = ({ userRole }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    category_id: number;
    selling_price: number;
    food_cost: number;
    pricing_unit: PricingUnit;
    service_type: ServiceType;
    description: string;
    image_url: string;
    is_active: number;
  }>({
    name: '',
    category_id: 1,
    selling_price: 150,
    food_cost: 60,
    pricing_unit: 'PER_PERSON',
    service_type: 'STANDARD',
    description: '',
    image_url: '',
    is_active: 1
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, items] = await Promise.all([
        api.getCategories(),
        api.getMenuItems()
      ]);
      setCategories(cats);
      setMenuItems(items);
      if (cats.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: cats[0].id }));
      }
    } catch (err) {
      console.error('Failed to load menu data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category_id: categories.length > 0 ? (selectedCatId || categories[0].id) : 1,
      selling_price: 180,
      food_cost: 72, // 40% default
      pricing_unit: 'PER_PERSON',
      service_type: 'STANDARD',
      description: '',
      image_url: '',
      is_active: 1
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    const sp = item.selling_price || 0;
    const fc = item.food_cost ?? Math.round(sp * 0.40);
    setFormData({
      name: item.name,
      category_id: item.category_id || (categories[0]?.id ?? 1),
      selling_price: sp,
      food_cost: fc,
      pricing_unit: item.pricing_unit,
      service_type: item.service_type,
      description: item.description || '',
      image_url: item.image_url || '',
      is_active: item.is_active
    });
    setIsEditModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const res = await api.uploadImage(file);
      setFormData(prev => ({ ...prev, image_url: res.url }));
    } catch (err: any) {
      alert(`Failed to upload image: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveNewItem = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a dish name');
      return;
    }
    try {
      setIsSaving(true);
      const sp = formData.selling_price || 0;
      const fc = formData.food_cost || Math.round(sp * 0.40);
      const lc = Math.round(sp * 0.15);
      const pc = Math.round(sp * 0.05);
      const oc = Math.round(sp * 0.08);

      await api.createMenuItem({
        name: formData.name.trim(),
        category_id: formData.category_id,
        selling_price: sp,
        food_cost: fc,
        labour_cost: lc,
        packaging_cost: pc,
        overhead_cost: oc,
        pricing_unit: formData.pricing_unit,
        service_type: formData.service_type,
        description: formData.description.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
        is_active: 1
      });

      setIsAddModalOpen(false);
      await loadData();
      alert(`"${formData.name}" added to Menu and Costing successfully!`);
    } catch (err: any) {
      alert(`Error adding menu item: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEditItem = async () => {
    if (!editingItem) return;
    if (!formData.name.trim()) {
      alert('Please enter a dish name');
      return;
    }
    try {
      setIsSaving(true);
      const sp = formData.selling_price || 0;
      const fc = formData.food_cost || Math.round(sp * 0.40);
      const lc = Math.round(sp * 0.15);
      const pc = Math.round(sp * 0.05);
      const oc = Math.round(sp * 0.08);

      await api.updateMenuItem(editingItem.id, {
        name: formData.name.trim(),
        category_id: formData.category_id,
        selling_price: sp,
        food_cost: fc,
        labour_cost: lc,
        packaging_cost: pc,
        overhead_cost: oc,
        pricing_unit: formData.pricing_unit,
        service_type: formData.service_type,
        description: formData.description.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
        is_active: formData.is_active
      });

      setIsEditModalOpen(false);
      await loadData();
      alert(`"${formData.name}" updated successfully!`);
    } catch (err: any) {
      alert(`Error updating menu item: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${item.name}" from the menu?\n\nThis will remove it from the brochure menu, active costing, and quotation selection.`
    );
    if (!confirmDelete) return;

    try {
      // Optimistic instant UI update
      setMenuItems(prev => prev.filter(m => m.id !== item.id));
      if (isEditModalOpen) {
        setIsEditModalOpen(false);
      }

      await api.deleteMenuItem(item.id);
      await loadData();
      alert(`"${item.name}" has been removed successfully.`);
    } catch (err: any) {
      await loadData(); // Revert on failure
      alert(`Failed to delete item: ${err.message}`);
    }
  };

  // Filter items by category & search
  const filteredItems = menuItems.filter(item => {
    const matchesCat = selectedCatId === null || item.category_id === selectedCatId;
    const matchesSearch = !search || 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

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
            Brochure Menu & Items
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Official catering delicacies from B & Co with culinary photography. Dishes sync directly with Costing & Proposals.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn btn-gold btn-sm"
        >
          <Plus size={15} />
          Add New Dish
        </button>
      </div>

      {/* Categories Toolbar & Search */}
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
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', flex: 1, paddingBottom: '0.2rem' }}>
          <button
            type="button"
            onClick={() => setSelectedCatId(null)}
            className={`cat-pill ${selectedCatId === null ? 'active' : ''}`}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78125rem' }}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCatId(cat.id)}
              className={`cat-pill ${selectedCatId === cat.id ? 'active' : ''}`}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.78125rem' }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '240px' }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search brochure dishes..."
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
      </div>

      {/* Table */}
      <div className="luxury-card" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Dish</th>
              <th>Category</th>
              <th>Pricing Unit</th>
              <th>Service Type</th>
              <th>Selling Price</th>
              <th>Food Cost</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  Loading brochure dishes...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No items found. Click "Add New Dish" to add to this category.
                </td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: 'var(--radius-md)',
                            objectFit: 'cover',
                            border: '1px solid var(--border-subtle)',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-parchment)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          flexShrink: 0
                        }}>
                          <Utensils size={18} />
                        </div>
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--brand-emerald)', fontSize: '0.9rem' }}>
                            {item.name}
                          </span>
                          {item.service_type === 'LIVE_COUNTER' && (
                            <span className="badge badge-live" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>
                              <Flame size={10} />
                              LIVE
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {item.category_name || categories.find(c => c.id === item.category_id)?.name || 'General'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-gold" style={{ fontSize: '0.6875rem' }}>
                      {item.pricing_unit.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {item.service_type}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, color: 'var(--brand-emerald)', fontSize: '1rem' }}>
                      ₹{item.selling_price}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      ₹{item.food_cost ?? Math.round((item.selling_price || 0) * 0.40)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                        title="Edit Dish Details, Photo & Cost"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item);
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.45rem', color: '#DC2626', borderColor: '#FCA5A5' }}
                        title="Delete Dish"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Dish Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 31, 23, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--brand-gold-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isEditModalOpen ? 'Update Catalog Item' : 'New Catalog Item'}
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--brand-emerald)' }}>
                  {isEditModalOpen ? `Edit: ${editingItem?.name}` : 'Add New Brochure Dish'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Dish Photo Preview & Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Dish Photography
                </label>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-parchment)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1.5px solid var(--border-medium)'
                  }}>
                    {formData.image_url ? (
                      <img
                        src={formData.image_url}
                        alt="Dish Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon size={26} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Upload size={13} />
                        <span>{isUploadingImage ? 'Uploading...' : 'Upload Photo'}</span>
                      </button>

                      {formData.image_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', color: '#DC2626' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Or paste image URL (/images/dishes/...)"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.35rem 0.5rem',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: '#FFFFFF'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Dish Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kozhi Porichathu / Prawns Roast"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Pricing Unit *
                  </label>
                  <select
                    value={formData.pricing_unit}
                    onChange={(e) => setFormData({ ...formData, pricing_unit: e.target.value as PricingUnit })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="PER_PERSON">Per Person</option>
                    <option value="PER_PLATE">Per Plate</option>
                    <option value="PER_KG">Per KG</option>
                    <option value="PER_EVENT">Per Event</option>
                    <option value="PER_PIECE">Per Piece</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.selling_price}
                    onChange={(e) => {
                      const sp = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        selling_price: sp,
                        food_cost: Math.round(sp * 0.40)
                      });
                    }}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Estimated Food Cost (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.food_cost}
                    onChange={(e) => setFormData({ ...formData, food_cost: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Service Type
                </label>
                <select
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value as ServiceType })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                >
                  <option value="STANDARD">Standard Buffet / Banquet</option>
                  <option value="LIVE_COUNTER">Live Counter Station</option>
                  <option value="STATION">Food Stall / Beverage Station</option>
                  <option value="SPECIAL">Special Chef Service</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Description / Serving Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Served hot with homemade mint chutney"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                />
              </div>

              <div style={{
                backgroundColor: 'var(--bg-parchment)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--brand-emerald)',
                border: '1px solid var(--brand-gold-border)'
              }}>
                ✨ <strong>Automatic Sync:</strong> This item and photo will immediately appear in the brochure menu, proposal builder, and the back-office costing table.
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                {isEditModalOpen && editingItem ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(editingItem)}
                    className="btn btn-outline"
                    style={{ color: '#B91C1C', borderColor: '#FECACA', backgroundColor: '#FEF2F2', fontSize: '0.8125rem' }}
                  >
                    <Trash2 size={14} />
                    <span>Remove Dish</span>
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={isEditModalOpen ? handleSaveEditItem : handleSaveNewItem}
                    disabled={isSaving}
                    className="btn btn-gold"
                  >
                    {isSaving ? 'Saving...' : (isEditModalOpen ? 'Save Changes' : 'Add Dish & Sync Cost')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
