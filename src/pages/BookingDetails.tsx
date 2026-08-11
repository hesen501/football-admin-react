import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Minus, Plus, X as XIcon } from 'lucide-react';
import { addBookingItem, cancelBooking, confirmBooking, getBooking, removeBookingItem } from '../api/bookings';
import { listItems } from '../api/items';
import { Booking } from '../types/booking';
import { Item } from '../types/item';
import { useNotification } from '../hooks/useNotification';
import { getErrorMessage } from '../utils/errors';
import StatusBadge from '../components/common/StatusBadge';

const currency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatDateTime = (value: string) => new Date(value).toLocaleString();

const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeItems, setActiveItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');

  // item_id(s) currently being added/removed — scopes the disabled/loading
  // state to just the button for that item, not the whole page.
  const [pendingItemIds, setPendingItemIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getBooking(Number(id))
      .then(setBooking)
      .catch((err) => showToast(getErrorMessage(err, 'Failed to load booking'), 'error'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Only active items are offered — an inactive one can't be added anyway
    // (see BookingService::addItem()'s ITEM_NOT_ACTIVE check).
    listItems({ status: 'ACTIVE', per_page: 100 })
      .then((res) => setActiveItems(res.data))
      .catch((err) => showToast(getErrorMessage(err, 'Failed to load items'), 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runItemMutation = async (itemId: number, action: () => Promise<Booking>) => {
    setPendingItemIds((prev) => new Set(prev).add(itemId));
    try {
      const updated = await action();
      setBooking(updated);
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to update booking items'), 'error');
    } finally {
      setPendingItemIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // One request per click, always — quantity is never sent, it's controlled
  // entirely by how many times +/Add is clicked (backend increments/
  // decrements one unit per call). See BookingService::addItem()/removeItem().
  const handleAdd = (itemId: number) => {
    if (!booking) return;
    runItemMutation(itemId, () => addBookingItem(booking.id, itemId));
  };

  const handleRemove = (itemId: number) => {
    if (!booking) return;
    runItemMutation(itemId, () => removeBookingItem(booking.id, itemId));
  };

  const handleConfirm = async () => {
    if (!booking) return;
    try {
      const updated = await confirmBooking(booking.id);
      setBooking(updated);
      showToast('Booking confirmed', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to confirm booking'), 'error');
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    const reason = window.prompt('Cancellation reason (optional):') ?? undefined;
    try {
      const updated = await cancelBooking(booking.id, reason);
      setBooking(updated);
      showToast('Booking cancelled', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to cancel booking'), 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="page-card">
        <div className="table-loading">
          <span className="spinner" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="page-card">
        <p className="table-empty">Booking not found</p>
      </div>
    );
  }

  // Mirrors Booking::canModifyItems() on the backend — UX only (hides/
  // disables controls up front for the common case); the backend remains
  // the source of truth and still rejects a stale/edge-case request itself.
  const canModifyItems =
    (booking.status === 'PENDING' || booking.status === 'CONFIRMED') &&
    new Date(booking.start_time).getTime() > Date.now();

  const isSelectedPending = selectedItemId !== '' && pendingItemIds.has(selectedItemId);

  return (
    <div>
      <button type="button" className="btn btn-secondary btn-sm back-link" onClick={() => navigate('/bookings')}>
        <ArrowLeft size={16} />
        <span>Back to Bookings</span>
      </button>

      <div className="page-card">
        <div className="page-header">
          <div>
            <h2 className="page-title">Booking #{booking.id}</h2>
            <p className="page-subtitle">
              {booking.field?.name || '—'} · {booking.field?.venue?.name || '—'}
            </p>
          </div>
          <div className="row-actions">
            {booking.status === 'PENDING' && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleConfirm}>
                <Check size={16} />
                <span>Confirm</span>
              </button>
            )}
            {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
              <button type="button" className="btn btn-danger btn-sm" onClick={handleCancel}>
                <XIcon size={16} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-field">
            <span className="form-label">Customer</span>
            <p>{booking.user?.name || '—'}</p>
          </div>
          <div className="detail-field">
            <span className="form-label">Start → End</span>
            <p>
              {formatDateTime(booking.start_time)} → {formatDateTime(booking.end_time)}
            </p>
          </div>
          <div className="detail-field">
            <span className="form-label">Status</span>
            <p>
              <StatusBadge status={booking.status} />
            </p>
          </div>
          <div className="detail-field">
            <span className="form-label">Payment</span>
            <p>
              <StatusBadge status={booking.payment_status} />
            </p>
          </div>
        </div>

        <div className="section-divider" />

        <h3 className="section-title">Booking Items</h3>

        {!canModifyItems && (
          <p className="form-hint" style={{ marginBottom: 16 }}>
            This booking can no longer be modified — items can only be added or removed while it&apos;s pending or
            confirmed and hasn&apos;t started yet.
          </p>
        )}

        {booking.items.length === 0 ? (
          <p className="cell-muted" style={{ margin: '4px 0 16px' }}>
            No items added yet.
          </p>
        ) : (
          <div className="booking-items-list">
            {booking.items.map((bookingItem) => {
              const isPending = pendingItemIds.has(bookingItem.id);
              return (
                <div className="booking-item-row" key={bookingItem.id}>
                  <div className="booking-item-info">
                    <span className="booking-item-name">{bookingItem.name}</span>
                    <span className="cell-muted">
                      {bookingItem.quantity} × {currency(bookingItem.unit_price)}
                    </span>
                  </div>
                  <div className="qty-stepper">
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!canModifyItems || isPending}
                      onClick={() => handleRemove(bookingItem.id)}
                      aria-label={`Remove one ${bookingItem.name}`}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty-value">
                      {isPending ? <span className="spinner spinner-sm" /> : bookingItem.quantity}
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!canModifyItems || isPending}
                      onClick={() => handleAdd(bookingItem.id)}
                      aria-label={`Add one more ${bookingItem.name}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="booking-item-total">{currency(bookingItem.total_price)}</div>
                </div>
              );
            })}
          </div>
        )}

        {canModifyItems && (
          <div className="add-item-bar">
            <span className="form-label">Add item</span>
            <div className="add-item-controls">
              <select
                className="form-input"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Select item…</option>
                {activeItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {currency(item.price)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={selectedItemId === '' || isSelectedPending}
                onClick={() => selectedItemId !== '' && handleAdd(selectedItemId)}
              >
                {isSelectedPending ? <span className="spinner spinner-sm" /> : 'Add'}
              </button>
            </div>
          </div>
        )}

        <div className="section-divider" />

        <div className="pricing-breakdown">
          <div className="pricing-row">
            <span>Booking Price</span>
            <span>{currency(booking.base_price)}</span>
          </div>
          <div className="pricing-row">
            <span>Items Total</span>
            <span>{currency(booking.items_total)}</span>
          </div>
          <div className="pricing-row pricing-total">
            <span>Total</span>
            <span>{currency(booking.total_price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
