import React, { useState, useEffect } from 'react';
import { MenuItem, Ingredient, Recipe, RecipeIngredient } from '../types';
import { api } from '../services/api';
import { X, Plus, Trash2, Edit3, Save, Calculator, AlertCircle, ChefHat, Sparkles } from 'lucide-react';

interface RecipeModalProps {
  item: MenuItem;
  onClose: () => void;
  onSaved: () => void;
  readOnly?: boolean;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ item, onClose, onSaved, readOnly = false }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);

  // Recipe state
  const [portionYield, setPortionYield] = useState<number>(100);
  const [prepTimeMins, setPrepTimeMins] = useState<number>(60);
  const [instructions, setInstructions] = useState<string>('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  // Quick add master ingredient state
  const [showQuickAddIng, setShowQuickAddIng] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState('Fresh Vegetables');
  const [newIngUnit, setNewIngUnit] = useState('kg');
  const [newIngPrice, setNewIngPrice] = useState<number>(100);
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  // Status banners
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [recipeSuccess, setRecipeSuccess] = useState<string | null>(null);

  // Edit Master Ingredient state
  const [isEditIngOpen, setIsEditIngOpen] = useState(false);
  const [editingIngId, setEditingIngId] = useState<number | null>(null);
  const [editIngData, setEditIngData] = useState({
    name: '',
    category: 'Fresh Vegetables',
    unit: 'kg',
    purchase_price: 100,
    wastage_pct: 5.0,
    supplier: ''
  });
  const [editIngSaving, setEditIngSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ingList, recipeData] = await Promise.all([
          api.getIngredients(),
          api.getRecipeByMenuItem(item.id)
        ]);
        setAllIngredients(ingList);

        if (recipeData) {
          setPortionYield(recipeData.portion_yield || 100);
          setPrepTimeMins(recipeData.prep_time_mins || 60);
          setInstructions(recipeData.instructions || '');
          setIngredients(recipeData.ingredients || []);
        }
      } catch (err) {
        console.error('Failed to load recipe', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [item.id]);

  const handleAddIngredientRow = () => {
    if (allIngredients.length === 0) return;
    const firstIng = allIngredients[0];
    const newRow: RecipeIngredient = {
      ingredient_id: firstIng.id,
      ingredient_name: firstIng.name,
      ingredient_category: firstIng.category,
      quantity: 1,
      unit: firstIng.unit,
      purchase_price: firstIng.purchase_price,
      wastage_pct: firstIng.wastage_pct,
      line_cost: Math.round(firstIng.purchase_price * (1 + (firstIng.wastage_pct || 5) / 100) * 100) / 100
    };
    setIngredients([...ingredients, newRow]);
  };

  const handleIngredientChange = (index: number, ingId: number) => {
    const selected = allIngredients.find(i => i.id === ingId);
    if (!selected) return;
    const updated = [...ingredients];
    const qty = updated[index].quantity || 1;
    const eff = selected.purchase_price * (1 + (selected.wastage_pct || 5) / 100);
    updated[index] = {
      ...updated[index],
      ingredient_id: selected.id,
      ingredient_name: selected.name,
      ingredient_category: selected.category,
      unit: selected.unit,
      purchase_price: selected.purchase_price,
      wastage_pct: selected.wastage_pct,
      line_cost: Math.round(qty * eff * 100) / 100
    };
    setIngredients(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...ingredients];
    const row = updated[index];
    const price = row.purchase_price || 0;
    const waste = row.wastage_pct || 5;
    const eff = price * (1 + waste / 100);
    updated[index] = {
      ...row,
      quantity: qty,
      line_cost: Math.round(qty * eff * 100) / 100
    };
    setIngredients(updated);
  };

  const handleUnitChange = (index: number, unit: string) => {
    const updated = [...ingredients];
    updated[index].unit = unit;
    setIngredients(updated);
  };

  const handleRemoveRow = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleCreateQuickIngredient = async () => {
    if (!newIngName.trim()) return;
    try {
      setQuickAddLoading(true);
      setRecipeError(null);
      const created = await api.createIngredient({
        name: newIngName.trim(),
        category: newIngCategory,
        unit: newIngUnit,
        purchase_price: Number(newIngPrice) || 0,
        wastage_pct: 5.0
      });
      setAllIngredients(prev => [...prev, created]);
      // Also add directly to recipe
      const newRow: RecipeIngredient = {
        ingredient_id: created.id,
        ingredient_name: created.name,
        ingredient_category: created.category,
        quantity: 1,
        unit: created.unit,
        purchase_price: created.purchase_price,
        wastage_pct: created.wastage_pct,
        line_cost: Math.round(created.purchase_price * 1.05 * 100) / 100
      };
      setIngredients(prev => [...prev, newRow]);
      setNewIngName('');
      setShowQuickAddIng(false);
    } catch (err: any) {
      setRecipeError(`Error creating ingredient: ${err.message}`);
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleOpenEditIng = (ingId: number) => {
    const ing = allIngredients.find(i => i.id === ingId);
    if (!ing) return;
    setEditingIngId(ing.id);
    setEditIngData({
      name: ing.name,
      category: ing.category || 'Fresh Vegetables',
      unit: ing.unit || 'kg',
      purchase_price: ing.purchase_price,
      wastage_pct: ing.wastage_pct ?? 5.0,
      supplier: ing.supplier || ''
    });
    setIsEditIngOpen(true);
  };

  const handleSaveEditIng = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingIngId || !editIngData.name.trim()) return;
    try {
      setEditIngSaving(true);
      const updated = await api.updateIngredient(editingIngId, {
        name: editIngData.name.trim(),
        category: editIngData.category,
        unit: editIngData.unit.trim(),
        purchase_price: Number(editIngData.purchase_price) || 0,
        wastage_pct: Number(editIngData.wastage_pct) || 0,
        supplier: editIngData.supplier.trim() || undefined
      });
      // Update local allIngredients
      setAllIngredients(prev => prev.map(i => i.id === updated.id ? updated : i));

      // Update in active recipe rows
      setIngredients(prev => prev.map(row => {
        if (row.ingredient_id === updated.id) {
          const qty = row.quantity || 1;
          const eff = updated.purchase_price * (1 + (updated.wastage_pct || 0) / 100);
          return {
            ...row,
            ingredient_name: updated.name,
            ingredient_category: updated.category,
            unit: updated.unit,
            purchase_price: updated.purchase_price,
            wastage_pct: updated.wastage_pct,
            line_cost: Math.round(qty * eff * 100) / 100
          };
        }
        return row;
      }));

      setIsEditIngOpen(false);
      setEditingIngId(null);
    } catch (err: any) {
      alert(`Failed to update ingredient: ${err.message}`);
    } finally {
      setEditIngSaving(false);
    }
  };

  const handleSaveRecipe = async () => {
    try {
      setSaving(true);
      setRecipeError(null);
      setRecipeSuccess(null);

      // If user typed a new ingredient name in the box but didn't click "Save & Add", auto-save it!
      let currentIngredients = [...ingredients];
      if (newIngName.trim()) {
        try {
          const created = await api.createIngredient({
            name: newIngName.trim(),
            category: newIngCategory,
            unit: newIngUnit,
            purchase_price: Number(newIngPrice) || 0,
            wastage_pct: 5.0
          });
          setAllIngredients(prev => [...prev, created]);
          const newRow: RecipeIngredient = {
            ingredient_id: created.id,
            ingredient_name: created.name,
            ingredient_category: created.category,
            quantity: 1,
            unit: created.unit,
            purchase_price: created.purchase_price,
            wastage_pct: created.wastage_pct,
            line_cost: Math.round(created.purchase_price * 1.05 * 100) / 100
          };
          currentIngredients.push(newRow);
          setIngredients(currentIngredients);
          setNewIngName('');
          setShowQuickAddIng(false);
        } catch (e: any) {
          console.warn('Auto quick-add ingredient error:', e);
        }
      }

      await api.saveRecipe({
        menu_item_id: item.id,
        portion_yield: portionYield > 0 ? portionYield : 100,
        prep_time_mins: prepTimeMins,
        instructions: instructions,
        ingredients: currentIngredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes || ''
        }))
      });
      setRecipeSuccess('Recipe formula & dish food cost saved successfully!');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 700);
    } catch (err: any) {
      setRecipeError(`Failed to save recipe: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const totalBatchCost = Math.round(ingredients.reduce((acc, curr) => acc + (curr.line_cost || 0), 0) * 100) / 100;
  const costPerPortion = portionYield > 0 ? Math.round((totalBatchCost / portionYield) * 100) / 100 : 0;
  const sellingPrice = item.selling_price || 0;
  const foodCostPct = sellingPrice > 0 ? Math.round((costPerPortion / sellingPrice) * 1000) / 10 : 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 30, 20, 0.7)',
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
        maxWidth: '920px',
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
          padding: '1.25rem 1.75rem',
          backgroundColor: '#0A2518',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(185, 146, 75, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(185, 146, 75, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-gold)'
            }}>
              <ChefHat size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#FAF3E3', lineHeight: 1.2, margin: 0 }}>
                  Recipe & Raw Material Formula
                </h2>
                {readOnly && (
                  <span style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.25)',
                    color: '#93C5FD',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}>
                    Staff View Only
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--brand-gold)', marginTop: '0.2rem' }}>
                {item.name} • {item.category_name || 'Standard Dish'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ color: '#EAF2EC', padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading recipe data...
            </div>
          ) : (
            <>
              {/* Batch Yield and Prep Settings */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-parchment)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Base Batch Yield (Portions / Pax)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={readOnly}
                    className="form-control"
                    value={portionYield}
                    onChange={(e) => setPortionYield(Number(e.target.value) || 1)}
                    style={{ fontSize: '0.875rem', fontWeight: 700, opacity: readOnly ? 0.85 : 1 }}
                  />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    e.g. 100 for 100 pax recipe formula
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Prep / Cooking Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={readOnly}
                    className="form-control"
                    value={prepTimeMins}
                    onChange={(e) => setPrepTimeMins(Number(e.target.value) || 0)}
                    style={{ fontSize: '0.875rem', opacity: readOnly ? 0.85 : 1 }}
                  />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    Time required by kitchen staff
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Selling Price (Current)
                  </label>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-emerald)', marginTop: '0.35rem' }}>
                    ₹{item.selling_price || 0} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>/{item.pricing_unit}</span>
                  </div>
                </div>
              </div>

              {/* Ingredients Table */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--brand-emerald)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Raw Materials & Ingredients List</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>{ingredients.length} items</span>
                  </h3>
                  {!readOnly && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddIng(!showQuickAddIng)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', gap: '0.3rem' }}
                      >
                        <Plus size={13} />
                        <span>New Ingredient</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddIngredientRow}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', gap: '0.3rem' }}
                      >
                        <Plus size={13} />
                        <span>Add To Recipe</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Add Master Ingredient Drawer */}
                {showQuickAddIng && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#F0FDF4',
                    border: '1.5px solid #BBF7D0',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) 100px',
                    gap: '0.75rem',
                    alignItems: 'end'
                  }}>
                    <div>
                      <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '0.2rem' }}>Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Star Anise"
                        value={newIngName}
                        onChange={(e) => setNewIngName(e.target.value)}
                        className="form-control"
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '0.2rem' }}>Category</label>
                      <select
                        value={newIngCategory}
                        onChange={(e) => setNewIngCategory(e.target.value)}
                        className="form-control"
                        style={{ fontSize: '0.8125rem' }}
                      >
                        <option value="Meat & Poultry">Meat & Poultry</option>
                        <option value="Seafood">Seafood</option>
                        <option value="Fresh Vegetables">Fresh Vegetables</option>
                        <option value="Dairy & Oils">Dairy & Oils</option>
                        <option value="Spices & Groceries">Spices & Groceries</option>
                        <option value="Packaging & Disposables">Packaging & Disposables</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '0.2rem' }}>Unit</label>
                      <select
                        value={newIngUnit}
                        onChange={(e) => setNewIngUnit(e.target.value)}
                        className="form-control"
                        style={{ fontSize: '0.8125rem' }}
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="litre">litre</option>
                        <option value="ml">ml</option>
                        <option value="piece">piece</option>
                        <option value="packet">packet</option>
                        <option value="box">box</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '0.2rem' }}>Purchase Price (₹)</label>
                      <input
                        type="number"
                        value={newIngPrice}
                        onChange={(e) => setNewIngPrice(Number(e.target.value))}
                        className="form-control"
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateQuickIngredient}
                      disabled={quickAddLoading || !newIngName.trim()}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.75rem', height: '36px' }}
                    >
                      {quickAddLoading ? 'Adding...' : 'Save & Add'}
                    </button>
                  </div>
                )}

                {ingredients.length === 0 ? (
                  <div style={{
                    padding: '2.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-parchment)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px dashed var(--border-medium)',
                    color: 'var(--text-muted)'
                  }}>
                    <Calculator size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>No ingredients added to this recipe yet</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Click "Add To Recipe" above to specify raw materials and calculate accurate automated event purchase lists.
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: readOnly ? '50%' : '40%' }}>Raw Ingredient</th>
                          <th style={{ width: '18%' }}>Qty for {portionYield} pax</th>
                          <th style={{ width: '15%' }}>Unit</th>
                          <th style={{ width: '17%', textAlign: 'right' }}>Est. Cost (₹)</th>
                          {!readOnly && <th style={{ width: '10%', textAlign: 'center' }}>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {ingredients.map((row, idx) => (
                          <tr key={idx}>
                            <td>
                              <select
                                value={row.ingredient_id}
                                disabled={readOnly}
                                onChange={(e) => handleIngredientChange(idx, Number(e.target.value))}
                                className="form-control"
                                style={{ fontSize: '0.8125rem', fontWeight: 600, opacity: readOnly ? 0.9 : 1 }}
                              >
                                {allIngredients.map(ing => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.name} ({ing.category}) - ₹{ing.purchase_price}/{ing.unit}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                disabled={readOnly}
                                value={row.quantity}
                                onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                                className="form-control"
                                style={{ fontSize: '0.8125rem', fontWeight: 700, opacity: readOnly ? 0.9 : 1 }}
                              />
                            </td>
                            <td>
                              <select
                                value={row.unit}
                                disabled={readOnly}
                                onChange={(e) => handleUnitChange(idx, e.target.value)}
                                className="form-control"
                                style={{ fontSize: '0.8125rem', opacity: readOnly ? 0.9 : 1 }}
                              >
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="litre">litre</option>
                                <option value="ml">ml</option>
                                <option value="piece">piece</option>
                                <option value="packet">packet</option>
                                <option value="can">can</option>
                                <option value="box">box</option>
                              </select>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-emerald)' }}>
                              ₹{row.line_cost?.toFixed(2) || '0.00'}
                            </td>
                            {!readOnly && (
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditIng(row.ingredient_id)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--brand-emerald)', padding: '0.25rem' }}
                                    title="Edit master ingredient rate / wastage"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRow(idx)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: '#DC2626', padding: '0.25rem' }}
                                    title="Remove ingredient from recipe"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Preparation Instructions */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-emerald)', marginBottom: '0.35rem' }}>
                  Preparation & Cooking Instructions
                </label>
                <textarea
                  rows={3}
                  disabled={readOnly}
                  className="form-control"
                  placeholder="Step-by-step instructions for banquet chefs, marination times, dum cooking guidelines..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  style={{ fontSize: '0.8125rem', lineHeight: 1.5, opacity: readOnly ? 0.9 : 1 }}
                />
              </div>
            </>
          )}
        </div>

        {/* Status alerts */}
        {recipeError && (
          <div style={{
            margin: '0 1.75rem 0.75rem',
            padding: '0.75rem 1.25rem',
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
            <AlertCircle size={16} />
            <span>{recipeError}</span>
          </div>
        )}
        {recipeSuccess && (
          <div style={{
            margin: '0 1.75rem 0.75rem',
            padding: '0.75rem 1.25rem',
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
            <Sparkles size={16} />
            <span>{recipeSuccess}</span>
          </div>
        )}

        {/* Footer Summary & Action */}
        <div style={{
          padding: '1.25rem 1.75rem',
          backgroundColor: 'var(--bg-parchment)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Cost Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Batch Cost ({portionYield} Pax)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                ₹{totalBatchCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-medium)', paddingLeft: '1.5rem' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Food Cost / Plate</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#B91C1C' }}>
                ₹{costPerPortion.toFixed(2)}
              </div>
            </div>
            {sellingPrice > 0 && (
              <div style={{ borderLeft: '1px solid var(--border-medium)', paddingLeft: '1.5rem' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Food Cost Margin</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: foodCostPct > 45 ? '#DC2626' : '#15803D' }}>
                  {foodCostPct}%
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {readOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary"
                style={{ minWidth: '100px' }}
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ gap: '0.45rem', minWidth: '140px' }}
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save Recipe'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Master Ingredient Modal */}
      {isEditIngOpen && (
        <div
          className="modal-backdrop"
          onClick={() => !editIngSaving && setIsEditIngOpen(false)}
          style={{ zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              maxWidth: '460px',
              width: '92%',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.4)',
              border: '1px solid #E2E8F0',
              color: 'var(--text-main)',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#EAF2EC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-emerald)'
                }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Edit Ingredient Details
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Changes apply across recipes and purchase lists.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditIngOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ borderRadius: '50%', padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditIng}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Ingredient Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={editIngData.name}
                    onChange={(e) => setEditIngData({ ...editIngData, name: e.target.value })}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Category
                    </label>
                    <select
                      className="form-control"
                      value={editIngData.category}
                      onChange={(e) => setEditIngData({ ...editIngData, category: e.target.value })}
                      style={{ fontSize: '0.8125rem' }}
                    >
                      <option value="Meat & Poultry">Meat & Poultry</option>
                      <option value="Seafood">Seafood</option>
                      <option value="Fresh Vegetables">Fresh Vegetables</option>
                      <option value="Dairy & Oils">Dairy & Oils</option>
                      <option value="Spices & Groceries">Spices & Groceries</option>
                      <option value="Grains & Flours">Grains & Flours</option>
                      <option value="Bakery & Sweets">Bakery & Sweets</option>
                      <option value="Packaging & Disposables">Packaging & Disposables</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Unit
                    </label>
                    <select
                      className="form-control"
                      value={editIngData.unit}
                      onChange={(e) => setEditIngData({ ...editIngData, unit: e.target.value })}
                      style={{ fontSize: '0.8125rem' }}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="litre">litre</option>
                      <option value="ml">ml</option>
                      <option value="piece">piece</option>
                      <option value="packet">packet</option>
                      <option value="can">can</option>
                      <option value="box">box</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Purchase Rate (₹) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      className="form-control"
                      value={editIngData.purchase_price}
                      onChange={(e) => setEditIngData({ ...editIngData, purchase_price: parseFloat(e.target.value) || 0 })}
                      style={{ fontSize: '0.875rem', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Wastage Loss (%)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      className="form-control"
                      value={editIngData.wastage_pct}
                      onChange={(e) => setEditIngData({ ...editIngData, wastage_pct: parseFloat(e.target.value) || 0 })}
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {/* Live Effective Cost Preview */}
                <div style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#F0FDF4',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #BBF7D0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Effective Cost:</span>
                  <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 800 }}>
                    ₹{(Number(editIngData.purchase_price || 0) * (1 + (Number(editIngData.wastage_pct) || 0) / 100)).toFixed(2)} / {editIngData.unit}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Preferred Supplier / Brand (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. City Wholesale / Brand"
                    value={editIngData.supplier}
                    onChange={(e) => setEditIngData({ ...editIngData, supplier: e.target.value })}
                    style={{ fontSize: '0.8125rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditIngOpen(false)}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    disabled={editIngSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={editIngSaving}
                  >
                    {editIngSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
