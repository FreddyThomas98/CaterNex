import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, Category, UserRole, PricingUnit, ServiceType, Ingredient, RecipeIngredient } from '../types';
import { api } from '../services/api';
import {
  Search, Plus, Edit3, Check, X, Flame, Sparkles, Trash2, Upload,
  Image as ImageIcon, Utensils, ChefHat, ArrowRight, ArrowLeft,
  PlusCircle, Calculator, Tag, Clock, Layers, Carrot, ShoppingBag
} from 'lucide-react';
import { RecipeModal } from '../components/RecipeModal';

interface MenuManagementProps {
  userRole: UserRole;
  defaultTab?: 'dishes' | 'ingredients';
}

export const MenuManagement: React.FC<MenuManagementProps> = ({ userRole, defaultTab = 'dishes' }) => {
  const [mainTab, setMainTab] = useState<'dishes' | 'ingredients'>(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setMainTab(defaultTab);
    }
  }, [defaultTab]);
  const isReadOnly = userRole === 'USER';
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [recipeModalItem, setRecipeModalItem] = useState<MenuItem | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Category modal
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Dish Form State
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
    selling_price: 180,
    food_cost: 72,
    pricing_unit: 'PER_PERSON',
    service_type: 'STANDARD',
    description: '',
    image_url: '',
    is_active: 1
  });

  // Step 2: Recipe Form State (Created together with Dish)
  const [portionYield, setPortionYield] = useState<number>(100);
  const [prepTimeMins, setPrepTimeMins] = useState<number>(60);
  const [instructions, setInstructions] = useState<string>('');
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);

  // Quick Add Ingredient within Wizard
  const [showQuickAddIng, setShowQuickAddIng] = useState(false);
  const [quickIngName, setQuickIngName] = useState('');
  const [quickIngCat, setQuickIngCat] = useState('Fresh Vegetables');
  const [quickIngUnit, setQuickIngUnit] = useState('kg');
  const [quickIngPrice, setQuickIngPrice] = useState<number>(60);
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  // Raw Material Ingredients Tab States
  const [selectedIngCat, setSelectedIngCat] = useState<string | null>(null);
  const [ingSearch, setIngSearch] = useState('');

  // Add Master Ingredient Modal
  const [isAddIngModalOpen, setIsAddIngModalOpen] = useState(false);
  const [newIngData, setNewIngData] = useState({
    name: '',
    category: 'Fresh Vegetables',
    unit: 'kg',
    purchase_price: 60,
    wastage_pct: 5.0,
    supplier: ''
  });
  const [isSavingNewIng, setIsSavingNewIng] = useState(false);

  // Edit Master Ingredient Modal
  const [isEditIngModalOpen, setIsEditIngModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
  const [editIngData, setEditIngData] = useState({
    name: '',
    category: 'Fresh Vegetables',
    unit: 'kg',
    purchase_price: 60,
    wastage_pct: 5.0,
    supplier: ''
  });
  const [isSavingEditIng, setIsSavingEditIng] = useState(false);

  // Delete Master Ingredient Modal (In-App)
  const [ingToDelete, setIngToDelete] = useState<Ingredient | null>(null);
  const [isDeletingIng, setIsDeletingIng] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, items, ings] = await Promise.all([
        api.getCategories(),
        api.getMenuItems(),
        api.getIngredients()
      ]);
      setCategories(cats);
      setMenuItems(items);
      setAllIngredients(ings);

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
    setWizardStep(1);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? (selectedCatId || categories[0].id) : 1,
      selling_price: 180,
      food_cost: 72,
      pricing_unit: 'PER_PERSON',
      service_type: 'STANDARD',
      description: '',
      image_url: '',
      is_active: 1
    });
    setPortionYield(100);
    setPrepTimeMins(60);
    setInstructions('');
    // Start with 1 default ingredient row if available
    if (allIngredients.length > 0) {
      const first = allIngredients[0];
      setRecipeIngredients([{
        ingredient_id: first.id,
        ingredient_name: first.name,
        ingredient_category: first.category,
        quantity: 5,
        unit: first.unit,
        purchase_price: first.purchase_price,
        wastage_pct: first.wastage_pct,
        line_cost: Math.round(5 * first.purchase_price * (1 + (first.wastage_pct || 5) / 100) * 100) / 100
      }]);
    } else {
      setRecipeIngredients([]);
    }
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

  // Recipe Ingredient Row Handlers
  const handleAddIngredientRow = () => {
    if (allIngredients.length === 0) return;
    const first = allIngredients[0];
    const newRow: RecipeIngredient = {
      ingredient_id: first.id,
      ingredient_name: first.name,
      ingredient_category: first.category,
      quantity: 1,
      unit: first.unit,
      purchase_price: first.purchase_price,
      wastage_pct: first.wastage_pct,
      line_cost: Math.round(first.purchase_price * (1 + (first.wastage_pct || 5) / 100) * 100) / 100
    };
    setRecipeIngredients([...recipeIngredients, newRow]);
  };

  const handleIngredientChange = (index: number, ingId: number) => {
    const selected = allIngredients.find(i => i.id === ingId);
    if (!selected) return;
    const updated = [...recipeIngredients];
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
    setRecipeIngredients(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...recipeIngredients];
    const row = updated[index];
    const price = row.purchase_price || 0;
    const waste = row.wastage_pct || 5;
    const eff = price * (1 + waste / 100);
    updated[index] = {
      ...row,
      quantity: qty,
      line_cost: Math.round(qty * eff * 100) / 100
    };
    setRecipeIngredients(updated);
  };

  const handleUnitChange = (index: number, unit: string) => {
    const updated = [...recipeIngredients];
    updated[index].unit = unit;
    setRecipeIngredients(updated);
  };

  const handleRemoveIngRow = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  // Ingredients Master Handlers
  const handleCreateIngredient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newIngData.name.trim()) {
      alert('Please enter an ingredient name.');
      return;
    }
    setIsSavingNewIng(true);
    try {
      const created = await api.createIngredient({
        name: newIngData.name.trim(),
        category: newIngData.category,
        unit: newIngData.unit.trim(),
        purchase_price: Number(newIngData.purchase_price) || 0,
        wastage_pct: Number(newIngData.wastage_pct) || 0,
        supplier: newIngData.supplier.trim() || undefined
      });
      setAllIngredients(prev => [...prev, created]);
      setIsAddIngModalOpen(false);
      setNewIngData({
        name: '',
        category: 'Fresh Vegetables',
        unit: 'kg',
        purchase_price: 60,
        wastage_pct: 5.0,
        supplier: ''
      });
    } catch (err: any) {
      console.error('Failed to create ingredient', err);
      alert(`Failed to create ingredient: ${err.message}`);
    } finally {
      setIsSavingNewIng(false);
    }
  };

  const handleOpenEditIngredient = (ingOrId: Ingredient | number) => {
    const ing = typeof ingOrId === 'number'
      ? allIngredients.find(i => i.id === ingOrId)
      : ingOrId;
    if (!ing) return;
    setEditingIng(ing);
    setEditIngData({
      name: ing.name,
      category: ing.category || 'Fresh Vegetables',
      unit: ing.unit || 'kg',
      purchase_price: ing.purchase_price,
      wastage_pct: ing.wastage_pct ?? 5.0,
      supplier: ing.supplier || ''
    });
    setIsEditIngModalOpen(true);
  };

  const handleSaveEditIngredient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingIng || !editIngData.name.trim()) return;
    setIsSavingEditIng(true);
    try {
      const updated = await api.updateIngredient(editingIng.id, {
        name: editIngData.name.trim(),
        category: editIngData.category,
        unit: editIngData.unit.trim(),
        purchase_price: Number(editIngData.purchase_price) || 0,
        wastage_pct: Number(editIngData.wastage_pct) || 0,
        supplier: editIngData.supplier.trim() || undefined
      });
      // Update allIngredients state
      setAllIngredients(prev => prev.map(i => i.id === updated.id ? updated : i));

      // Update active recipe rows if this ingredient was used
      setRecipeIngredients(prev => prev.map(ri => {
        if (ri.ingredient_id === updated.id) {
          const qty = ri.quantity || 1;
          const eff = updated.purchase_price * (1 + (updated.wastage_pct || 0) / 100);
          return {
            ...ri,
            ingredient_name: updated.name,
            ingredient_category: updated.category,
            unit: updated.unit,
            purchase_price: updated.purchase_price,
            wastage_pct: updated.wastage_pct,
            line_cost: Math.round(qty * eff * 100) / 100
          };
        }
        return ri;
      }));

      setIsEditIngModalOpen(false);
      setEditingIng(null);
    } catch (err: any) {
      console.error('Failed to update ingredient', err);
      alert(`Failed to update ingredient: ${err.message}`);
    } finally {
      setIsSavingEditIng(false);
    }
  };

  const handleDeleteIngredient = (ing: Ingredient) => {
    setIngToDelete(ing);
  };

  const confirmDeleteIngredient = async () => {
    if (!ingToDelete) return;
    const target = ingToDelete;
    setIsDeletingIng(true);
    try {
      setAllIngredients(prev => prev.filter(i => i.id !== target.id));
      setRecipeIngredients(prev => prev.filter(ri => ri.ingredient_id !== target.id));
      setIngToDelete(null);
      await api.deleteIngredient(target.id);
    } catch (err: any) {
      console.error('Failed to delete ingredient', err);
      alert(`Failed to delete ingredient: ${err.message}`);
      await loadData();
    } finally {
      setIsDeletingIng(false);
    }
  };

  // Quick Add Raw Material Master
  const handleQuickAddMasterIngredient = async () => {
    if (!quickIngName.trim()) return;
    try {
      setQuickAddLoading(true);
      const created = await api.createIngredient({
        name: quickIngName.trim(),
        category: quickIngCat,
        unit: quickIngUnit,
        purchase_price: Number(quickIngPrice) || 0,
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
      setRecipeIngredients(prev => [...prev, newRow]);
      setQuickIngName('');
      setShowQuickAddIng(false);
    } catch (err: any) {
      alert(`Error creating raw material: ${err.message}`);
    } finally {
      setQuickAddLoading(false);
    }
  };

  // Calculations for Step 2
  const totalBatchCost = recipeIngredients.reduce((sum, r) => sum + (r.line_cost || 0), 0);
  const calculatedFoodCostPerPortion = portionYield > 0 ? Math.round((totalBatchCost / portionYield) * 100) / 100 : 0;

  // Add Category Handler
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      setIsSavingCat(true);
      const created = await api.createCategory({
        name: newCatName.trim(),
        display_order: categories.length + 1,
        is_active: 1
      });
      setCategories(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, category_id: created.id }));
      setNewCatName('');
      setIsAddCatModalOpen(false);
    } catch (err: any) {
      alert(`Failed to add category: ${err.message}`);
    } finally {
      setIsSavingCat(false);
    }
  };

  // Save Dish & Recipe Wizard Complete
  const handleSaveDishAndRecipe = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a dish name');
      setWizardStep(1);
      return;
    }
    try {
      setIsSaving(true);
      const sp = formData.selling_price || 0;
      const fc = calculatedFoodCostPerPortion > 0 ? calculatedFoodCostPerPortion : (formData.food_cost || Math.round(sp * 0.40));
      const lc = Math.round(sp * 0.15);
      const pc = Math.round(sp * 0.05);
      const oc = Math.round(sp * 0.08);

      // 1. Create Menu Item
      const createdDish = await api.createMenuItem({
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

      // 2. Save Recipe Formula if ingredients or instructions exist
      if (recipeIngredients.length > 0 || instructions.trim()) {
        await api.saveRecipe({
          menu_item_id: createdDish.id,
          portion_yield: portionYield > 0 ? portionYield : 100,
          prep_time_mins: prepTimeMins || 60,
          instructions: instructions.trim(),
          ingredients: recipeIngredients.map(ing => ({
            ingredient_id: ing.ingredient_id,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes || ''
          }))
        });
      }

      setIsAddModalOpen(false);
      await loadData();
      alert(`"${formData.name}" dish and its recipe formula were created successfully!`);
    } catch (err: any) {
      alert(`Error adding dish & recipe: ${err.message}`);
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
      alert(`Error updating dish: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Menu Item State
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(null);
  const [isDeletingMenuItem, setIsDeletingMenuItem] = useState(false);

  const handleDeleteItem = (item: MenuItem) => {
    setMenuItemToDelete(item);
  };

  const confirmDeleteMenuItem = async () => {
    if (!menuItemToDelete) return;
    const item = menuItemToDelete;
    setIsDeletingMenuItem(true);
    try {
      setMenuItems(prev => prev.filter(m => m.id !== item.id));
      if (isEditModalOpen) {
        setIsEditModalOpen(false);
      }
      setMenuItemToDelete(null);
      await api.deleteMenuItem(item.id);
      await loadData();
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      alert(`Failed to delete item: ${err.message}`);
      await loadData();
    } finally {
      setIsDeletingMenuItem(false);
    }
  };

  // Only show categories that have items on the main menu view!
  const activeCategories = categories.filter(cat => 
    menuItems.some(item => item.category_id === cat.id)
  );

  // Filter items by category & search
  const filteredItems = menuItems.filter(item => {
    const matchesCat = selectedCatId === null || item.category_id === selectedCatId;
    const matchesSearch = !search || 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Filter ingredients by category & search
  const filteredIngredients = allIngredients.filter(ing => {
    const matchesCat = selectedIngCat === null || ing.category === selectedIngCat;
    const matchesSearch = !ingSearch ||
      ing.name.toLowerCase().includes(ingSearch.toLowerCase()) ||
      (ing.supplier && ing.supplier.toLowerCase().includes(ingSearch.toLowerCase())) ||
      (ing.category && ing.category.toLowerCase().includes(ingSearch.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const ingCategories = Array.from(new Set(allIngredients.map(i => i.category).filter(Boolean)));
  const avgIngRate = allIngredients.length > 0
    ? allIngredients.reduce((sum, i) => sum + (i.purchase_price || 0), 0) / allIngredients.length
    : 0;
  const avgIngWastage = allIngredients.length > 0
    ? allIngredients.reduce((sum, i) => sum + (i.wastage_pct || 0), 0) / allIngredients.length
    : 0;

  return (
    <div className="page-wrapper" style={{ maxWidth: '1280px' }}>
      {/* Top Tab Switcher: Dishes vs Ingredients */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        borderBottom: '2px solid var(--border-subtle)',
        marginBottom: '1.75rem',
        paddingBottom: '0.25rem'
      }}>
        <button
          type="button"
          onClick={() => setMainTab('dishes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.75rem 1.35rem',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            border: 'none',
            backgroundColor: mainTab === 'dishes' ? 'var(--brand-emerald)' : 'transparent',
            color: mainTab === 'dishes' ? '#FFFFFF' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: mainTab === 'dishes' ? '0 4px 12px rgba(10, 37, 24, 0.15)' : 'none',
            transition: 'all 0.18s ease'
          }}
        >
          <Utensils size={16} />
          <span>Brochure Dishes & Recipes</span>
          <span style={{
            backgroundColor: mainTab === 'dishes' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-canvas)',
            color: mainTab === 'dishes' ? '#FFFFFF' : 'var(--text-muted)',
            padding: '0.1rem 0.5rem',
            borderRadius: '10px',
            fontSize: '0.6875rem',
            fontWeight: 800
          }}>
            {menuItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('ingredients')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.75rem 1.35rem',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            border: 'none',
            backgroundColor: mainTab === 'ingredients' ? 'var(--brand-emerald)' : 'transparent',
            color: mainTab === 'ingredients' ? '#FFFFFF' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: mainTab === 'ingredients' ? '0 4px 12px rgba(10, 37, 24, 0.15)' : 'none',
            transition: 'all 0.18s ease'
          }}
        >
          <Carrot size={16} />
          <span>Raw Material Ingredients</span>
          <span style={{
            backgroundColor: mainTab === 'ingredients' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-canvas)',
            color: mainTab === 'ingredients' ? '#FFFFFF' : 'var(--text-muted)',
            padding: '0.1rem 0.5rem',
            borderRadius: '10px',
            fontSize: '0.6875rem',
            fontWeight: 800
          }}>
            {allIngredients.length}
          </span>
        </button>
      </div>

      {mainTab === 'dishes' ? (
        <>
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
            Brochure Menu & Recipe Master
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Culinary catalog with photography and raw material recipe formulas for precision kitchen procurement.
          </p>
        </div>

        {!isReadOnly && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setIsAddCatModalOpen(true)}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.78125rem', color: 'var(--brand-emerald)', borderColor: 'var(--border-medium)' }}
            >
              <Tag size={14} />
              + Add Category
            </button>
            <button
              onClick={handleOpenAdd}
              className="btn btn-gold btn-sm"
            >
              <Plus size={15} />
              Add New Dish & Recipe
            </button>
          </div>
        )}
      </div>

      {/* Categories Toolbar & Search (Categories without items are hidden!) */}
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
          {activeCategories.map(cat => {
            const count = menuItems.filter(i => i.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className={`cat-pill ${selectedCatId === cat.id ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.78125rem' }}
              >
                {cat.name} ({count})
              </button>
            );
          })}
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
                  No items found. Click "Add New Dish & Recipe" to add to the menu.
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
                          backgroundColor: 'var(--bg-canvas)',
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
                        onClick={() => setRecipeModalItem(item)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', color: '#1E293B', borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' }}
                        title="Configure Dish Recipe & Raw Ingredients Formula"
                      >
                        <ChefHat size={13} color="var(--brand-gold)" />
                        <span>Recipe</span>
                      </button>
                      {!isReadOnly && (
                        <>
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        </>
      ) : (
        <>
          {/* ==================== RAW MATERIAL INGREDIENTS MASTER VIEW ==================== */}
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
                Raw Material & Kitchen Ingredients Master
              </h1>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Standard procurement purchase rates, prep yield wastage factors, and live effective kitchen costs for recipes.
              </p>
            </div>

            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsAddIngModalOpen(true)}
                className="btn btn-gold btn-sm"
                style={{ gap: '0.45rem' }}
              >
                <Plus size={15} />
                <span>+ Add Master Ingredient</span>
              </button>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div className="luxury-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Master Items
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--brand-emerald)', marginTop: '0.25rem' }}>
                {allIngredients.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Active in procurement & recipes
              </div>
            </div>

            <div className="luxury-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Categories
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--brand-emerald)', marginTop: '0.25rem' }}>
                {ingCategories.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Fresh, meat, grocery & dairy
              </div>
            </div>

            <div className="luxury-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Avg Base Purchase Rate
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--brand-emerald)', marginTop: '0.25rem' }}>
                ₹{avgIngRate.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Across standard kitchen units
              </div>
            </div>

            <div className="luxury-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Avg Trimming Loss
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--brand-gold)', marginTop: '0.25rem' }}>
                {avgIngWastage.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Peeling & prep shrinkage factor
              </div>
            </div>
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
                onClick={() => setSelectedIngCat(null)}
                className={`cat-pill ${selectedIngCat === null ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.78125rem' }}
              >
                All Raw Materials ({allIngredients.length})
              </button>
              {ingCategories.map(cat => {
                const count = allIngredients.filter(i => i.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedIngCat(cat)}
                    className={`cat-pill ${selectedIngCat === cat ? 'active' : ''}`}
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.78125rem' }}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '250px' }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search raw material or vendor..."
                value={ingSearch}
                onChange={(e) => setIngSearch(e.target.value)}
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

          {/* Ingredients Table */}
          <div className="luxury-card" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Raw Material Name</th>
                  <th>Category</th>
                  <th>Standard Unit</th>
                  <th>Purchase Price (₹)</th>
                  <th>Wastage / Loss (%)</th>
                  <th>Effective Kitchen Cost</th>
                  <th>Preferred Supplier / Source</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      Loading master raw ingredients...
                    </td>
                  </tr>
                ) : filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No raw material ingredients found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredIngredients.map(ing => {
                    const effCost = ing.effective_cost ?? Math.round(ing.purchase_price * (1 + (ing.wastage_pct || 0) / 100) * 100) / 100;
                    return (
                      <tr key={ing.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: '#F0FDF4',
                              color: '#166534',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Carrot size={16} />
                            </div>
                            <div>
                              <span style={{ fontWeight: 700, color: 'var(--brand-emerald)', fontSize: '0.9rem' }}>
                                {ing.name}
                              </span>
                              {ing.supplier && (
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  Vendor: {ing.supplier}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-gold" style={{ fontSize: '0.7rem', textTransform: 'none' }}>
                            {ing.category || 'General'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                            {ing.unit}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            ₹{Number(ing.purchase_price).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: (ing.wastage_pct || 0) > 8 ? '#FEF3C7' : '#F1F5F9',
                            color: (ing.wastage_pct || 0) > 8 ? '#B45309' : 'var(--text-secondary)'
                          }}>
                            {(ing.wastage_pct || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 800,
                            color: 'var(--brand-emerald)',
                            fontSize: '0.95rem'
                          }}>
                            ₹{Number(effCost).toFixed(2)} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>/{ing.unit}</span>
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {ing.supplier || 'Standard Market Vendor'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                            {!isReadOnly && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditIngredient(ing)}
                                  className="btn btn-outline btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', color: 'var(--brand-emerald)', borderColor: 'var(--border-medium)' }}
                                  title="Edit Ingredient Rate & Loss %"
                                >
                                  <Edit3 size={13} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteIngredient(ing)}
                                  className="btn btn-outline btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.45rem', color: '#DC2626', borderColor: '#FCA5A5' }}
                                  title="Delete Ingredient"
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
        </>
      )}

      {/* 2-STEP DISH & RECIPE CREATION WIZARD MODAL */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 25, 47, 0.78)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: wizardStep === 1 ? '560px' : '780px',
            maxHeight: '94vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-medium)',
            transition: 'max-width 0.25s ease'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span className={`badge ${wizardStep === 1 ? 'badge-gold' : 'badge-neutral'}`} style={{ fontSize: '0.6875rem' }}>
                    Step 1: Dish Details
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
                  <span className={`badge ${wizardStep === 2 ? 'badge-gold' : 'badge-neutral'}`} style={{ fontSize: '0.6875rem' }}>
                    Step 2: Recipe & Raw Materials
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--brand-emerald)' }}>
                  {wizardStep === 1 ? 'Create New Dish (Step 1 of 2)' : `Configure Recipe: ${formData.name || 'New Dish'} (Step 2 of 2)`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* STEP 1: Dish Details */}
            {wizardStep === 1 && (
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
                    backgroundColor: 'var(--bg-canvas)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      backgroundColor: '#E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid var(--border-medium)'
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
                    placeholder="e.g. Kozhi Porichathu / Malabar Biryani"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF', fontWeight: 600 }}
                  />
                </div>

                {/* Category with customizable "+ Add Category" button */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        Category *
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddCatModalOpen(true)}
                        style={{ background: 'none', border: 'none', color: 'var(--brand-emerald)', fontSize: '0.71875rem', cursor: 'pointer', fontWeight: 700 }}
                      >
                        + New Category
                      </button>
                    </div>
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
                      <option value="PER_LITRE">Per Litre</option>
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
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Description / Serving Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Served piping hot with traditional raita and pickle"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.name.trim()) {
                        alert('Please enter a dish name to proceed to recipe formula');
                        return;
                      }
                      setWizardStep(2);
                    }}
                    className="btn btn-gold"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <span>Next: Configure Recipe Formula</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Recipe Formula & Ingredients */}
            {wizardStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  backgroundColor: 'var(--bg-canvas)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Portion Batch Yield *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        min="1"
                        value={portionYield}
                        onChange={(e) => setPortionYield(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '110px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontWeight: 700 }}
                      />
                      <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>Servings / Portions</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Cooking & Prep Time
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        min="5"
                        value={prepTimeMins}
                        onChange={(e) => setPrepTimeMins(Math.max(0, parseInt(e.target.value) || 0))}
                        style={{ width: '110px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                      />
                      <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>Minutes</span>
                    </div>
                  </div>
                </div>

                {/* Recipe Ingredients Table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-emerald)', margin: 0 }}>
                        Raw Materials & Ingredients Formulation
                      </h4>
                      <p style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', margin: 0 }}>
                        Amounts scaled to produce {portionYield} portions. Automatically aggregates into event purchase lists.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddIng(true)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', gap: '0.25rem' }}
                      >
                        <PlusCircle size={13} />
                        <span>+ New Raw Material</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddIngredientRow}
                        className="btn btn-gold btn-sm"
                        style={{ fontSize: '0.75rem', gap: '0.25rem' }}
                      >
                        <Plus size={13} />
                        <span>Add Row</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Add Master Ingredient Inline Form */}
                  {showQuickAddIng && (
                    <div style={{
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px dashed var(--brand-gold)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      alignItems: 'flex-end'
                    }}>
                      <div style={{ flex: '2 1 180px' }}>
                        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '0.2rem' }}>Material Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Basmati Rice, Ghee"
                          value={quickIngName}
                          onChange={(e) => setQuickIngName(e.target.value)}
                          style={{ width: '100%', padding: '0.4rem', fontSize: '0.78125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                        />
                      </div>
                      <div style={{ flex: '1 1 110px' }}>
                        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '0.2rem' }}>Category</label>
                        <select
                          value={quickIngCat}
                          onChange={(e) => setQuickIngCat(e.target.value)}
                          style={{ width: '100%', padding: '0.4rem', fontSize: '0.78125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                        >
                          <option value="Fresh Vegetables">Fresh Vegetables</option>
                          <option value="Meats & Poultry">Meats & Poultry</option>
                          <option value="Seafood">Seafood</option>
                          <option value="Dairy & Paneer">Dairy & Paneer</option>
                          <option value="Spices & Groceries">Spices & Groceries</option>
                          <option value="Oils & Ghee">Oils & Ghee</option>
                          <option value="Bakery & Sweets">Bakery & Sweets</option>
                        </select>
                      </div>
                      <div style={{ flex: '0 1 80px' }}>
                        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '0.2rem' }}>Unit</label>
                        <input
                          type="text"
                          value={quickIngUnit}
                          onChange={(e) => setQuickIngUnit(e.target.value)}
                          style={{ width: '100%', padding: '0.4rem', fontSize: '0.78125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                        />
                      </div>
                      <div style={{ flex: '1 1 90px' }}>
                        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '0.2rem' }}>Rate (₹/Unit)</label>
                        <input
                          type="number"
                          value={quickIngPrice}
                          onChange={(e) => setQuickIngPrice(parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '0.4rem', fontSize: '0.78125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={handleQuickAddMasterIngredient}
                          disabled={quickAddLoading}
                          className="btn btn-gold btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                        >
                          {quickAddLoading ? 'Adding...' : 'Save & Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQuickAddIng(false)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {recipeIngredients.length === 0 ? (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-medium)',
                      color: 'var(--text-muted)',
                      fontSize: '0.8125rem'
                    }}>
                      No ingredients added yet. Click "+ Add Row" or "+ New Raw Material" to specify the recipe.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                      <table className="data-table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ width: '38%' }}>Ingredient</th>
                            <th style={{ width: '20%' }}>Batch Qty</th>
                            <th style={{ width: '14%' }}>Unit Rate</th>
                            <th style={{ width: '18%', textAlign: 'right' }}>Est. Cost</th>
                            <th style={{ width: '10%', textAlign: 'center' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {recipeIngredients.map((row, idx) => (
                            <tr key={idx}>
                              <td>
                                <select
                                  value={row.ingredient_id}
                                  onChange={(e) => handleIngredientChange(idx, parseInt(e.target.value))}
                                  style={{ width: '100%', padding: '0.4rem', fontSize: '0.78125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                                >
                                  {allIngredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>
                                      {ing.name} ({ing.category || 'General'})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0.01"
                                    value={row.quantity}
                                    onChange={(e) => handleQtyChange(idx, parseFloat(e.target.value) || 0)}
                                    style={{ width: '70px', padding: '0.35rem', fontSize: '0.78125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                                  />
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.unit}</span>
                                </div>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
                                  ₹{row.purchase_price || 0}/{row.unit}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-emerald)', fontSize: '0.8125rem' }}>
                                ₹{(row.line_cost || 0).toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditIngredient(row.ingredient_id)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: '0.2rem', color: 'var(--brand-emerald)' }}
                                    title="Edit master ingredient rate and loss %"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveIngRow(idx)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: '0.2rem', color: '#DC2626' }}
                                    title="Remove row"
                                  >
                                    <Trash2 size={13} />
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

                {/* Preparation Instructions */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Chef Preparation & Cooking Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Marinate chicken with spices for 2 hours. Deep fry in medium hot oil until golden brown."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.78125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', resize: 'vertical' }}
                  />
                </div>

                {/* Live Food Cost Calculation Banner */}
                <div style={{
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--brand-gold-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Calculated Recipe Food Cost
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                        ₹{calculatedFoodCostPerPortion}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ portion</span>
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid var(--border-medium)', paddingLeft: '1rem' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Batch Cost</span>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      ₹{totalBatchCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid var(--border-medium)', paddingLeft: '1rem' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Selling Price</span>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                      ₹{formData.selling_price}
                    </div>
                  </div>
                </div>

                {/* Wizard Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="btn btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <ArrowLeft size={15} />
                    <span>Back to Dish Info</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDishAndRecipe}
                    disabled={isSaving}
                    className="btn btn-gold"
                  >
                    {isSaving ? 'Creating Dish & Recipe...' : 'Save Dish & Recipe Formula'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT DISH MODAL */}
      {isEditModalOpen && editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 25, 47, 0.78)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
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
            border: '1px solid var(--border-medium)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Catalog Item Editor
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--brand-emerald)' }}>
                  Edit: {editingItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Dish Photo */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Dish Photography
                </label>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-canvas)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid var(--border-medium)'
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
                      placeholder="Or paste image URL"
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsAddCatModalOpen(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-emerald)', fontSize: '0.71875rem', cursor: 'pointer', fontWeight: 700 }}
                    >
                      + New
                    </button>
                  </div>
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
                    <option value="PER_LITRE">Per Litre</option>
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
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Food Cost (₹)
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(editingItem)}
                  className="btn btn-outline"
                  style={{ color: '#B91C1C', borderColor: '#FECACA', backgroundColor: '#FEF2F2', fontSize: '0.8125rem' }}
                >
                  <Trash2 size={14} />
                  <span>Remove Dish</span>
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setRecipeModalItem(editingItem);
                    }}
                    className="btn btn-outline"
                    style={{ color: 'var(--brand-emerald)', borderColor: 'var(--border-medium)' }}
                  >
                    <ChefHat size={14} color="var(--brand-gold)" />
                    <span>Edit Recipe</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditItem}
                    disabled={isSaving}
                    className="btn btn-gold"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {isAddCatModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 25, 47, 0.78)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '420px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-medium)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--brand-emerald)', margin: 0 }}>
                Add New Menu Category
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Create a custom category (e.g. "Live Chaat Station", "Continental Starters", "Dessert Bar"). It will immediately appear in dish creation and brochure filters once items are added.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Category Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Seafood Delicacies"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontWeight: 600 }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(false)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={isSavingCat || !newCatName.trim()}
                className="btn btn-gold btn-sm"
              >
                {isSavingCat ? 'Saving...' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Modal for individual dish inspection/edit */}
      {recipeModalItem && (
        <RecipeModal
          item={recipeModalItem}
          onClose={() => setRecipeModalItem(null)}
          onSaved={loadData}
          readOnly={isReadOnly}
        />
      )}

      {/* Delete Dish Confirmation Modal */}
      {menuItemToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => !isDeletingMenuItem && setMenuItemToDelete(null)}
          style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              maxWidth: '420px',
              width: '90%',
              padding: '2rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.4)',
              border: '1px solid #E2E8F0',
              color: 'var(--text-main)'
            }}
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
              Delete Dish?
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{menuItemToDelete.name}</strong> from the catalog?
              <br />
              <span style={{ color: '#B91C1C', fontSize: '0.8rem', fontWeight: 600 }}>This will also remove its associated recipe and costing details.</span>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setMenuItemToDelete(null)}
                className="btn btn-outline"
                disabled={isDeletingMenuItem}
                style={{ flex: 1, padding: '0.65rem', fontWeight: 600 }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteMenuItem}
                className="btn"
                disabled={isDeletingMenuItem}
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
                  cursor: isDeletingMenuItem ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeletingMenuItem ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==================== ADD MASTER INGREDIENT MODAL ==================== */}
      {isAddIngModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => !isSavingNewIng && setIsAddIngModalOpen(false)}
          style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              maxWidth: '480px',
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
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#F0FDF4',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Add New Master Ingredient
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Registers new raw material across kitchen recipe builders.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddIngModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ borderRadius: '50%', padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateIngredient}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Ingredient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kashmiri Chilli Powder, Fresh Paneer"
                    className="form-control"
                    value={newIngData.name}
                    onChange={(e) => setNewIngData({ ...newIngData, name: e.target.value })}
                    style={{ fontSize: '0.875rem' }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Category
                    </label>
                    <select
                      className="form-control"
                      value={newIngData.category}
                      onChange={(e) => setNewIngData({ ...newIngData, category: e.target.value })}
                      style={{ fontSize: '0.8125rem' }}
                    >
                      <option value="Fresh Vegetables">Fresh Vegetables</option>
                      <option value="Meat & Poultry">Meat & Poultry</option>
                      <option value="Seafood">Seafood</option>
                      <option value="Dairy & Oils">Dairy & Oils</option>
                      <option value="Spices & Groceries">Spices & Groceries</option>
                      <option value="Grains & Flours">Grains & Flours</option>
                      <option value="Bakery & Sweets">Bakery & Sweets</option>
                      <option value="Packaging & Disposables">Packaging & Disposables</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Standard Unit
                    </label>
                    <select
                      className="form-control"
                      value={newIngData.unit}
                      onChange={(e) => setNewIngData({ ...newIngData, unit: e.target.value })}
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
                      value={newIngData.purchase_price}
                      onChange={(e) => setNewIngData({ ...newIngData, purchase_price: parseFloat(e.target.value) || 0 })}
                      style={{ fontSize: '0.875rem', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Prep Wastage (%)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      className="form-control"
                      value={newIngData.wastage_pct}
                      onChange={(e) => setNewIngData({ ...newIngData, wastage_pct: parseFloat(e.target.value) || 0 })}
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
                  <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Effective Kitchen Rate:</span>
                  <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 800 }}>
                    ₹{(Number(newIngData.purchase_price || 0) * (1 + (Number(newIngData.wastage_pct) || 0) / 100)).toFixed(2)} / {newIngData.unit}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Preferred Vendor / Brand (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Local Wholesale Mart / Metro Cash"
                    value={newIngData.supplier}
                    onChange={(e) => setNewIngData({ ...newIngData, supplier: e.target.value })}
                    style={{ fontSize: '0.8125rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddIngModalOpen(false)}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    disabled={isSavingNewIng}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-gold"
                    style={{ flex: 1 }}
                    disabled={isSavingNewIng}
                  >
                    {isSavingNewIng ? 'Saving...' : 'Add Ingredient'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT MASTER INGREDIENT MODAL ==================== */}
      {isEditIngModalOpen && editingIng && (
        <div
          className="modal-backdrop"
          onClick={() => !isSavingEditIng && setIsEditIngModalOpen(false)}
          style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              maxWidth: '480px',
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
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#EAF2EC',
                  color: 'var(--brand-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Edit Master Ingredient
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Updates procurement rates and recipe calculations instantly.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditIngModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ borderRadius: '50%', padding: '0.35rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditIngredient}>
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
                      <option value="Fresh Vegetables">Fresh Vegetables</option>
                      <option value="Meat & Poultry">Meat & Poultry</option>
                      <option value="Seafood">Seafood</option>
                      <option value="Dairy & Oils">Dairy & Oils</option>
                      <option value="Spices & Groceries">Spices & Groceries</option>
                      <option value="Grains & Flours">Grains & Flours</option>
                      <option value="Bakery & Sweets">Bakery & Sweets</option>
                      <option value="Packaging & Disposables">Packaging & Disposables</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Standard Unit
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
                      Prep Wastage (%)
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
                  <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Effective Kitchen Cost:</span>
                  <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 800 }}>
                    ₹{(Number(editIngData.purchase_price || 0) * (1 + (Number(editIngData.wastage_pct) || 0) / 100)).toFixed(2)} / {editIngData.unit}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Preferred Vendor / Brand (Optional)
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
                    onClick={() => setIsEditIngModalOpen(false)}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    disabled={isSavingEditIng}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={isSavingEditIng}
                  >
                    {isSavingEditIng ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE INGREDIENT CONFIRMATION MODAL ==================== */}
      {ingToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => !isDeletingIng && setIngToDelete(null)}
          style={{ zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              maxWidth: '420px',
              width: '90%',
              padding: '2rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.4)',
              border: '1px solid #E2E8F0',
              color: 'var(--text-main)'
            }}
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
              Delete Ingredient?
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong style={{ color: 'var(--text-primary)' }}>{ingToDelete.name}</strong> from raw ingredients?
              <br />
              <span style={{ color: '#B91C1C', fontSize: '0.8rem', fontWeight: 600 }}>This will also remove it from any recipe formulas.</span>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setIngToDelete(null)}
                className="btn btn-outline"
                disabled={isDeletingIng}
                style={{ flex: 1, padding: '0.65rem', fontWeight: 600 }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteIngredient}
                className="btn"
                disabled={isDeletingIng}
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
                  cursor: isDeletingIng ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeletingIng ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
