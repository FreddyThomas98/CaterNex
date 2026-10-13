import React, { useState, useEffect } from 'react';
import { Quotation, UserRole } from '../types';
import { api } from '../services/api';
import { QuotationReviewModal } from '../components/QuotationReviewModal';
import { PurchaseListModal } from '../components/PurchaseListModal';
import { Search, Plus, Download, Eye, Trash2, Edit3, ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react';

interface QuotationsListProps {
  userRole: UserRole;
  onNavigate: (view: string, params?: any) => void;
}

export const QuotationsList: React.FC<QuotationsListProps> = ({ userRole, onNavigate }) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedPurchaseQuoteId, setSelectedPurchaseQuoteId] = useState<number | null>(null);

  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.getQuotations({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: search.trim() || undefined
      });
      setQuotations(res);
    } catch (err) {
      console.error('Failed to load quotations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [selectedStatus]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.updateQuotationStatus(id, newStatus);
      loadQuotations();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const confirmDeleteQuotation = async () => {
    if (!quotationToDelete) return;
    const targetId = quotationToDelete.id;
    const targetNum = quotationToDelete.quotation_number;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.deleteQuotation(targetId);
      setQuotations(prev => prev.filter(q => q.id !== targetId));
      setQuotationToDelete(null);
      setDeleteSuccess(`Quotation ${targetNum} has been permanently deleted.`);
      setTimeout(() => setDeleteSuccess(''), 4000);
      loadQuotations();
    } catch (err: any) {
      console.error('Delete quotation error:', err);
      setDeleteError(err.message || 'Failed to delete quotation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenReview = async (id: number) => {
    try {
      const detail = await api.getQuotation(id);
      setSelectedQuotation(detail);
      setIsReviewOpen(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1200px' }}>
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
          <h1 style={{ fontSize: '1.85rem', lineHeight: 1.15 }}>
            All Quotations
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Review and download official client PDF proposals.
          </p>
        </div>

        {userRole !== 'USER' && (
          <button
            onClick={() => onNavigate('new-quotation')}
            className="btn btn-gold btn-sm"
          >
            <Plus size={15} />
            New Quotation
          </button>
        )}
      </div>

      {deleteSuccess && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: 'var(--radius-md)',
          color: '#065F46',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>{deleteSuccess}</span>
        </div>
      )}

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
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['ALL', 'DRAFT', 'SENT', 'CONFIRMED'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`cat-pill ${selectedStatus === st ? 'active' : ''}`}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
            >
              {st}
            </button>
          ))}
        </div>

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
            placeholder="Search quotations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.8125rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Quotations Data Table */}
      <div className="luxury-card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Quotation Ref</th>
              <th>Client</th>
              <th>Event & Venue</th>
              <th>Guests</th>
              <th>Total (₹)</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  Loading quotations...
                </td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No quotations found.
                </td>
              </tr>
            ) : (
              quotations.map(q => (
                <tr key={q.id}>
                  <td>
                    <span style={{ fontWeight: 800, color: 'var(--brand-emerald)', fontFamily: 'var(--font-serif)' }}>
                      {q.quotation_number}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {q.created_at?.slice(0, 10)}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{q.client_name || 'Client Unlinked'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.client_phone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{q.event_type || 'Engagement'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{q.venue}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--brand-emerald)' }}>
                      {q.guest_count} pax
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, color: 'var(--brand-emerald)', fontSize: '1.05rem' }}>
                      ₹{q.grand_total.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    {userRole === 'USER' ? (
                      <span className={`badge ${q.status === 'CONFIRMED' ? 'badge-emerald' : q.status === 'SENT' ? 'badge-gold' : 'badge-neutral'}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {q.status}
                      </span>
                    ) : (
                      <select
                        value={q.status}
                        onChange={(e) => handleStatusChange(q.id, e.target.value)}
                        style={{
                          padding: '0.2rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: '1px solid var(--border-medium)',
                          backgroundColor: 'var(--bg-parchment)',
                          outline: 'none'
                        }}
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="SENT">SENT</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                      </select>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => setSelectedPurchaseQuoteId(q.id)}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#0A192F', borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', fontWeight: 600, fontSize: '0.75rem', gap: '0.35rem', display: 'inline-flex', alignItems: 'center' }}
                        title="View scaled raw material procurement list for this quotation"
                      >
                        <ShoppingCart size={13} color="var(--brand-gold)" />
                        <span>Purchase List</span>
                      </button>

                      <button
                        onClick={() => handleOpenReview(q.id)}
                        className="btn btn-outline btn-sm"
                        title="View Proposal"
                      >
                        <Eye size={13} />
                      </button>

                      {userRole !== 'USER' && (
                        <button
                          onClick={() => onNavigate('new-quotation', { quotationId: q.id })}
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--brand-emerald)', borderColor: 'var(--brand-gold-border)' }}
                          title="Edit Proposal"
                        >
                          <Edit3 size={13} color="var(--brand-gold)" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Edit</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          api.downloadQuotationPdf(q.id, `${q.quotation_number}.pdf`);
                        }}
                        className="btn btn-gold btn-sm"
                        title="Download PDF"
                      >
                        <Download size={13} />
                      </button>

                      {userRole !== 'USER' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuotationToDelete(q);
                            setDeleteError('');
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#B91C1C', borderColor: '#FECACA' }}
                          title="Delete Proposal"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {quotationToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => !isDeleting && setQuotationToDelete(null)}
          style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '90%', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
            }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Delete Quotation?
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to delete proposal <strong style={{ color: 'var(--text-primary)' }}>{quotationToDelete.quotation_number}</strong>
              {quotationToDelete.client_name ? ` for ${quotationToDelete.client_name}` : ''}?
              <br />
              <span style={{ color: '#B91C1C', fontSize: '0.8rem', fontWeight: 600 }}>This will permanently remove this quotation and cannot be undone.</span>
            </p>

            {deleteError && (
              <div style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: 'var(--radius-md)',
                color: '#991B1B',
                fontSize: '0.8125rem',
                marginBottom: '1.25rem',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <AlertCircle size={15} />
                <span>{deleteError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => { setQuotationToDelete(null); setDeleteError(''); }}
                className="btn btn-outline"
                disabled={isDeleting}
                style={{ flex: 1, padding: '0.65rem', fontWeight: 600 }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteQuotation}
                className="btn"
                disabled={isDeleting}
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
                  gap: '0.5rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? (
                  <>
                    <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROPOSAL MODAL */}
      {selectedQuotation && (
        <QuotationReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          quotationNumber={selectedQuotation.quotation_number}
          client={selectedQuotation.client || {
            name: selectedQuotation.client_name,
            phone: selectedQuotation.client_phone,
            address: selectedQuotation.client_address
          }}
          event={selectedQuotation.event || {
            event_type: selectedQuotation.event_type,
            event_date: selectedQuotation.event_date || '2026-12-28',
            venue: selectedQuotation.venue
          }}
          guestCount={selectedQuotation.guest_count}
          selectedItems={selectedQuotation.items ? selectedQuotation.items.map(i => ({
            item: {
              id: i.menu_item_id || 0,
              name: i.item_name_snapshot,
              category_name: i.category_snapshot,
              service_type: (i.service_type_snapshot as any) || 'STANDARD',
              pricing_unit: (i.pricing_unit_snapshot as any) || 'PER_PERSON',
              selling_price: i.selling_price_snapshot,
              is_demo_price: 0,
              is_seasonal: 0,
              is_active: 1,
              display_order: 0
            },
            quantity: i.quantity
          })) : []}
          selectedAddons={[]}
          cutlery={selectedQuotation.cutlery || []}
          discountType={selectedQuotation.discount_type || 'PERCENTAGE'}
          discountValue={selectedQuotation.discount_value || 0}
          taxPercentage={selectedQuotation.tax_percentage || 5.0}
          onDownloadPdf={() => api.downloadQuotationPdf(selectedQuotation.id, `${selectedQuotation.quotation_number}.pdf`)}
          onEdit={() => {
            setIsReviewOpen(false);
            onNavigate('new-quotation', { quotationId: selectedQuotation.id });
          }}
        />
      )}

      {/* Purchase List Modal */}
      {selectedPurchaseQuoteId && (
        <PurchaseListModal
          quotationId={selectedPurchaseQuoteId}
          onClose={() => setSelectedPurchaseQuoteId(null)}
        />
      )}
    </div>
  );
};
