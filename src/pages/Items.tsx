import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Power, PowerOff, Package } from 'lucide-react';
import { activateItem, createItem, deactivateItem, listItems, updateItem } from '../api/items';
import { Item, ItemFormData, ItemStatus, ITEM_STATUSES } from '../types/item';
import { PaginatedEnvelope } from '../types/api';
import { useNotification } from '../hooks/useNotification';
import { getErrorMessage } from '../utils/errors';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';

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
      showToast(getErrorMessage(err, 'Failed to load items'), 'error');
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
        showToast('Item updated', 'success');
      } else {
        // Only name/price/status are ever sent — there's no way for this
        // form to produce unit_price/total_price/booking_id/quantity, which
        // only ever exist on a booking's own items, not the catalog.
        await createItem(form);
        showToast('Item created', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to save item'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item: Item) => {
    setTogglingId(item.id);
    try {
      const updated = item.status === 'ACTIVE' ? await deactivateItem(item.id) : await activateItem(item.id);
      showToast(`${updated.name} is now ${updated.status === 'ACTIVE' ? 'active' : 'inactive'}`, 'success');
      setResult((prev) => (prev ? { ...prev, data: prev.data.map((i) => (i.id === item.id ? updated : i)) } : prev));
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to update item status'), 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="page-card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Items</h2>
          <p className="page-subtitle">Manage add-ons customers can attach to a booking</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          <span>New Item</span>
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
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ItemStatus | '');
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {ITEM_STATUSES.map((s) => (
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
              <th>Name</th>
              <th>Price</th>
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
                    Loading items…
                  </div>
                </td>
              </tr>
            ) : !result || result.data.length === 0 ? (
              <tr>
                <td colSpan={4} className="table-empty">
                  No items found
                </td>
              </tr>
            ) : (
              result.data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <Package size={15} style={{ color: 'var(--text-muted)' }} />
                      {item.name}
                    </div>
                  </td>
                  <td>{currency(item.price)}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => openEdit(item)} title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => handleToggleStatus(item)}
                        disabled={togglingId === item.id}
                        title={item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
          title={editing ? 'Edit Item' : 'New Item'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <span className="spinner spinner-sm" /> : editing ? 'Save Changes' : 'Create Item'}
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
                Name
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
                Price
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
              Active
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Items;
