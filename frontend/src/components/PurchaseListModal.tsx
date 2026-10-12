import React, { useState, useEffect } from 'react';
import { EventPurchaseList, PurchaseItem } from '../types';
import { api } from '../services/api';
import {
  X, CheckSquare, Square, Printer, Download, ShoppingCart,
  AlertTriangle, Filter, CheckCircle2, ChevronRight, Utensils
} from 'lucide-react';

interface PurchaseListModalProps {
  eventId?: number;
  quotationId?: number;
  onClose: () => void;
  onOpenRecipeForDish?: (dishName: string) => void;
}

export const PurchaseListModal: React.FC<PurchaseListModalProps> = ({
  eventId,
  quotationId,
  onClose,
  onOpenRecipeForDish
}) => {
  const [data, setData] = useState<EventPurchaseList | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      let res: EventPurchaseList;
      if (eventId) {
        res = await api.getEventPurchaseList(eventId);
      } else if (quotationId) {
        res = await api.getQuotationPurchaseList(quotationId);
      } else {
        return;
      }
      setData(res);
      setItems(res.items || []);
    } catch (err) {
      console.error('Failed to load purchase list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId, quotationId]);

  const togglePurchased = (index: number) => {
    const updated = [...items];
    updated[index].is_purchased = updated[index].is_purchased ? 0 : 1;
    setItems(updated);
  };

  const handleSaveStatus = async () => {
    if (!eventId) return;
    try {
      setSaving(true);
      await api.saveEventPurchaseList(eventId, {
        items: items.map(it => ({
          ingredient_id: it.ingredient_id,
          is_purchased: it.is_purchased,
          quantity_purchased: it.quantity_purchased || it.quantity_required,
          notes: it.notes || ''
        }))
      });
      alert('Procurement checklist saved successfully!');
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!eventId) {
      window.print();
      return;
    }
    const url = api.getPurchaseListPdfUrl(eventId);
    window.open(url, '_blank');
  };

  // Filter items
  const categoriesList = ['ALL', ...Object.keys(data?.categories_grouped || {})];

  const filteredItems = items.filter(it => {
    const matchCat = selectedCategory === 'ALL' || it.category === selectedCategory;
    const matchSearch = !search.trim() ||
      it.ingredient_name.toLowerCase().includes(search.toLowerCase()) ||
      it.category.toLowerCase().includes(search.toLowerCase()) ||
      (it.dishes_used_in && it.dishes_used_in.some(d => d.toLowerCase().includes(search.toLowerCase())));
    return matchCat && matchSearch;
  });

  const purchasedCount = items.filter(i => i.is_purchased).length;
  const progressPct = items.length > 0 ? Math.round((purchasedCount / items.length) * 100) : 0;

  return (
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
        maxWidth: '1080px',
        width: '100%',
        maxHeight: '94vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(185, 146, 75, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-gold)'
            }}>
              <ShoppingCart size={24} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#FAF3E3', lineHeight: 1.2 }}>
                Event Raw Material Purchase & Procurement List
              </h2>
              <div style={{ fontSize: '0.8125rem', color: 'var(--brand-gold)', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                <span>Headcount: <b>{data?.guest_count || 500} Servings</b></span>
                {data?.event?.event_type && <span>• Occasion: <b>{data.event.event_type}</b></span>}
                {data?.event?.event_date && <span>• Date: <b>{data.event.event_date}</b></span>}
                {data?.event?.venue && <span>• Venue: <b>{data.event.venue}</b></span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleDownloadPdf}
              className="btn btn-outline btn-sm"
              style={{ color: '#FAF3E3', borderColor: 'var(--brand-gold)', gap: '0.4rem', fontSize: '0.75rem' }}
              title="Print / Download PDF Shopping Sheet"
            >
              <Printer size={15} />
              <span>Print Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ color: '#EAF2EC', padding: '0.4rem', borderRadius: '50%' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Top Summary Bar */}
        <div style={{
          padding: '1rem 2rem',
          backgroundColor: 'var(--bg-parchment)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Estimated Procurement</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                ₹{(data?.total_estimated_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-medium)', paddingLeft: '1.5rem' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Raw Ingredients</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {items.length} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>items</span>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-medium)', paddingLeft: '1.5rem' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Procured Progress</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                <div style={{
                  width: '120px',
                  height: '8px',
                  backgroundColor: 'var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    backgroundColor: progressPct === 100 ? '#16A34A' : 'var(--brand-gold)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-emerald)' }}>
                  {purchasedCount}/{items.length} ({progressPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Search box */}
          <div style={{ maxWidth: '240px', width: '100%' }}>
            <input
              type="text"
              placeholder="Search ingredient or dish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div style={{
          padding: '0.65rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto'
        }}>
          {categoriesList.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-sm"
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: selectedCategory === cat ? 700 : 500,
                backgroundColor: selectedCategory === cat ? 'var(--brand-emerald)' : 'var(--bg-parchment)',
                color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--brand-emerald)' : 'var(--border-subtle)'
              }}
            >
              {cat === 'ALL' ? 'All Ingredients' : cat}
              {cat !== 'ALL' && data?.categories_grouped[cat] && (
                <span style={{ marginLeft: '0.35rem', opacity: 0.85 }}>({data.categories_grouped[cat].length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Missing Recipes Warning Banner */}
        {data?.missing_recipes && data.missing_recipes.length > 0 && (
          <div style={{
            margin: '1rem 2rem 0',
            padding: '0.85rem 1.25rem',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.75rem', color: '#92400E', lineHeight: 1.5 }}>
              <b>Note:</b> {data.missing_recipes.length} dish(es) in this event do not have recipe formulas configured yet:
              {' '}
              {data.missing_recipes.map((m, idx) => (
                <span key={idx} style={{ fontWeight: 600, textDecoration: 'underline', marginRight: '0.5rem' }}>
                  {m.dish_name}
                </span>
              ))}
              (Their raw materials are excluded from this shopping list until their recipe is saved in Menu Management).
            </div>
          </div>
        )}

        {/* Content Table */}
        <div style={{ padding: '1rem 2rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Calculating raw materials from recipes...
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No ingredients matching the selected filter.
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '45px', textAlign: 'center' }}>Done</th>
                    <th style={{ width: '28%' }}>Raw Material / Ingredient</th>
                    <th style={{ width: '16%' }}>Category</th>
                    <th style={{ width: '18%' }}>Required Quantity</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>Est. Rate</th>
                    <th style={{ width: '14%', textAlign: 'right' }}>Total Cost</th>
                    <th style={{ width: '12%' }}>Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => {
                    const actualIdx = items.findIndex(i => i.ingredient_id === item.ingredient_id);
                    return (
                      <tr
                        key={item.ingredient_id}
                        style={{
                          backgroundColor: item.is_purchased ? '#F0FDF4' : 'transparent',
                          opacity: item.is_purchased ? 0.75 : 1
                        }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => togglePurchased(actualIdx)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.2rem', color: item.is_purchased ? '#16A34A' : 'var(--text-muted)' }}
                          >
                            {item.is_purchased ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                        </td>
                        <td>
                          <div>
                            <span style={{
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              color: item.is_purchased ? '#166534' : 'var(--brand-emerald)',
                              textDecoration: item.is_purchased ? 'line-through' : 'none'
                            }}>
                              {item.ingredient_name}
                            </span>
                            {item.dishes_used_in && item.dishes_used_in.length > 0 && (
                              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                Used in: {item.dishes_used_in.join(', ')}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                            {item.category}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                            {item.quantity_required.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} {item.unit}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          ₹{item.unit_price.toFixed(2)}/{item.unit}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: 'var(--brand-emerald)' }}>
                          ₹{item.total_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.supplier || 'Local Market'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1.25rem 2rem',
          backgroundColor: 'var(--bg-parchment)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            * Quantities automatically scaled to {data?.guest_count} guests including kitchen trimming & cooking wastage buffer.
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Close
            </button>
            {eventId && (
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={saving}
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
              >
                {saving ? 'Saving...' : 'Save Checklist Status'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
