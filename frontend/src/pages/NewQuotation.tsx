import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, Category, Client, CateringEvent, UserRole, CompanySettings, CutleryItem, CutleryMasterItem } from '../types';
import { api } from '../services/api';
import { GuestCounter } from '../components/GuestCounter';
import { FoodCard } from '../components/FoodCard';
import { CategoryTabs } from '../components/CategoryTabs';
import { QuotationReviewModal } from '../components/QuotationReviewModal';
import {
  Search, Plus, UserPlus, Check, X, FileText, Download, Sparkles,
  RotateCcw, Utensils, Trash2, PlusCircle, RefreshCw, Layers, CheckSquare, Square
} from 'lucide-react';

export interface ProposalCutleryItem extends CutleryItem {
  is_selected: boolean;
  master_id?: number;
  calculation_type?: 'PER_GUEST' | 'FIXED';
  default_ratio?: number;
}

interface NewQuotationProps {
  userRole: UserRole;
  editQuotationId?: number | null;
  onQuotationSaved?: (quotationId: number) => void;
  onResetEdit?: () => void;
}

export const NewQuotation: React.FC<NewQuotationProps> = ({ userRole, editQuotationId, onQuotationSaved, onResetEdit }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<CateringEvent[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [cutleryMaster, setCutleryMaster] = useState<CutleryMasterItem[]>([]);

  // Proposal State
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [directClientName, setDirectClientName] = useState<string>('');
  const [directClientPhone, setDirectClientPhone] = useState<string>('');
  const [directClientAddress, setDirectClientAddress] = useState<string>('');
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  const [guestCount, setGuestCount] = useState<number>(700);
  const [selectedItems, setSelectedItems] = useState<{ [id: number]: { item: MenuItem; quantity: number } }>({});
  const [cutleryItems, setCutleryItems] = useState<ProposalCutleryItem[]>([]);
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxPercentage, setTaxPercentage] = useState<number>(5.0);

  // Tab: 'DISHES' | 'CUTLERY'
  const [builderTab, setBuilderTab] = useState<'DISHES' | 'CUTLERY'>('DISHES');

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isAddCutleryModalOpen, setIsAddCutleryModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingQuotationId, setEditingQuotationId] = useState<number | null>(editQuotationId || null);
  const [createdQuotationId, setCreatedQuotationId] = useState<number | null>(null);
  const [createdQuotationNumber, setCreatedQuotationNumber] = useState<string>('QT-2026-000001');

  // Proposal Event & Client Setup (Editable & Optional)
  const [proposalEventType, setProposalEventType] = useState<string>('');
  const [customEventType, setCustomEventType] = useState<string>('');
  const [proposalEventDate, setProposalEventDate] = useState<string>('');
  const [proposalEventVenue, setProposalEventVenue] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // New Client Modal Form
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');

  // New Cutlery Modal Form
  const [newCutleryName, setNewCutleryName] = useState('');
  const [newCutleryCat, setNewCutleryCat] = useState('Plates & Dinnerware');
  const [newCutleryQty, setNewCutleryQty] = useState<number>(700);
  const [newCutleryUnitCost, setNewCutleryUnitCost] = useState<number>(5.0);
  const [newCutleryIncluded, setNewCutleryIncluded] = useState<number>(1);

  // Ref to prevent reload thrashing when editing
  const quotationLoadedIdRef = useRef<number | null>(null);

  // Helper to build cutlery from master
  const buildCutleryFromMaster = (masterList: CutleryMasterItem[], guests: number): ProposalCutleryItem[] => {
    return masterList.map(m => {
      const qty = m.calculation_type === 'PER_GUEST'
        ? Math.ceil(guests * m.default_ratio)
        : Math.ceil(m.default_ratio);
      const unitCost = m.default_unit_cost || 0;
      return {
        master_id: m.id,
        cutlery_name: m.name,
        category: m.category || 'Tableware',
        calculation_type: m.calculation_type,
        default_ratio: m.default_ratio,
        quantity: qty,
        unit_cost: unitCost,
        total_cost: Math.round(qty * unitCost),
        is_included: 1,
        is_selected: false
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, items, cls, evts, sett, cutMaster] = await Promise.all([
          api.getCategories(),
          api.getMenuItems({ active_only: true }),
          api.getClients(),
          api.getEvents(),
          api.getSettings(),
          api.getCutleryMaster()
        ]);
        setCategories(cats);
        setMenuItems(items);
        setClients(cls);
        setEvents(evts);
        setSettings(sett);
        setCutleryMaster(cutMaster);

        if (!editQuotationId) {
          setSelectedClientId(null);
          setDirectClientName('');
          setDirectClientPhone('');
          setDirectClientAddress('');
          setEditingEventId(null);
          setSelectedItems({});
          setProposalEventType('');
          setCustomEventType('');
          setProposalEventDate('');
          setProposalEventVenue('');
          setCutleryItems(buildCutleryFromMaster(cutMaster, 700));
        }
      } catch (err) {
        console.error('Error fetching data', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (editQuotationId) {
      setEditingQuotationId(editQuotationId);
    } else {
      setEditingQuotationId(null);
      quotationLoadedIdRef.current = null;
    }
  }, [editQuotationId]);

  useEffect(() => {
    if (!editingQuotationId) return;
    if (quotationLoadedIdRef.current === editingQuotationId) return;

    const loadEditingQuotation = async () => {
      try {
        const q = await api.getQuotation(editingQuotationId);
        quotationLoadedIdRef.current = editingQuotationId;
        setCreatedQuotationId(q.id);
        setCreatedQuotationNumber(q.quotation_number);
        const gCount = q.guest_count || 100;
        setGuestCount(gCount);
        setSelectedClientId(q.client_id || null);
        setEditingEventId(q.event_id || null);

        setDirectClientName(q.client?.name || q.client_name || '');
        setDirectClientPhone(q.client?.phone || q.client_phone || '');
        setDirectClientAddress(q.client?.address || q.client_address || '');

        setProposalEventType(q.event?.event_type || q.event_type || '');
        setProposalEventDate(q.event?.event_date || q.event_date || '');
        setProposalEventVenue(q.event?.venue || q.venue || '');
        setDiscountType(q.discount_type || 'PERCENTAGE');
        setDiscountValue(q.discount_value || 0);
        setTaxPercentage(q.tax_percentage !== undefined ? q.tax_percentage : 5.0);

        // Map dishes
        const itemMap: { [id: number]: { item: MenuItem; quantity: number } } = {};
        if (q.items && q.items.length > 0) {
          q.items.forEach(qi => {
            const found = menuItems.find(m => m.id === qi.menu_item_id || m.name.toLowerCase() === qi.item_name_snapshot.toLowerCase());
            const menuItem: MenuItem = found || {
              id: qi.menu_item_id || Math.floor(Math.random() * 100000),
              name: qi.item_name_snapshot,
              category_name: qi.category_snapshot || 'Special Dishes',
              service_type: (qi.service_type_snapshot as any) || 'STANDARD',
              pricing_unit: (qi.pricing_unit_snapshot as any) || 'PER_PERSON',
              selling_price: qi.selling_price_snapshot,
              is_demo_price: 0,
              is_seasonal: 0,
              is_active: 1,
              display_order: 0
            };
            itemMap[menuItem.id] = {
              item: menuItem,
              quantity: qi.quantity || 1
            };
          });
        }
        setSelectedItems(itemMap);

        // Map cutlery: merge saved proposal cutlery with catalog items
        if (q.cutlery && q.cutlery.length > 0) {
          const savedMap = new Map<string, CutleryItem>(q.cutlery.map(c => [c.cutlery_name.toLowerCase(), c]));
          const merged: ProposalCutleryItem[] = cutleryMaster.map(m => {
            const saved = savedMap.get(m.name.toLowerCase());
            if (saved) {
              savedMap.delete(m.name.toLowerCase());
              return {
                ...saved,
                master_id: m.id,
                calculation_type: m.calculation_type,
                default_ratio: m.default_ratio,
                is_selected: true
              };
            } else {
              const qty = m.calculation_type === 'PER_GUEST' ? Math.ceil(gCount * m.default_ratio) : Math.ceil(m.default_ratio);
              return {
                master_id: m.id,
                cutlery_name: m.name,
                category: m.category,
                calculation_type: m.calculation_type,
                default_ratio: m.default_ratio,
                quantity: qty,
                unit_cost: m.default_unit_cost,
                total_cost: Math.round(qty * m.default_unit_cost),
                is_included: 1,
                is_selected: false
              };
            }
          });
          // Any additional items in proposal that were custom
          savedMap.forEach(saved => {
            merged.push({
              ...saved,
              is_selected: true
            });
          });
          setCutleryItems(merged);
        } else if (cutleryMaster.length > 0) {
          setCutleryItems(buildCutleryFromMaster(cutleryMaster, gCount));
        }
      } catch (err) {
        console.error('Failed to load quotation for editing', err);
      }
    };
    loadEditingQuotation();
  }, [editingQuotationId, cutleryMaster.length]);

  // Synchronize cutlery quantities with guest count
  const handleResyncCutlery = (newCount: number) => {
    setCutleryItems(prev => {
      return prev.map(item => {
        const master = cutleryMaster.find(m => m.id === item.master_id || m.name.toLowerCase() === item.cutlery_name.toLowerCase());
        const calcType = item.calculation_type || master?.calculation_type || 'PER_GUEST';
        const ratio = item.default_ratio || master?.default_ratio || 1.0;
        if (calcType === 'PER_GUEST') {
          const qty = Math.ceil(newCount * ratio);
          return {
            ...item,
            quantity: qty,
            total_cost: Math.round(qty * item.unit_cost)
          };
        }
        return item;
      });
    });
  };

  const handleStartFromScratch = () => {
    quotationLoadedIdRef.current = null;
    setSelectedClientId(null);
    setDirectClientName('');
    setDirectClientPhone('');
    setDirectClientAddress('');
    setEditingEventId(null);
    setProposalEventType('');
    setCustomEventType('');
    setProposalEventDate('');
    setProposalEventVenue('');
    setSelectedItems({});
    setGuestCount(100);
    setCutleryItems(buildCutleryFromMaster(cutleryMaster, 100));
    setDiscountValue(0);
    setCreatedQuotationId(null);
    setEditingQuotationId(null);
    if (onResetEdit) onResetEdit();
  };

  const activeClient = clients.find(c => c.id === selectedClientId) || null;
  const activeEvent = events.find(e => e.client_id === selectedClientId) || null;

  const handleClientChange = (clientIdStr: string) => {
    if (!clientIdStr) {
      setSelectedClientId(null);
      return;
    }
    const cid = parseInt(clientIdStr);
    setSelectedClientId(cid);
  };

  const effectiveEventType = proposalEventType === 'Custom' 
    ? customEventType 
    : proposalEventType;
  const effectiveEventDate = proposalEventDate;
  const effectiveVenue = proposalEventVenue;

  const handleToggleItem = (item: MenuItem) => {
    setSelectedItems(prev => {
      const copy = { ...prev };
      if (copy[item.id]) {
        delete copy[item.id];
      } else {
        copy[item.id] = {
          item,
          quantity: item.pricing_unit === 'PER_KG' ? 10 : 1
        };
      }
      return copy;
    });
  };

  const handleRemoveItem = (itemId: number) => {
    setSelectedItems(prev => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  // Cutlery Handlers
  const handleToggleCutlerySelected = (index: number) => {
    setCutleryItems(prev => {
      const updated = [...prev];
      const row = { ...updated[index] };
      const nextSelected = !row.is_selected;
      row.is_selected = nextSelected;
      if (nextSelected && (!row.quantity || row.quantity === 0)) {
        const qty = row.calculation_type === 'PER_GUEST'
          ? Math.ceil(guestCount * (row.default_ratio || 1.0))
          : Math.ceil(row.default_ratio || 1.0);
        row.quantity = qty;
        row.total_cost = Math.round(qty * (row.unit_cost || 0));
      }
      updated[index] = row;
      return updated;
    });
  };

  const handleSelectAllCutlery = (selectAll: boolean) => {
    setCutleryItems(prev => prev.map(c => ({ ...c, is_selected: selectAll })));
  };

  const handleCutleryQtyChange = (index: number, qty: number) => {
    const updated = [...cutleryItems];
    const row = updated[index];
    const safeQty = Math.max(0, qty);
    updated[index] = {
      ...row,
      quantity: safeQty,
      total_cost: Math.round(safeQty * row.unit_cost)
    };
    setCutleryItems(updated);
  };

  const handleCutleryCostChange = (index: number, cost: number) => {
    const updated = [...cutleryItems];
    const row = updated[index];
    const safeCost = Math.max(0, cost);
    updated[index] = {
      ...row,
      unit_cost: safeCost,
      total_cost: Math.round(row.quantity * safeCost)
    };
    setCutleryItems(updated);
  };

  const handleToggleCutleryIncluded = (index: number) => {
    const updated = [...cutleryItems];
    updated[index] = {
      ...updated[index],
      is_included: updated[index].is_included === 1 ? 0 : 1
    };
    setCutleryItems(updated);
  };

  const handleRemoveCutleryItem = (index: number) => {
    setCutleryItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomCutlery = () => {
    if (!newCutleryName.trim()) return;
    const qty = Math.max(1, newCutleryQty || 1);
    const unitCost = Math.max(0, newCutleryUnitCost || 0);
    const newItem: ProposalCutleryItem = {
      cutlery_name: newCutleryName.trim(),
      category: newCutleryCat,
      calculation_type: 'FIXED',
      default_ratio: qty,
      quantity: qty,
      unit_cost: unitCost,
      total_cost: Math.round(qty * unitCost),
      is_included: newCutleryIncluded,
      is_selected: true
    };
    setCutleryItems(prev => [newItem, ...prev]);
    setNewCutleryName('');
    setIsAddCutleryModalOpen(false);
  };

  const selectedItemsArray = Object.values(selectedItems);

  // Calculations
  let perPersonSum = 0;
  let bulkItemsSum = 0;
  selectedItemsArray.forEach(({ item, quantity }) => {
    const price = item.selling_price || 0;
    if (item.pricing_unit === 'PER_PERSON' || item.pricing_unit === 'PER_PLATE') {
      perPersonSum += price;
    } else {
      bulkItemsSum += price * quantity;
    }
  });

  // Calculate unbundled / extra cutlery charges and total inventory costs
  let cutleryExtraCharge = 0;
  let cutleryTotalCost = 0;
  cutleryItems.forEach(c => {
    if (c.is_selected) {
      const lineCost = (c.total_cost && c.total_cost > 0) ? c.total_cost : (c.unit_cost * c.quantity);
      cutleryTotalCost += lineCost;
      if (c.is_included === 0) {
        cutleryExtraCharge += lineCost;
      }
    }
  });

  const subtotal = (perPersonSum * guestCount) + bulkItemsSum + cutleryExtraCharge;
  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    discountAmount = Math.round((subtotal * discountValue) / 100.0);
  } else {
    discountAmount = Math.min(subtotal, discountValue);
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableAmount * taxPercentage) / 100.0);
  const grandTotal = taxableAmount + taxAmount;

  // Filter items (hide empty categories from CategoryTabs!)
  const activeCategories = categories.filter(c => menuItems.some(m => m.category_id === c.id));

  const filteredItems = menuItems.filter(item => {
    if (selectedCategoryId && item.category_id !== selectedCategoryId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSaveQuotation = async () => {
    if (selectedItemsArray.length === 0) {
      alert('Please select at least one menu item to build a quotation');
      return;
    }

    setIsSaving(true);
    const itemsPayload = selectedItemsArray.map(({ item, quantity }) => ({
      menu_item_id: item.id,
      item_name: item.name,
      category: item.category_name,
      service_type: item.service_type,
      pricing_unit: item.pricing_unit,
      selling_price: item.selling_price || 0,
      quantity
    }));

    const cutleryPayload = cutleryItems
      .filter(c => c.is_selected)
      .map(c => ({
        cutlery_name: c.cutlery_name,
        category: c.category,
        quantity: c.quantity,
        unit_cost: c.unit_cost,
        total_cost: c.total_cost,
        is_included: c.is_included,
        notes: c.notes || ''
      }));

    const finalClientName = activeClient?.name || directClientName.trim() || 'Walk-in Client';
    const finalClientPhone = activeClient?.phone || directClientPhone.trim() || '';
    const finalClientAddress = activeClient?.address || directClientAddress.trim() || '';

    const payload = {
      client_id: selectedClientId || undefined,
      client_name: finalClientName,
      client_phone: finalClientPhone,
      client_address: finalClientAddress,
      event_id: editingEventId || undefined,
      event_type: effectiveEventType || 'Catering Event',
      event_date: effectiveEventDate || '2026-10-25',
      venue: effectiveVenue || 'Venue Pending',
      guest_count: guestCount,
      items: itemsPayload,
      addons: [],
      cutlery: cutleryPayload,
      discount_type: discountType,
      discount_value: discountValue,
      tax_percentage: taxPercentage,
      special_notes: 'Created via Digital Proposal Builder',
      created_by: 'Catering Representative'
    };

    try {
      if (editingQuotationId) {
        const res = await api.updateQuotation(editingQuotationId, payload);
        setCreatedQuotationId(res.id);
        setCreatedQuotationNumber(res.quotation_number);
        alert(`Proposal ${res.quotation_number} updated successfully!`);
        if (onQuotationSaved) onQuotationSaved(res.id);
      } else {
        const res = await api.createQuotation(payload);
        setCreatedQuotationId(res.id);
        setCreatedQuotationNumber(res.quotation_number);
        alert(`Quotation ${res.quotation_number} saved successfully!`);
        if (onQuotationSaved) onQuotationSaved(res.id);
      }
    } catch (err: any) {
      alert(`Error saving quotation: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (editingQuotationId) {
      await api.downloadQuotationPdf(editingQuotationId, `Proposal-${editingQuotationId}.pdf`);
      return;
    }
    if (createdQuotationId) {
      await api.downloadQuotationPdf(createdQuotationId, `${createdQuotationNumber}.pdf`);
      return;
    }

    if (selectedItemsArray.length === 0) {
      alert('Please select at least one menu item before generating a proposal PDF');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const itemsPayload = selectedItemsArray.map(({ item, quantity }) => ({
        menu_item_id: item.id,
        item_name: item.name,
        category: item.category_name,
        service_type: item.service_type,
        pricing_unit: item.pricing_unit,
        selling_price: item.selling_price || 0,
        quantity
      }));

      const cutleryPayload = cutleryItems
        .filter(c => c.is_selected)
        .map(c => ({
          cutlery_name: c.cutlery_name,
          category: c.category,
          quantity: c.quantity,
          unit_cost: c.unit_cost,
          total_cost: c.total_cost,
          is_included: c.is_included
        }));

      const finalClientName = activeClient?.name || directClientName.trim() || 'Esteemed Client';
      const finalClientPhone = activeClient?.phone || directClientPhone.trim() || '';
      const finalClientAddress = activeClient?.address || directClientAddress.trim() || '';

      const payload = {
        client_id: selectedClientId || undefined,
        client_name: finalClientName,
        client_phone: finalClientPhone,
        client_address: finalClientAddress,
        event_id: editingEventId || undefined,
        event_type: effectiveEventType || 'Catering Event',
        event_date: effectiveEventDate || '2026-10-25',
        venue: effectiveVenue || 'Venue Pending',
        guest_count: guestCount,
        items: itemsPayload,
        addons: [],
        cutlery: cutleryPayload,
        discount_type: discountType,
        discount_value: discountValue,
        tax_percentage: taxPercentage,
        special_notes: 'Created via Digital Proposal Builder',
        created_by: 'Catering Representative'
      };

      const res = await api.createQuotation(payload);
      setCreatedQuotationId(res.id);
      setCreatedQuotationNumber(res.quotation_number);
      await api.downloadQuotationPdf(res.id, `${res.quotation_number}.pdf`);
    } catch (err: any) {
      alert(`Failed to generate PDF: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1280px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.85rem', lineHeight: 1.15 }}>
              {editingQuotationId ? `Edit Proposal #${createdQuotationNumber}` : 'Create New Proposal'}
            </h1>
            {editingQuotationId && (
              <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>Editing Mode</span>
            )}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Curate event delicacies, specify guest counts, allocate tableware & cutlery, and generate instant client quotes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsReviewOpen(true)}
            className="btn btn-gold btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Sparkles size={15} />
            Preview Proposal Flyer
          </button>
        </div>
      </div>

      {/* Top Banner: Event Occasion, Venue & Headcount */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Row 1: Event / Occasion Setup & Reset */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: '1 1 500px' }}>
            {/* Event Type */}
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Occasion / Event (Optional)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                <select
                  value={proposalEventType}
                  onChange={(e) => setProposalEventType(e.target.value)}
                  style={{
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 600,
                    color: proposalEventType ? 'var(--brand-emerald)' : 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    minWidth: '190px'
                  }}
                >
                  <option value="">-- Choose Event (Optional) --</option>
                  <option value="Engagement">Engagement Ceremony</option>
                  <option value="Wedding">Wedding Feast / Muhurtham</option>
                  <option value="Wedding Reception">Wedding Reception</option>
                  <option value="Birthday Celebration">Birthday Celebration</option>
                  <option value="Corporate Gala">Corporate Gala</option>
                  <option value="Private Feast">Private Dinner / Feast</option>
                  <option value="Custom">Custom Occasion...</option>
                </select>

                {proposalEventType === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Occasion name..."
                    value={customEventType}
                    onChange={(e) => setCustomEventType(e.target.value)}
                    style={{
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.8125rem',
                      width: '150px',
                      outline: 'none'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Event Date */}
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Event Date (Optional)
              </div>
              <input
                type="date"
                value={proposalEventDate}
                onChange={(e) => setProposalEventDate(e.target.value)}
                style={{
                  marginTop: '0.25rem',
                  padding: '0.42rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontWeight: 500
                }}
              />
            </div>

            {/* Venue */}
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Venue / Hall (Optional)
              </div>
              <input
                type="text"
                placeholder="e.g. Grand Ballroom, Royal Convention Center"
                value={proposalEventVenue}
                onChange={(e) => setProposalEventVenue(e.target.value)}
                style={{
                  marginTop: '0.25rem',
                  padding: '0.42rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  width: '100%',
                  fontWeight: 500
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartFromScratch}
            className="btn btn-outline btn-sm"
            style={{
              borderColor: 'var(--brand-gold)',
              color: 'var(--brand-emerald)',
              fontWeight: 600,
              padding: '0.45rem 0.75rem',
              whiteSpace: 'nowrap'
            }}
            title="Clear all selections, event, and client to start fresh"
          >
            <RotateCcw size={14} color="var(--brand-gold)" />
            Start from Scratch
          </button>
        </div>

        {/* Row 2: Client Selection & Headcount Stepper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          {/* Client Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Client Particulars (Optional)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <select
                  value={selectedClientId || ''}
                  onChange={(e) => handleClientChange(e.target.value)}
                  style={{
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 600,
                    color: selectedClientId ? 'var(--brand-emerald)' : 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    minWidth: '220px',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Walk-in / Direct Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(true)}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.45rem 0.65rem', color: 'var(--brand-emerald)', borderColor: 'var(--border-medium)' }}
                  title="Register new client particulars"
                >
                  <UserPlus size={14} />
                  <span>+ Client</span>
                </button>

                {!selectedClientId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Client Name..."
                      value={directClientName}
                      onChange={(e) => setDirectClientName(e.target.value)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.8125rem',
                        width: '150px',
                        outline: 'none',
                        fontWeight: 600
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Phone..."
                      value={directClientPhone}
                      onChange={(e) => setDirectClientPhone(e.target.value)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.8125rem',
                        width: '120px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Headcount Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Headcount / Guests
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const nc = Math.max(10, guestCount - 25);
                    setGuestCount(nc);
                    handleResyncCutlery(nc);
                  }}
                  className="btn btn-outline"
                  style={{ width: '30px', height: '30px', padding: 0, borderRadius: '50%' }}
                >
                  -
                </button>
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--brand-emerald)',
                  minWidth: '55px',
                  textAlign: 'center'
                }}>
                  {guestCount}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nc = guestCount + 25;
                    setGuestCount(nc);
                    handleResyncCutlery(nc);
                  }}
                  className="btn btn-outline"
                  style={{ width: '30px', height: '30px', padding: 0, borderRadius: '50%' }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {[100, 250, 500, 700, 1000].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setGuestCount(c);
                    handleResyncCutlery(c);
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: guestCount === c ? '1px solid var(--brand-emerald)' : '1px solid var(--border-subtle)',
                    backgroundColor: guestCount === c ? 'var(--brand-emerald)' : 'var(--bg-canvas)',
                    color: guestCount === c ? '#FFFFFF' : 'var(--text-secondary)'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 360px',
        gap: '1.75rem',
        alignItems: 'start'
      }} className="builder-layout">

        {/* LEFT: Builder Section (Dishes vs Cutlery Tabs) */}
        <div>
          {/* Section View Switcher */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            borderBottom: '2px solid var(--border-subtle)',
            paddingBottom: '0.5rem'
          }}>
            <button
              type="button"
              onClick={() => setBuilderTab('DISHES')}
              className={`btn btn-sm ${builderTab === 'DISHES' ? 'btn-gold' : 'btn-outline'}`}
              style={{ fontSize: '0.8125rem', gap: '0.4rem', padding: '0.45rem 1rem' }}
            >
              <Utensils size={15} />
              <span>Brochure Dishes ({selectedItemsArray.length} Selected)</span>
            </button>

            <button
              type="button"
              onClick={() => setBuilderTab('CUTLERY')}
              className={`btn btn-sm ${builderTab === 'CUTLERY' ? 'btn-gold' : 'btn-outline'}`}
              style={{ fontSize: '0.8125rem', gap: '0.4rem', padding: '0.45rem 1rem' }}
            >
              <Layers size={15} />
              <span>Tableware & Cutlery ({cutleryItems.filter(c => c.is_selected).length} / {cutleryItems.length} Selected)</span>
            </button>
          </div>

          {/* TAB 1: MENU DISHES */}
          {builderTab === 'DISHES' && (
            <div>
              {/* Category Tabs & Search Bar (Empty categories hidden!) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '0.85rem'
                }}>
                  <CategoryTabs
                    categories={activeCategories}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={setSelectedCategoryId}
                    totalItemsCount={menuItems.length}
                  />

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.35rem 0.85rem',
                    minWidth: '200px'
                  }}>
                    <Search size={14} color="var(--text-muted)" />
                    <input
                      type="text"
                      placeholder="Search dishes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.8125rem', width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Dishes Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '0.85rem'
              }}>
                {filteredItems.map(item => {
                  const isSelected = !!selectedItems[item.id];
                  const currentQty = selectedItems[item.id]?.quantity || (item.pricing_unit === 'PER_KG' ? 10 : 1);

                  return (
                    <FoodCard
                      key={item.id}
                      item={item}
                      isSelected={isSelected}
                      onToggle={handleToggleItem}
                      customQuantity={currentQty}
                      onQuantityChange={(qty) => {
                        setSelectedItems(prev => ({
                          ...prev,
                          [item.id]: { item, quantity: qty }
                        }));
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUTLERY & TABLEWARE SELECTION */}
          {builderTab === 'CUTLERY' && (
            <div className="luxury-card" style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--brand-emerald)', margin: 0 }}>
                    Select Tableware & Cutlery
                  </h3>
                  <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                    Select which catalog items to include in this proposal. Rates and quantities scale automatically for {guestCount} guests.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleSelectAllCutlery(true)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllCutlery(false)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResyncCutlery(guestCount)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', gap: '0.3rem', padding: '0.35rem 0.65rem' }}
                    title="Recalculate quantities based on current headcount ratios"
                  >
                    <RefreshCw size={12} />
                    <span>Sync with {guestCount} Pax</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddCutleryModalOpen(true)}
                    className="btn btn-gold btn-sm"
                    style={{ fontSize: '0.75rem', gap: '0.3rem', padding: '0.35rem 0.65rem' }}
                  >
                    <PlusCircle size={13} />
                    <span>+ Custom Item</span>
                  </button>
                </div>
              </div>

              {/* Quick Cutlery Metric Summary */}
              <div style={{
                backgroundColor: 'var(--bg-parchment)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                fontSize: '0.78125rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={15} color="var(--brand-emerald)" />
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {cutleryItems.filter(c => c.is_selected).length} of {cutleryItems.length}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>items selected for this proposal</span>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Total Tableware Value: </span>
                    <span style={{ fontWeight: 700, color: 'var(--brand-emerald)', fontFamily: 'var(--font-serif)' }}>₹{cutleryTotalCost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Extra Charges Added: </span>
                    <span style={{ fontWeight: 700, color: cutleryExtraCharge > 0 ? '#B91C1C' : 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>₹{cutleryExtraCharge.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {cutleryItems.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
                  No cutlery or tableware allocated. Click "+ Add Tableware" or "Sync with {guestCount} Pax" to load catalog items.
                </div>
              ) : (
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '6%', textAlign: 'center' }}>Include</th>
                        <th style={{ width: '28%' }}>Item Name</th>
                        <th style={{ width: '16%' }}>Category</th>
                        <th style={{ width: '14%' }}>Cost Per One (₹)</th>
                        <th style={{ width: '14%' }}>Quantity</th>
                        <th style={{ width: '18%' }}>Pricing Status</th>
                        <th style={{ width: '4%', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cutleryItems.map((cut, idx) => {
                        const isSelected = cut.is_selected;
                        const lineTotal = (cut.total_cost && cut.total_cost > 0) ? cut.total_cost : Math.round(cut.unit_cost * cut.quantity);

                        return (
                          <tr
                            key={idx}
                            style={{
                              backgroundColor: isSelected ? '#FFFFFF' : '#FAFAFA',
                              opacity: isSelected ? 1 : 0.6
                            }}
                          >
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleCutlerySelected(idx)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--brand-emerald)' }}
                                title={isSelected ? 'Included in proposal' : 'Click to include in proposal'}
                              />
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{
                                  fontWeight: isSelected ? 700 : 500,
                                  color: isSelected ? 'var(--brand-emerald)' : 'var(--text-muted)',
                                  fontSize: '0.875rem'
                                }}>
                                  {cut.cutlery_name}
                                </span>
                                {cut.calculation_type && (
                                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                    {cut.calculation_type === 'PER_GUEST'
                                      ? `${cut.default_ratio || 1.0} per guest`
                                      : 'Fixed quantity'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                                {cut.category}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--brand-gold)', fontWeight: 700 }}>₹</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  disabled={!isSelected}
                                  value={cut.unit_cost}
                                  onChange={(e) => handleCutleryCostChange(idx, parseFloat(e.target.value) || 0)}
                                  style={{
                                    width: '70px',
                                    padding: '0.35rem 0.4rem',
                                    fontSize: '0.8125rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-medium)',
                                    fontWeight: 700,
                                    color: 'var(--brand-emerald)'
                                  }}
                                  title="Unit cost / rental cost per single piece"
                                />
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!isSelected}
                                  value={cut.quantity}
                                  onChange={(e) => handleCutleryQtyChange(idx, parseInt(e.target.value) || 0)}
                                  style={{ width: '80px', padding: '0.35rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontWeight: 600 }}
                                />
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  (₹{lineTotal.toLocaleString()})
                                </span>
                              </div>
                            </td>
                            <td>
                              {isSelected ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleCutleryIncluded(idx)}
                                  className={`badge ${cut.is_included === 1 ? 'badge-emerald' : 'badge-gold'}`}
                                  style={{ cursor: 'pointer', border: 'none', padding: '0.3rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700 }}
                                  title="Click to toggle between Included in Package Rate and Extra Rental Charge"
                                >
                                  {cut.is_included === 1 ? '✓ Included in Package' : `+ ₹${lineTotal.toLocaleString()} Extra Charge`}
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Excluded</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveCutleryItem(idx)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.2rem', color: '#DC2626' }}
                                title="Remove item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Clean Quotation Summary */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border-medium)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          position: 'sticky',
          top: '80px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-gold)' }}>
              Selected Proposal
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--brand-emerald)', lineHeight: 1.15 }}>
                  Quotation Summary
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {activeClient?.name || directClientName || 'Direct / Walk-in Client'} • {guestCount} guests
                </div>
              </div>
              {selectedItemsArray.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedItems({})}
                  style={{
                    border: 'none',
                    background: 'none',
                    fontSize: '0.75rem',
                    color: '#DC2626',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    padding: '0.2rem'
                  }}
                  title="Clear all selected dishes"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Selected Items Scroll Area */}
          <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.25rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {selectedItemsArray.length === 0 ? (
              <div style={{ padding: '1.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Select items from the menu to build the proposal.
              </div>
            ) : (
              selectedItemsArray.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'var(--bg-canvas)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem'
                  }}
                >
                  <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    {item.service_type === 'LIVE_COUNTER' && (
                      <span style={{ fontSize: '0.6875rem', color: '#BE123C', marginLeft: '0.3rem', fontWeight: 700 }}>(live)</span>
                    )}
                    {item.pricing_unit !== 'PER_PERSON' && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>
                        × {quantity} {item.pricing_unit.replace('PER_', '')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--brand-emerald)' }}>
                      ₹{item.selling_price}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Price Per Person Highlight */}
          <div style={{
            backgroundColor: 'var(--bg-canvas)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem'
          }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Per Person Rate
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--brand-emerald)' }}>
                {selectedItemsArray.filter(i => i.item.pricing_unit === 'PER_PERSON').length} menu items
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
              ₹{perPersonSum.toLocaleString()}
            </div>
          </div>

          {/* Cutlery Summary Line */}
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.65rem',
            padding: '0.35rem 0.65rem',
            backgroundColor: '#F8FAFC',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span>Tableware Allocated:</span>
            <span style={{ fontWeight: 600, color: 'var(--brand-emerald)' }}>
              {cutleryItems.filter(c => c.is_selected).length} items {cutleryExtraCharge > 0 ? `(+₹${cutleryExtraCharge.toLocaleString()} rental)` : '(Included)'}
            </span>
          </div>

          {/* Subtotal, Discount & Tax breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{subtotal.toLocaleString()}</span>
            </div>

            {cutleryExtraCharge > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Extra Cutlery Rental:</span>
                <span style={{ fontWeight: 600, color: 'var(--brand-emerald)' }}>+ ₹{cutleryExtraCharge.toLocaleString()}</span>
              </div>
            )}

            {/* Dedicated Discount / Concession Section */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.65rem 0.75rem',
              marginTop: '0.25rem',
              marginBottom: '0.4rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.45rem'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Discount / Concession
                </span>
                {discountValue > 0 && (
                  <button
                    type="button"
                    onClick={() => setDiscountValue(0)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#EF4444',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Mode Toggle: Percentage vs Fixed Amount */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.35rem',
                marginBottom: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('PERCENTAGE');
                    if (discountType === 'FIXED' && discountValue > 100) setDiscountValue(5);
                  }}
                  style={{
                    padding: '0.3rem 0.4rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    backgroundColor: discountType === 'PERCENTAGE' ? 'var(--brand-emerald)' : '#FFFFFF',
                    color: discountType === 'PERCENTAGE' ? '#FFFFFF' : '#64748B',
                    borderColor: discountType === 'PERCENTAGE' ? 'var(--brand-emerald)' : '#CBD5E1'
                  }}
                >
                  % Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('FIXED')}
                  style={{
                    padding: '0.3rem 0.4rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    backgroundColor: discountType === 'FIXED' ? 'var(--brand-emerald)' : '#FFFFFF',
                    color: discountType === 'FIXED' ? '#FFFFFF' : '#64748B',
                    borderColor: discountType === 'FIXED' ? 'var(--brand-emerald)' : '#CBD5E1'
                  }}
                >
                  ₹ Amount
                </button>
              </div>

              {/* Input Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{
                    position: 'absolute',
                    left: '0.55rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#64748B'
                  }}>
                    {discountType === 'PERCENTAGE' ? '%' : '₹'}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={discountType === 'PERCENTAGE' ? 100 : subtotal}
                    step={discountType === 'PERCENTAGE' ? 1 : 100}
                    value={discountValue || ''}
                    placeholder={discountType === 'PERCENTAGE' ? 'e.g. 5%' : 'e.g. 2000'}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (discountType === 'PERCENTAGE') {
                        setDiscountValue(Math.min(100, Math.max(0, val)));
                      } else {
                        setDiscountValue(Math.min(subtotal, Math.max(0, val)));
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.35rem 0.5rem 0.35rem 1.6rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                </div>

                {discountAmount > 0 && (
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#059669',
                    whiteSpace: 'nowrap',
                    padding: '0.3rem 0.5rem',
                    backgroundColor: '#ECFDF5',
                    borderRadius: '6px',
                    border: '1px solid #A7F3D0'
                  }}>
                    - ₹{discountAmount.toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Catering GST (5%):</span>
              <span style={{ fontWeight: 600 }}>₹{taxAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Grand Total */}
          <div style={{
            backgroundColor: '#0A192F',
            color: '#FFFFFF',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--brand-gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                Grand Total
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                All inclusive
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 800 }}>
              ₹{grandTotal.toLocaleString()}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() => setIsReviewOpen(true)}
              className="btn btn-gold"
              style={{ width: '100%', padding: '0.65rem' }}
            >
              <Sparkles size={15} />
              Review Brochure Proposal
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf || selectedItemsArray.length === 0}
              className="btn btn-outline"
              style={{
                width: '100%',
                padding: '0.65rem',
                borderColor: 'var(--border-medium)',
                color: 'var(--brand-emerald)',
                fontWeight: 600
              }}
            >
              <Download size={15} color="var(--brand-gold)" />
              {isGeneratingPdf ? 'Generating PDF...' : 'Download Official PDF'}
            </button>

            <button
              type="button"
              onClick={handleSaveQuotation}
              disabled={isSaving || selectedItemsArray.length === 0}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem' }}
            >
              <Check size={15} />
              {isSaving ? (editingQuotationId ? 'Updating...' : 'Saving...') : (editingQuotationId ? 'Update Proposal' : 'Save Quotation')}
            </button>
          </div>
        </div>
      </div>

      {/* FLYER-STYLE REVIEW MODAL */}
      <QuotationReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        quotationNumber={createdQuotationNumber}
        client={activeClient}
        event={{
          id: activeEvent?.id,
          event_type: effectiveEventType,
          event_date: effectiveEventDate,
          venue: effectiveVenue,
          guest_count: guestCount
        }}
        guestCount={guestCount}
        selectedItems={selectedItemsArray}
        selectedAddons={[]}
        cutlery={cutleryItems.filter(c => c.is_selected)}
        discountType={discountType}
        discountValue={discountValue}
        taxPercentage={taxPercentage}
        settings={settings}
        onDownloadPdf={handleDownloadPDF}
      />

      {/* NEW CLIENT MODAL */}
      {isNewClientModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewClientModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '1.75rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--brand-emerald)', marginBottom: '1rem' }}>
              Add New Client
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Client Name *"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={{ padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontSize: '0.8125rem' }}
              />
              <input
                type="text"
                placeholder="Phone Number *"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                style={{ padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontSize: '0.8125rem' }}
              />
              <input
                type="text"
                placeholder="Address / City"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                style={{ padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontSize: '0.8125rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsNewClientModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!clientName || !clientPhone) return;
                    try {
                      const createdC = await api.createClient({ name: clientName, phone: clientPhone, address: clientAddress });
                      if (eventType || eventDate || eventVenue) {
                        const createdE = await api.createEvent({
                          client_id: createdC.id,
                          event_type: eventType,
                          event_date: eventDate,
                          venue: eventVenue,
                          guest_count: guestCount
                        });
                        setEvents(prev => [createdE, ...prev]);
                      }
                      setClients(prev => [createdC, ...prev]);
                      setSelectedClientId(createdC.id);
                      setIsNewClientModalOpen(false);
                      setClientName('');
                      setClientPhone('');
                      setClientAddress('');
                      setEventType('');
                      setEventDate('');
                      setEventVenue('');
                    } catch (err: any) {
                      alert(`Error: ${err.message}`);
                    }
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Save & Select
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM CUTLERY ITEM MODAL */}
      {isAddCutleryModalOpen && (
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
            maxWidth: '440px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-medium)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--brand-emerald)', margin: 0 }}>
                Add Tableware / Cutlery Item
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCutleryModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Copper Water Goblets, Gold Urli"
                  value={newCutleryName}
                  onChange={(e) => setNewCutleryName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>Category</label>
                  <select
                    value={newCutleryCat}
                    onChange={(e) => setNewCutleryCat(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontSize: '0.8125rem' }}
                  >
                    <option value="Plates & Dinnerware">Plates & Dinnerware</option>
                    <option value="Flatware & Cutlery">Flatware & Cutlery</option>
                    <option value="Glassware & Drinkware">Glassware & Drinkware</option>
                    <option value="Buffet & Warming Stations">Buffet Stations</option>
                    <option value="Linen & Napkins">Linen & Napkins</option>
                    <option value="Serving Tableware">Serving Tableware</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newCutleryQty}
                    onChange={(e) => setNewCutleryQty(parseInt(e.target.value) || 1)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={newCutleryUnitCost}
                    onChange={(e) => setNewCutleryUnitCost(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>Cost Mode</label>
                  <select
                    value={newCutleryIncluded}
                    onChange={(e) => setNewCutleryIncluded(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontSize: '0.8125rem' }}
                  >
                    <option value={1}>Included in Plate Rate</option>
                    <option value={0}>Extra Rental Charge</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAddCutleryModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomCutlery}
                  disabled={!newCutleryName.trim()}
                  className="btn btn-gold"
                  style={{ flex: 1 }}
                >
                  Add to Quotation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .builder-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
