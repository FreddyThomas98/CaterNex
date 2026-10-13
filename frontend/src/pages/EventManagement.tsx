import React, { useState, useEffect } from 'react';
import { CateringEvent, Client, UserRole } from '../types';
import { api } from '../services/api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Users, Clock, CheckCircle2, Sparkles, Filter, Trash2, ShoppingCart } from 'lucide-react';
import { PurchaseListModal } from '../components/PurchaseListModal';

interface EventManagementProps {
  userRole: UserRole;
  onNavigate: (view: string, params?: any) => void;
}

export const EventManagement: React.FC<EventManagementProps> = ({ userRole, onNavigate }) => {
  const isReadOnly = userRole === 'USER';
  const [confirmedEvents, setConfirmedEvents] = useState<CateringEvent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Calendar Month State (Defaults to Current Month / Today)
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(todayStr);
  const [selectedPurchaseEventId, setSelectedPurchaseEventId] = useState<number | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CateringEvent>>({
    event_type: 'Wedding',
    event_date: todayStr,
    event_time: '18:00',
    venue: '',
    venue_address: '',
    guest_count: 500,
    status: 'CONFIRMED'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      // STRICT FILTER: Only load CONFIRMED orders/events into the calendar
      const [evts, cls] = await Promise.all([
        api.getEvents('CONFIRMED'),
        api.getClients()
      ]);
      const confirmedOnly = evts.filter(e => e.status === 'CONFIRMED');
      setConfirmedEvents(confirmedOnly);
      setClients(cls);
    } catch (err) {
      console.error('Failed to load confirmed events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEvent = async () => {
    if (!newEvent.client_id || !newEvent.venue || !newEvent.event_date) {
      alert('Please fill client, venue, and date');
      return;
    }
    try {
      await api.createEvent({
        ...newEvent,
        status: 'CONFIRMED'
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error scheduling event: ${err.message}`);
    }
  };

  // Delete Event State
  const [eventToDelete, setEventToDelete] = useState<CateringEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    const targetId = eventToDelete.id;
    setIsDeletingEvent(true);
    try {
      setConfirmedEvents(prev => prev.filter(e => e.id !== targetId));
      setEventToDelete(null);
      await api.deleteEvent(targetId);
      await loadData();
    } catch (err: any) {
      console.error('Error removing booking:', err);
      alert(`Error removing booking: ${err.message}`);
      await loadData();
    } finally {
      setIsDeletingEvent(false);
    }
  };

  // Calendar Calculation Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setSelectedDateStr(nowStr);
  };

  // Map events to date strings "YYYY-MM-DD"
  const eventsByDate = confirmedEvents.reduce<Record<string, CateringEvent[]>>((acc, ev) => {
    const d = ev.event_date ? ev.event_date.slice(0, 10) : '';
    if (d) {
      if (!acc[d]) acc[d] = [];
      acc[d].push(ev);
    }
    return acc;
  }, {});

  // Filtered list based on selected calendar date, or all if none
  const activeEventsList = selectedDateStr && eventsByDate[selectedDateStr]
    ? eventsByDate[selectedDateStr]
    : confirmedEvents;

  return (
    <div className="page-wrapper" style={{ maxWidth: '1240px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={12} />
              Confirmed Orders Only
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({confirmedEvents.length} confirmed bookings)
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', lineHeight: 1.15 }}>
            Events & Catering Calendar
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Official banquet schedule displaying strictly confirmed catering orders and feast reservations.
          </p>
        </div>

        {userRole !== 'USER' && (
          <button
            onClick={() => {
              if (clients.length > 0) {
                setNewEvent(prev => ({ ...prev, client_id: clients[0].id }));
              }
              setIsModalOpen(true);
            }}
            className="btn btn-gold btn-sm"
          >
            <Plus size={15} />
            Schedule Confirmed Order
          </button>
        )}
      </div>

      {/* Main Two-Column Layout: Calendar Grid + Agenda */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
        gap: '1.75rem',
        alignItems: 'start'
      }}>
        {/* LEFT: Interactive Monthly Calendar */}
        <div className="luxury-card" style={{ padding: '1.5rem' }}>
          {/* Calendar Month Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--brand-emerald)' }}>
                {monthNames[month]} {year}
              </h2>
              <button
                type="button"
                onClick={goToToday}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
              >
                Today
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={prevMonth}
                className="btn btn-outline"
                style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="btn btn-outline"
                style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            marginBottom: '0.5rem',
            letterSpacing: '0.05em'
          }}>
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          {/* Day Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.35rem'
          }}>
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  height: '78px',
                  backgroundColor: 'transparent',
                  borderRadius: 'var(--radius-sm)'
                }}
              />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const isSelected = selectedDateStr === dateStr;
              const hasConfirmed = dayEvents.length > 0;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr === selectedDateStr ? null : dateStr)}
                  style={{
                    height: '78px',
                    padding: '0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected
                      ? '2px solid var(--brand-emerald)'
                      : hasConfirmed
                        ? '1.5px solid var(--brand-gold)'
                        : '1px solid var(--border-subtle)',
                    backgroundColor: isSelected
                      ? 'var(--bg-parchment)'
                      : hasConfirmed
                        ? '#FEFDF8'
                        : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: hasConfirmed ? '0 1px 4px rgba(185,146,75,0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.8125rem',
                      fontWeight: hasConfirmed ? 800 : 500,
                      color: hasConfirmed ? 'var(--brand-emerald)' : 'var(--text-secondary)'
                    }}>
                      {dayNum}
                    </span>
                    {hasConfirmed && (
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-gold)'
                      }} />
                    )}
                  </div>

                  {hasConfirmed ? (
                    <div style={{
                      backgroundColor: 'var(--brand-emerald)',
                      color: '#FFFFFF',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.35rem',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {dayEvents[0].guest_count} Pax • {dayEvents[0].event_type}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', border: '1.5px solid var(--brand-gold)', backgroundColor: '#FEFDF8' }} />
              <span>Confirmed Booking Date</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', border: '2px solid var(--brand-emerald)', backgroundColor: 'var(--bg-parchment)' }} />
              <span>Selected Date</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Confirmed Booking Details / Agenda */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem'
          }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--brand-emerald)' }}>
              {selectedDateStr ? `Bookings on ${selectedDateStr}` : 'All Confirmed Bookings'}
            </h3>
            {selectedDateStr && (
              <button
                type="button"
                onClick={() => setSelectedDateStr(null)}
                style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--brand-gold)', cursor: 'pointer', fontWeight: 600 }}
              >
                Show All ({confirmedEvents.length})
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? (
              <div className="luxury-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading confirmed schedule...
              </div>
            ) : activeEventsList.length === 0 ? (
              <div className="luxury-card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CalendarIcon size={32} color="var(--brand-gold)" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  No confirmed bookings on this date
                </p>
                <p style={{ fontSize: '0.75rem' }}>
                  Only confirmed banquet orders are added to this calendar.
                </p>
              </div>
            ) : (
              activeEventsList.map(ev => (
                <div key={ev.id} className="luxury-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--brand-gold)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                    <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={11} />
                      CONFIRMED ORDER
                    </span>
                    <span className="badge badge-gold">
                      {ev.guest_count} Plates
                    </span>
                  </div>

                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--brand-emerald)', marginBottom: '0.35rem' }}>
                    {ev.client_name || 'Client Unlinked'}
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CalendarIcon size={13} color="var(--brand-gold)" />
                      <span style={{ fontWeight: 700 }}>{ev.event_date}</span>
                      {ev.event_time && <span style={{ color: 'var(--text-muted)' }}>• {ev.event_time}</span>}
                      <span>• {ev.event_type}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                      <MapPin size={13} color="var(--brand-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{ev.venue} {ev.venue_address ? `, ${ev.venue_address}` : ''}</span>
                    </div>
                  </div>

                  {ev.special_notes && (
                    <div style={{
                      marginTop: '0.65rem',
                      padding: '0.5rem 0.65rem',
                      backgroundColor: 'var(--bg-parchment)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      color: 'var(--text-main)',
                      fontStyle: 'italic'
                    }}>
                      "{ev.special_notes}"
                    </div>
                  )}

                  <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSelectedPurchaseEventId(ev.id)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', color: '#166534', borderColor: '#BBF7D0', backgroundColor: '#F0FDF4', gap: '0.35rem' }}
                      title="Calculate Raw Material Purchase List"
                    >
                      <ShoppingCart size={12} />
                      <span>Purchase List</span>
                    </button>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setEventToDelete(ev)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', color: '#B91C1C', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
                        title="Remove from Calendar"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (isReadOnly) {
                          onNavigate('quotations');
                        } else {
                          onNavigate('new-quotation', { clientId: ev.client_id, eventId: ev.id });
                        }
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Sparkles size={12} color="var(--brand-gold)" />
                      View Proposal
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SCHEDULE CONFIRMED EVENT MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--brand-emerald)', marginBottom: '1.25rem' }}>
              Schedule Confirmed Banquet Order
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Select Client *</label>
                <select
                  value={newEvent.client_id || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, client_id: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Event Type</label>
                  <select
                    value={newEvent.event_type || 'Wedding'}
                    onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Reception">Reception</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Corporate">Corporate Event</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Guest Count (Plates)</label>
                  <input
                    type="number"
                    value={newEvent.guest_count || 500}
                    onChange={(e) => setNewEvent({ ...newEvent, guest_count: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Event Date *</label>
                  <input
                    type="date"
                    value={newEvent.event_date || '2026-12-28'}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Time</label>
                  <input
                    type="time"
                    value={newEvent.event_time || '18:00'}
                    onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Venue Name *</label>
                <input
                  type="text"
                  placeholder="e.g. CONTOUR Backwaters Convention Centre"
                  value={newEvent.venue || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Venue Address / District</label>
                <input
                  type="text"
                  placeholder="e.g. Changanasery / Trivandrum"
                  value={newEvent.venue_address || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, venue_address: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Special Catering Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Welcome drinks at 6 PM, Live Momos counter outside hall"
                  value={newEvent.special_notes || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, special_notes: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: '#FFFFFF' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateEvent}
                  className="btn btn-gold"
                >
                  Schedule Confirmed Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase List Modal */}
      {selectedPurchaseEventId && (
        <PurchaseListModal
          eventId={selectedPurchaseEventId}
          onClose={() => setSelectedPurchaseEventId(null)}
        />
      )}

      {/* Delete Event Confirmation Modal */}
      {eventToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => !isDeletingEvent && setEventToDelete(null)}
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
              Remove from Calendar?
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{eventToDelete.event_type}</strong> on <strong>{eventToDelete.event_date}</strong> from the calendar?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="btn btn-outline"
                disabled={isDeletingEvent}
                style={{ flex: 1, padding: '0.65rem', fontWeight: 600 }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteEvent}
                className="btn"
                disabled={isDeletingEvent}
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
                  cursor: isDeletingEvent ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeletingEvent ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
