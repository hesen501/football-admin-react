import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { listVenues } from '../api/venues';
import { listFields, getFieldAvailability, AvailabilitySlot } from '../api/fields';
import { listUsers } from '../api/users';
import { createBooking } from '../api/bookings';
import { Venue } from '../types/venue';
import { Field } from '../types/field';
import { User } from '../types/user';
import { useNotification } from '../hooks/useNotification';
import { getErrorMessage } from '../utils/errors';
import Modal from '../components/common/Modal';

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const Schedule: React.FC = () => {
  const { showToast } = useNotification();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);

  const [venueId, setVenueId] = useState<number | ''>('');
  const [fieldId, setFieldId] = useState<number | ''>('');
  const [date, setDate] = useState(todayIso());

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [bookingSlot, setBookingSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingUserId, setBookingUserId] = useState<number | ''>('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listVenues({ per_page: 100 })
      .then((res) => setVenues(res.data))
      .catch((err) => showToast(getErrorMessage(err, 'Failed to load venues'), 'error'));
    listUsers({ role: 'CUSTOMER', per_page: 100 })
      .then((res) => setCustomers(res.data))
      .catch(() => setCustomers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!venueId) {
      setFields([]);
      setFieldId('');
      return;
    }
    listFields({ venue_id: venueId, per_page: 100 })
      .then((res) => {
        setFields(res.data);
        setFieldId(res.data[0]?.id ?? '');
      })
      .catch(() => setFields([]));
  }, [venueId]);

  const loadAvailability = async () => {
    if (!fieldId || !date) return;
    setIsLoading(true);
    try {
      const availability = await getFieldAvailability(Number(fieldId), date);
      setSlots(availability.slots);
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to load availability'), 'error');
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId, date]);

  const openBookingModal = (slot: AvailabilitySlot) => {
    setBookingSlot(slot);
    setBookingUserId('');
    setBookingNotes('');
  };

  const handleCreateBooking = async () => {
    if (!bookingSlot || !fieldId || !bookingUserId) {
      showToast('Please select a customer', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await createBooking({
        user_id: Number(bookingUserId),
        field_id: Number(fieldId),
        start_time: bookingSlot.start_time,
        duration_hours: 1,
        notes: bookingNotes || undefined,
      });
      showToast('Booking created', 'success');
      setBookingSlot(null);
      loadAvailability();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to create booking'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Booking Schedule</h2>
          <p className="page-subtitle">View field availability by day and create bookings on open slots</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="form-input"
          value={venueId}
          onChange={(e) => setVenueId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Select a venue…</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          value={fieldId}
          disabled={!venueId}
          onChange={(e) => setFieldId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Select a field…</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {!fieldId ? (
        <div className="table-empty">Select a venue and field to view its schedule</div>
      ) : isLoading ? (
        <div className="table-loading">
          <span className="spinner" />
        </div>
      ) : slots.length === 0 ? (
        <div className="table-empty">No slots for this date</div>
      ) : (
        <div className="slot-grid">
          {slots.map((slot) => (
            <div
              key={slot.start_time}
              className={`slot-cell ${slot.available ? 'available' : 'booked'}`}
              onClick={() => slot.available && openBookingModal(slot)}
              title={slot.available ? 'Click to book this slot' : 'Already booked'}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {slot.available ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
              </div>
            </div>
          ))}
        </div>
      )}

      {bookingSlot && (
        <Modal
          title="Book This Slot"
          onClose={() => setBookingSlot(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setBookingSlot(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateBooking} disabled={isSaving}>
                {isSaving ? <span className="spinner spinner-sm" /> : 'Create Booking'}
              </button>
            </>
          }
        >
          <p style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {formatTime(bookingSlot.start_time)} – {formatTime(bookingSlot.end_time)} on {date}
          </p>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select
              className="form-input"
              required
              value={bookingUserId}
              onChange={(e) => setBookingUserId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Schedule;
