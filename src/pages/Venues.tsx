import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, MapPin, Clock } from 'lucide-react';
import { createVenue, deleteVenue, listVenues, updateVenue } from '../api/venues';
import { Venue, VenueFormData, VenueStatus, VenueWorkingHour, VENUE_STATUSES } from '../types/venue';
import { PaginatedEnvelope } from '../types/api';
import { useNotification } from '../hooks/useNotification';
import { getErrorMessage } from '../utils/errors';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import WorkingHoursModal from '../components/venues/WorkingHoursModal';

const EMPTY_FORM: VenueFormData = {
  name: '',
  address: '',
  city: '',
  description: '',
  phone: '',
  email: '',
  status: 'ACTIVE',
};

const Venues: React.FC = () => {
  const { showToast } = useNotification();
  const [result, setResult] = useState<PaginatedEnvelope<Venue> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VenueStatus | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);
  const [form, setForm] = useState<VenueFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [hoursVenue, setHoursVenue] = useState<Venue | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await listVenues({
        page,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setResult(data);
    } catch (err) {
      showToast(getErrorMessage(err, 'Məkanlar yüklənə bilmədi'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (venue: Venue) => {
    setEditing(venue);
    setForm({
      name: venue.name,
      address: venue.address,
      city: venue.city,
      description: venue.description || '',
      phone: venue.phone || '',
      email: venue.email || '',
      latitude: venue.latitude,
      longitude: venue.longitude,
      status: venue.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editing) {
        await updateVenue(editing.id, form);
        showToast('Məkan yeniləndi', 'success');
      } else {
        await createVenue(form);
        showToast('Məkan yaradıldı', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Məkan yadda saxlanıla bilmədi'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWorkingHoursSaved = (venueId: number, hours: VenueWorkingHour[]) => {
    setResult((prev) =>
      prev
        ? { ...prev, data: prev.data.map((v) => (v.id === venueId ? { ...v, working_hours: hours } : v)) }
        : prev
    );
  };

  const handleDelete = async (venue: Venue) => {
    if (!window.confirm(`"${venue.name}" məkanını silmək istəyirsiniz? Bu geri qaytarıla bilməz.`)) return;
    try {
      await deleteVenue(venue.id);
      showToast('Məkan silindi', 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Məkan silinə bilmədi'), 'error');
    }
  };

  return (
    <div className="page-card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Məkanlar</h2>
          <p className="page-subtitle">Stadion və sahə məkanlarını idarə edin</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          <span>Yeni Məkan</span>
        </button>
      </div>

      <form className="filter-bar" onSubmit={handleSearchSubmit}>
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Ad, ünvan, şəhər üzrə axtarın…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as VenueStatus | '');
            setPage(1);
          }}
        >
          <option value="">Bütün statuslar</option>
          {VENUE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-secondary btn-sm">
          Axtar
        </button>
      </form>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Şəhər</th>
              <th>Əlaqə</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="table-loading">
                  <span className="spinner" />
                </td>
              </tr>
            ) : !result || result.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  Heç bir məkan tapılmadı
                </td>
              </tr>
            ) : (
              result.data.map((venue) => (
                <tr key={venue.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <MapPin size={15} style={{ color: 'var(--text-muted)' }} />
                      {venue.name}
                    </div>
                    <div className="cell-muted">{venue.address}</div>
                  </td>
                  <td>{venue.city}</td>
                  <td className="cell-muted">
                    {venue.phone || '—'}
                    <br />
                    {venue.email || ''}
                  </td>
                  <td>
                    <StatusBadge status={venue.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => setHoursVenue(venue)} title="İş Saatları">
                        <Clock size={16} />
                      </button>
                      <button className="icon-btn" onClick={() => openEdit(venue)} title="Redaktə et">
                        <Pencil size={16} />
                      </button>
                      <button className="icon-btn danger" onClick={() => handleDelete(venue)} title="Sil">
                        <Trash2 size={16} />
                      </button>
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
          title={editing ? 'Məkanı Redaktə Et' : 'Yeni Məkan'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Ləğv et
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <span className="spinner spinner-sm" /> : editing ? 'Dəyişiklikləri Yadda Saxla' : 'Məkan Yarat'}
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
              <label className="form-label">Ad</label>
              <input
                className="form-input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Şəhər</label>
                <input
                  className="form-input"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as VenueStatus })}
                >
                  {VENUE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Ünvan</label>
              <input
                className="form-input"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Telefon</label>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">E-poçt</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Təsvir</label>
              <textarea
                className="form-input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}

      {hoursVenue && (
        <WorkingHoursModal
          venue={hoursVenue}
          onClose={() => setHoursVenue(null)}
          onSaved={(hours) => handleWorkingHoursSaved(hoursVenue.id, hours)}
        />
      )}
    </div>
  );
};

export default Venues;
