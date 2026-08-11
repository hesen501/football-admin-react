import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Goal } from 'lucide-react';
import { createField, deleteField, listFields, updateField } from '../api/fields';
import { listVenues } from '../api/venues';
import { Field, FieldFormData, FieldStatus, FieldType, FIELD_STATUSES, FIELD_TYPES } from '../types/field';
import { Venue } from '../types/venue';
import { PaginatedEnvelope } from '../types/api';
import { useNotification } from '../hooks/useNotification';
import { getErrorMessage } from '../utils/errors';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';

const EMPTY_FORM: FieldFormData = {
  name: '',
  description: '',
  type: 'OUTDOOR',
  capacity: 10,
  hourly_price: 0,
  status: 'ACTIVE',
};

const currency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const Fields: React.FC = () => {
  const { showToast } = useNotification();
  const [result, setResult] = useState<PaginatedEnvelope<Field> | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [venueFilter, setVenueFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<FieldStatus | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Field | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<number | ''>('');
  const [form, setForm] = useState<FieldFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listVenues({ per_page: 100 })
      .then((res) => setVenues(res.data))
      .catch((err) => showToast(getErrorMessage(err, 'Failed to load venues'), 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await listFields({
        page,
        search: search || undefined,
        venue_id: venueFilter || undefined,
        status: statusFilter || undefined,
      });
      setResult(data);
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to load fields'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, venueFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const openCreate = () => {
    setEditing(null);
    setSelectedVenueId(venues[0]?.id ?? '');
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (field: Field) => {
    setEditing(field);
    setSelectedVenueId(field.venue_id);
    setForm({
      name: field.name,
      description: field.description || '',
      type: field.type,
      capacity: field.capacity,
      hourly_price: field.hourly_price,
      status: field.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedVenueId) {
      showToast('Please select a venue', 'error');
      return;
    }
    setIsSaving(true);
    try {
      if (editing) {
        await updateField(editing.id, form);
        showToast('Field updated', 'success');
      } else {
        await createField(Number(selectedVenueId), form);
        showToast('Field created', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to save field'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (field: Field) => {
    if (!window.confirm(`Delete field "${field.name}"? This cannot be undone.`)) return;
    try {
      await deleteField(field.id);
      showToast('Field deleted', 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete field'), 'error');
    }
  };

  return (
    <div className="page-card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Fields</h2>
          <p className="page-subtitle">Manage individual playing fields within venues</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} disabled={venues.length === 0}>
          <Plus size={18} />
          <span>New Field</span>
        </button>
      </div>

      <form className="filter-bar" onSubmit={handleSearchSubmit}>
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          value={venueFilter}
          onChange={(e) => {
            setVenueFilter(e.target.value ? Number(e.target.value) : '');
            setPage(1);
          }}
        >
          <option value="">All venues</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as FieldStatus | '');
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {FIELD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-secondary btn-sm">
          Search
        </button>
      </form>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Venue</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Hourly Price</th>
              <th>Status</th>
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
                  No fields found
                </td>
              </tr>
            ) : (
              result.data.map((field) => (
                <tr key={field.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <Goal size={15} style={{ color: 'var(--text-muted)' }} />
                      {field.name}
                    </div>
                  </td>
                  <td className="cell-muted">
                    {field.venue?.name || venues.find((v) => v.id === field.venue_id)?.name || '—'}
                  </td>
                  <td>{field.type}</td>
                  <td>{field.capacity}</td>
                  <td>{currency(field.hourly_price)}</td>
                  <td>
                    <StatusBadge status={field.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => openEdit(field)} title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button className="icon-btn danger" onClick={() => handleDelete(field)} title="Delete">
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
          title={editing ? 'Edit Field' : 'New Field'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <span className="spinner spinner-sm" /> : editing ? 'Save Changes' : 'Create Field'}
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
              <label className="form-label">Venue</label>
              <select
                className="form-input"
                required
                disabled={Boolean(editing)}
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(Number(e.target.value))}
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {editing && <span className="form-hint">Venue can&apos;t be changed after creation.</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as FieldType })}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as FieldStatus })}
                >
                  {FIELD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input
                  type="number"
                  min={2}
                  max={50}
                  className="form-input"
                  required
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hourly Price</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="form-input"
                  required
                  value={form.hourly_price}
                  onChange={(e) => setForm({ ...form, hourly_price: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Fields;
