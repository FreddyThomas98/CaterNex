import React, { useState, useEffect } from 'react';
import { CateringEvent, Quotation } from '../types';
import { api } from '../services/api';
import { PurchaseListModal } from '../components/PurchaseListModal';
import {
  ShoppingCart, Calendar, Users, FileText, CheckCircle2,
  Clock, ArrowRight, Printer, AlertCircle, Search
} from 'lucide-react';

export const ProcurementPage: React.FC = () => {
  const [events, setEvents] = useState<CateringEvent[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Active Purchase List Modal
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [activeQuotationId, setActiveQuotationId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [evList, qList] = await Promise.all([
        api.getEvents(),
        api.getQuotations()
      ]);
      setEvents(evList);
      setQuotations(qList);
    } catch (err) {
      console.error('Failed to load events for procurement', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEvents = events.filter(e =>
    e.event_type.toLowerCase().includes(search.toLowerCase()) ||
    (e.client_name && e.client_name.toLowerCase().includes(search.toLowerCase())) ||
    e.venue.toLowerCase().includes(search.toLowerCase()) ||
    e.event_date.includes(search)
  );

  return (
    <div className="page-wrapper" style={{ padding: '2rem 2.5rem' }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: '#0A2518',
        borderRadius: 'var(--radius-xl)',
        padding: '2rem 2.5rem',
        color: '#FFFFFF',
        marginBottom: '2rem',
        backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(185, 146, 75, 0.2) 0%, transparent 50%)',
        border: '1.5px solid rgba(185, 146, 75, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(185, 146, 75, 0.2)', color: 'var(--brand-gold)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <ShoppingCart size={14} />
            <span>Kitchen & Store Procurement Engine</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: '#FAF3E3', lineHeight: 1.2, margin: 0 }}>
            Automated Purchase & Grocery Lists
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#B0C4B8', marginTop: '0.35rem', maxWidth: '650px' }}>
            Select any upcoming event or proposal to generate the exact raw materials, groceries, meats, and dairy required scaled to the event's guest count.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--brand-emerald)' }}>
              Events Ready for Procurement ({events.length})
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click "Generate Purchase List" to calculate raw material quantities and print market orders.
            </div>
          </div>

          <div style={{ maxWidth: '280px', width: '100%' }}>
            <input
              type="text"
              placeholder="Search event, venue, or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No events found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Event / Occasion</th>
                  <th style={{ width: '15%' }}>Date & Time</th>
                  <th style={{ width: '20%' }}>Venue & Location</th>
                  <th style={{ width: '15%' }}>Guest Count</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(ev => (
                  <tr key={ev.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--brand-emerald)', fontSize: '0.9rem' }}>
                          {ev.event_type}
                        </div>
                        {ev.client_name && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Client: {ev.client_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                        {ev.event_date}
                      </div>
                      {ev.event_time && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {ev.event_time}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {ev.venue}
                      </div>
                      {ev.venue_address && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {ev.venue_address}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                        {ev.guest_count} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>pax</span>
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${ev.status === 'CONFIRMED' ? 'badge-confirmed' : 'badge-neutral'}`} style={{ fontSize: '0.6875rem' }}>
                        {ev.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveQuotationId(null);
                          setActiveEventId(ev.id);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', gap: '0.35rem', padding: '0.35rem 0.75rem' }}
                        title="Calculate exact raw materials and grocery shopping list"
                      >
                        <ShoppingCart size={13} />
                        <span>Purchase List</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purchase List Modal */}
      {(activeEventId || activeQuotationId) && (
        <PurchaseListModal
          eventId={activeEventId || undefined}
          quotationId={activeQuotationId || undefined}
          onClose={() => {
            setActiveEventId(null);
            setActiveQuotationId(null);
          }}
        />
      )}
    </div>
  );
};
