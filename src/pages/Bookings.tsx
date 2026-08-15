import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, X as XIcon, Eye } from 'lucide-react';
import { cancelBooking, confirmBooking, createBooking, listBookings } from '../api/bookings';
import { listVenues } from '../api/venues';
import { listFields } from '../api/fields';
import { listUsers } from '../api/users';
import {
  Booking,
  BookingStatus,
  CreateBookingData,
  PaymentStatus,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
} from '../types/booking';
import { Venue } from '../types/venue';
import { Field } from '../types/field';
import { User } from '../types/user';
import { PaginatedEnvelope } from '../types/api';
import { useNotification } from '../hooks/useNotification';
import { getErrorMessage } from '../utils/errors';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';

const currency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatDateTime = (value: string) => new Date(value).toLocaleString();

const EMPTY_CREATE: CreateBookingData = {
  user_id: 0,
  field_id: 0,
  start_time: '',
  duration_hours: 1,
  notes: '',
};

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [result, setResult] = useState<PaginatedEnvelope<Booking> | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');
  const [venueFilter, setVenueFilter] = useState<number | ''>('');
  const [fieldFilter, setFieldFilter] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateBookingData>(EMPTY_CREATE);
  const [createFieldOptions, setCreateFieldOptions] = useState<Field[]>([]);
  const [createVenueId, setCreateVenueId] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listVenues({ per_page: 100 })
      .then((res) => setVenues(res.data))
      .catch((err) => showToast(getErrorMessage(err, 'Məkanlar yüklənə bilmədi'), 'error'));
    listUsers({ role: 'CUSTOMER', per_page: 100 })
      .then((res) => setCustomers(res.data))
      .catch((err) => showToast(getErrorMessage(err, 'Müştərilər yüklənə bilmədi'), 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFieldFilter('');
    listFields({ venue_id: venueFilter || undefined, per_page: 100 })
      .then((res) => setFields(res.data))
      .catch(() => setFields([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueFilter]);

  useEffect(() => {
    if (!createVenueId) {
      setCreateFieldOptions([]);
      return;
    }
    listFields({ venue_id: createVenueId, per_page: 100 })
      .then((res) => setCreateFieldOptions(res.data))
      .catch(() => setCreateFieldOptions([]));
  }, [createVenueId]);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await listBookings({
        page,
        status: statusFilter || undefined,
        payment_status: paymentFilter || undefined,
        venue_id: venueFilter || undefined,
        field_id: fieldFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setResult(data);
    } catch (err) {
      showToast(getErrorMessage(err, 'Rezervasiyalar yüklənə bilmədi'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, paymentFilter, venueFilter, fieldFilter, dateFrom, dateTo]);

  const openCreate = () => {
    setCreateVenueId('');
    setForm(EMPTY_CREATE);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.user_id || !form.field_id || !form.start_time) {
      showToast('Zəhmət olmasa müştəri, sahə və başlama vaxtını doldurun', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await createBooking(form);
      showToast('Rezervasiya yaradıldı', 'success');
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Rezervasiya yaradıla bilmədi'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async (booking: Booking) => {
    try {
      await confirmBooking(booking.id);
      showToast('Rezervasiya təsdiqləndi', 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Rezervasiya təsdiqlənə bilmədi'), 'error');
    }
  };

  const handleCancel = async (booking: Booking) => {
    const reason = window.prompt('Ləğv səbəbi (istəyə bağlı):') ?? undefined;
    try {
      await cancelBooking(booking.id, reason);
      showToast('Rezervasiya ləğv edildi', 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Rezervasiya ləğv edilə bilmədi'), 'error');
    }
  };

  return (
    <div className="page-card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Rezervasiyalar</h2>
          <p className="page-subtitle">Sahə rezervasiyalarına baxın və idarə edin</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          <span>Yeni Rezervasiya</span>
        </button>
      </div>

      <div className="filter-bar">
        <select
          className="form-input"
          value={venueFilter}
          onChange={(e) => {
            setVenueFilter(e.target.value ? Number(e.target.value) : '');
            setPage(1);
          }}
        >
          <option value="">Bütün məkanlar</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          value={fieldFilter}
          disabled={!venueFilter}
          onChange={(e) => {
            setFieldFilter(e.target.value ? Number(e.target.value) : '');
            setPage(1);
          }}
        >
          <option value="">Bütün sahələr</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as BookingStatus | '');
            setPage(1);
          }}
        >
          <option value="">Bütün statuslar</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value as PaymentStatus | '');
            setPage(1);
          }}
        >
          <option value="">Bütün ödəniş statusları</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="form-input"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
        <input
          type="date"
          className="form-input"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Müştəri</th>
              <th>Sahə / Məkan</th>
              <th>Başlanğıc → Bitmə</th>
              <th>Ümumi</th>
              <th>Status</th>
              <th>Ödəniş</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="table-loading">
                  <span className="spinner" />
                </td>
              </tr>
            ) : !result || result.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  Heç bir rezervasiya tapılmadı
                </td>
              </tr>
            ) : (
              result.data.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.user?.name || '—'}</td>
                  <td>
                    {booking.field?.name || '—'}
                    <div className="cell-muted">{booking.field?.venue?.name}</div>
                  </td>
                  <td className="cell-muted">
                    {formatDateTime(booking.start_time)}
                    <br />→ {formatDateTime(booking.end_time)}
                  </td>
                  <td>{currency(booking.total_price)}</td>
                  <td>
                    <StatusBadge status={booking.status} />
                  </td>
                  <td>
                    <StatusBadge status={booking.payment_status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                        title="Ətraflı bax"
                      >
                        <Eye size={16} />
                      </button>
                      {booking.status === 'PENDING' && (
                        <button className="icon-btn" onClick={() => handleConfirm(booking)} title="Təsdiqlə">
                          <Check size={16} />
                        </button>
                      )}
                      {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                        <button className="icon-btn danger" onClick={() => handleCancel(booking)} title="Ləğv et">
                          <XIcon size={16} />
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

      {result && (
        <Pagination
          currentPage={result.meta.current_page}
          lastPage={result.meta.last_page}
          total={result.meta.total}
          onPageChange={setPage}
        />
      )}

      {modalOpen && (
        <Modal
          title="Yeni Rezervasiya"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Ləğv et
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <span className="spinner spinner-sm" /> : 'Rezervasiya Yarat'}
              </button>
            </>
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="form-group">
              <label className="form-label">Müştəri</label>
              <select
                className="form-input"
                required
                value={form.user_id || ''}
                onChange={(e) => setForm({ ...form, user_id: Number(e.target.value) })}
              >
                <option value="">Müştəri seçin…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Məkan</label>
                <select
                  className="form-input"
                  value={createVenueId}
                  onChange={(e) => {
                    setCreateVenueId(e.target.value ? Number(e.target.value) : '');
                    setForm({ ...form, field_id: 0 });
                  }}
                >
                  <option value="">Məkan seçin…</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sahə</label>
                <select
                  className="form-input"
                  required
                  disabled={!createVenueId}
                  value={form.field_id || ''}
                  onChange={(e) => setForm({ ...form, field_id: Number(e.target.value) })}
                >
                  <option value="">Sahə seçin…</option>
                  {createFieldOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({currency(f.hourly_price)}/saat)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Başlama Vaxtı</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  required
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
                <span className="form-hint">Tam saatda başlamalıdır (məs: 18:00)</span>
              </div>
              <div className="form-group">
                <label className="form-label">Müddət (saat)</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="form-input"
                  required
                  value={form.duration_hours}
                  onChange={(e) => setForm({ ...form, duration_hours: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Qeydlər</label>
              <textarea
                className="form-input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Bookings;
