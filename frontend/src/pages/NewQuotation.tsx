import React, { useState, useEffect } from 'react';
import { MenuItem, Category, Client, CateringEvent, UserRole, CompanySettings } from '../types';
import { api } from '../services/api';
import { GuestCounter } from '../components/GuestCounter';
import { FoodCard } from '../components/FoodCard';
import { CategoryTabs } from '../components/CategoryTabs';
import { QuotationReviewModal } from '../components/QuotationReviewModal';
import {
  Search, Plus, UserPlus, Check, X, FileText, Download, Sparkles, RotateCcw
} from 'lucide-react';

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

  // Proposal State
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [guestCount, setGuestCount] = useState<number>(700);
  const [selectedItems, setSelectedItems] = useState<{ [id: number]: { item: MenuItem; quantity: number } }>({});
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxPercentage, setTaxPercentage] = useState<number>(5.0);

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, items, cls, evts, sett] = await Promise.all([
          api.getCategories(),
          api.getMenuItems({ active_only: true }),
          api.getClients(),
          api.getEvents(),
          api.getSettings()
        ]);
        setCategories(cats);
        setMenuItems(items);
        setClients(cls);
        setEvents(evts);
        setSettings(sett);

        // DO NOT auto-select anything - start completely clean and optional
        if (!editQuotationId) {
          setSelectedClientId(null);
          setSelectedItems({});
          setProposalEventType('');
          setCustomEventType('');
          setProposalEventDate('');
          setProposalEventVenue('');
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
    }
  }, [editQuotationId]);

  useEffect(() => {
    if (!editingQuotationId || menuItems.length === 0) return;
    const loadEditingQuotation = async () => {
      try {
        const q = await api.getQuotation(editingQuotationId);
        setCreatedQuotationId(q.id);
        setCreatedQuotationNumber(q.quotation_number);
        setGuestCount(q.guest_count || 100);
        setSelectedClientId(q.client_id || null);
        setProposalEventType(q.event?.event_type || q.event_type || '');
        setProposalEventDate(q.event?.event_date || q.event_date || '');
        setProposalEventVenue(q.event?.venue || q.venue || '');
        setDiscountType(q.discount_type || 'PERCENTAGE');
        setDiscountValue(q.discount_value || 0);
        setTaxPercentage(q.tax_percentage !== undefined ? q.tax_percentage : 5.0);

        // Map items
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
      } catch (err) {
        console.error('Failed to load quotation for editing', err);
      }
    };
    loadEditingQuotation();
  }, [editingQuotationId, menuItems]);

  const handleStartFromScratch = () => {
    setSelectedClientId(null);
    setProposalEventType('');
    setCustomEventType('');
    setProposalEventDate('');
    setProposalEventVenue('');
    setSelectedItems({});
    setGuestCount(100);
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

  const subtotal = (perPersonSum * guestCount) + bulkItemsSum;
  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    discountAmount = Math.round((subtotal * discountValue) / 100.0);
  } else {
    discountAmount = Math.min(subtotal, discountValue);
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableAmount * taxPercentage) / 100.0);
  const grandTotal = taxableAmount + taxAmount;

  // Filter items
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

    const payload = {
      client_id: selectedClientId || undefined,
      client_name: activeClient?.name || 'Walk-in Client',
      client_phone: activeClient?.phone || '',
      client_address: activeClient?.address || 'Kerala',
      event_type: effectiveEventType,
      event_date: effectiveEventDate || '2026-12-28',
      venue: effectiveVenue || 'Venue Pending',
      guest_count: guestCount,
      items: itemsPayload,
      addons: [],
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
        if (onQuotationSaved) onQuotationSaved(res.id);
        alert(`Proposal ${res.quotation_number} updated successfully!`);
      } else {
        const res = await api.createQuotation(payload);
        setCreatedQuotationId(res.id);
        setCreatedQuotationNumber(res.quotation_number);
        if (onQuotationSaved) onQuotationSaved(res.id);
        alert(`Quotation ${res.quotation_number} saved successfully!`);
      }
    } catch (err: any) {
      alert(`Error saving quotation: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (createdQuotationId) {
      window.open(`/api/quotations/${createdQuotationId}/pdf`, '_blank');
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

      const payload = {
        client_id: selectedClientId || undefined,
        client_name: activeClient?.name || 'Esteemed Client',
        client_phone: activeClient?.phone || '',
        client_address: activeClient?.address || 'Kerala',
        event_type: effectiveEventType,
        event_date: effectiveEventDate,
        venue: effectiveVenue,
        guest_count: guestCount,
        items: itemsPayload,
        addons: [],
        discount_type: discountType,
        discount_value: discountValue,
        tax_percentage: taxPercentage
      };

      const res = await fetch('/api/quotations/preview-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('PDF generation failed on server');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanEventTitle = (effectiveEventType || 'Proposal').replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `B_and_Co_${cleanEventTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert(`Could not download PDF: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1360px', padding: '1.5rem 2rem 3rem' }}>
      {/* Editing Mode Banner */}
      {editingQuotationId && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1.5px solid #A7F3D0',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="badge badge-emerald">Editing Mode</span>
            <span style={{ fontWeight: 700, color: 'var(--brand-emerald)', fontSize: '0.9rem' }}>
              Editing Proposal #{createdQuotationNumber}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              (Modify guest count, dishes, or event details, then click "Update Proposal")
            </span>
          </div>

          <button
            type="button"
            onClick={handleStartFromScratch}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem' }}
          >
            Create New From Scratch
          </button>
        </div>
      )}

      {/* Top Banner: Optional Event Setup & Client Selector + Guest Scale */}
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
        {/* Row 1: Event / Occasion Setup (Optional) & Reset */}
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
                placeholder="e.g. CONTOUR Convention Centre, Changanasery"
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
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 600,
                    color: selectedClientId ? 'var(--brand-emerald)' : 'var(--text-muted)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    minWidth: '220px'
                  }}
                >
                  <option value="">-- Walk-in / Unassigned Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(true)}
                  className="btn btn-outline btn-sm"
                  title="Register New Client"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={14} />
                  <span>New Client</span>
                </button>
              </div>
            </div>

            {activeClient && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '0.5rem' }}>
                📍 {activeClient.address || 'Kerala'} • 📞 {activeClient.phone}
              </div>
            )}
          </div>

          {/* Headcount Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Guest Count
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                <button
                  type="button"
                  onClick={() => setGuestCount(Math.max(10, guestCount - 25))}
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
                  onClick={() => setGuestCount(guestCount + 25)}
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
                  onClick={() => setGuestCount(c)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: guestCount === c ? '1px solid var(--brand-emerald)' : '1px solid var(--border-subtle)',
                    backgroundColor: guestCount === c ? 'var(--brand-emerald)' : 'var(--bg-parchment)',
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

        {/* LEFT: Menu Categories & Dishes */}
        <div>
          {/* Category Tabs & Search Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '0.85rem'
            }}>
              <CategoryTabs
                categories={categories}
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

        {/* RIGHT: Clean Quotation Summary */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--brand-gold-border)',
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
                  {activeClient?.name || 'Unassigned Client'} • {guestCount} guests
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
          <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '0.25rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {selectedItemsArray.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
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
                    backgroundColor: 'var(--bg-parchment)',
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
            backgroundColor: 'var(--bg-parchment)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--brand-gold-border)',
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

          {/* Subtotal, Discount & Tax breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{subtotal.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Discount ({discountValue}%):</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="number"
                  min={0}
                  max={userRole === 'ADMIN' ? 100 : (userRole === 'MANAGER' ? 15 : 5)}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  style={{ width: '45px', padding: '0.15rem', textAlign: 'center', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
                />
                {discountAmount > 0 && <span style={{ color: 'var(--brand-emerald)', fontWeight: 700 }}>-₹{discountAmount}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Catering GST (5%):</span>
              <span style={{ fontWeight: 600 }}>₹{taxAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Grand Total */}
          <div style={{
            backgroundColor: '#0A2518',
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
              <div style={{ fontSize: '0.6875rem', color: '#A3BAAD' }}>
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
                borderColor: 'var(--brand-gold)',
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

      <style>{`
        @media (max-width: 1024px) {
          .builder-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
