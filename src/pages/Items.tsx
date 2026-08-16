import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Power, PowerOff, Package } from 'lucide-react';
import { activateItem, createItem, deactivateItem, deleteItemImage, listItems, updateItem, uploadItemImage } from '../api/items';
import { Item, ItemFormData, ItemStatus, ITEM_STATUSES } from '../types/item';
import { Media } from '../types/media';
import { PaginatedEnvelope } from '../types/api';
import { useNotification } from '../hooks/useNotification';
import { getErrorMessage } from '../utils/errors';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import SingleImageField from '../components/media/SingleImageField';

const currency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const EMPTY_FORM: ItemFormData = {
  name: '',
  price: 0,
  status: 'ACTIVE',
};

const Items: React.FC = () => {
  const { showToast } = useNotification();
  const [result, setResult] = useState<PaginatedEnvelope<Item> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<ItemFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Which item's activate/deactivate toggle is in flight — disables only
  // that row's toggle button, same pattern as the booking item stepper.
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await listItems({
        page,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setResult(data);
    } catch (err) {
      showToast(getErrorMessage(err, 'Məhsullar yüklənə bilmədi'), 'error');
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

  const openEdit = (item: Item) => {
    setEditing(item);
    setForm({ name: item.name, price: item.price, status: item.status });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editing) {
        await updateItem(editing.id, form);
        showToast('Məhsul yeniləndi', 'success');
      } else {
        // Only name/price/status are ever sent — there's no way for this
        // form to produce unit_price/total_price/booking_id/quantity, which
        // only ever exist on a booking's own items, not the catalog.
        await createItem(form);
        showToast('Məhsul yaradıldı', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Məhsul yadda saxlanıla bilmədi'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChanged = (itemId: number, image: Media | null) => {
    setEditing((prev) => (prev && prev.id === itemId ? { ...prev, image } : prev));
    setResult((prev) => (prev ? { ...prev, data: prev.data.map((i) => (i.id === itemId ? { ...i, image } : i)) } : prev));
  };

  const handleToggleStatus = async (item: Item) => {
    setTogglingId(item.id);
    try {
      const updated = item.status === 'ACTIVE' ? await deactivateItem(item.id) : await activateItem(item.id);
      showToast(`${updated.name} ${updated.status === 'ACTIVE' ? 'aktivləşdirildi' : 'deaktiv edildi'}`, 'success');
      setResult((prev) => (prev ? { ...prev, data: prev.data.map((i) => (i.id === item.id ? updated : i)) } : prev));
    } catch (err) {
      showToast(getErrorMessage(err, 'Məhsulun statusu yenilənə bilmədi'), 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="page-card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Məhsullar</h2>
          <p className="page-subtitle">Müştərilərin rezervasiyaya əlavə edə biləcəyi məhsulları idarə edin</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          <span>Yeni Məhsul</span>
        </button>
      </div>

      <form className="filter-bar" onSubmit={handleSearchSubmit}>
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Ad üzrə axtarın…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ItemStatus | '');
            setPage(1);
          }}
        >
          <option value="">Bütün statuslar</option>
          {ITEM_STATUSES.map((s) => (
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
              <th>Qiymət</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="table-loading">
                  <span className="spinner" />
                  <div className="cell-muted" style={{ marginTop: 8 }}>
                    Məhsullar yüklənir…
                  </div>
                </td>
              </tr>
            ) : !result || result.data.length === 0 ? (
              <tr>
                <td colSpan={4} className="table-empty">
                  Heç bir məhsul tapılmadı
                </td>
              </tr>
            ) : (
              result.data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="single-image-preview" style={{ width: 32, height: 32, flexShrink: 0 }}>
                        {item.image ? (
                          <img src={item.image.url} alt="" />
                        ) : (
                          <Package size={14} style={{ color: 'var(--text-dim)' }} />
                        )}
                      </div>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                    </div>
                  </td>
                  <td>{currency(item.price)}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => openEdit(item)} title="Redaktə et">
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => handleToggleStatus(item)}
                        disabled={togglingId === item.id}
                        title={item.status === 'ACTIVE' ? 'Deaktiv et' : 'Aktivləşdir'}
                      >
                        {togglingId === item.id ? (
                          <span className="spinner spinner-sm" />
                        ) : item.status === 'ACTIVE' ? (
                          <PowerOff size={16} />
                        ) : (
                          <Power size={16} />
                        )}
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
          title={editing ? 'Məhsulu Redaktə Et' : 'Yeni Məhsul'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Ləğv et
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <span className="spinner spinner-sm" /> : editing ? 'Dəyişiklikləri Yadda Saxla' : 'Məhsul Yarat'}
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
              <label className="form-label" htmlFor="item-name">
                Ad
              </label>
              <input
                id="item-name"
                className="form-input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="item-price">
                Qiymət
              </label>
              <input
                id="item-price"
                type="number"
                min={0}
                step="0.01"
                className="form-input"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.status !== 'INACTIVE'}
                onChange={(e) => setForm({ ...form, status: e.target.checked ? 'ACTIVE' : 'INACTIVE' })}
              />
              Aktiv
            </label>

            {editing && (
              <SingleImageField
                label="Şəkil"
                image={editing.image}
                onUpload={(file) => uploadItemImage(editing.id, file)}
                onDelete={() => deleteItemImage(editing.id)}
                onChange={(image) => handleImageChanged(editing.id, image)}
              />
            )}
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Items;
