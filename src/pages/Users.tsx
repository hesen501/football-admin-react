import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, UserCircle } from 'lucide-react';
import { createUser, deleteUser, deleteUserAvatar, listUsers, updateUser, uploadUserAvatar } from '../api/users';
import { Role, User, UserFormData, UserStatus, ROLES, USER_STATUSES } from '../types/user';
import { Media } from '../types/media';
import { PaginatedEnvelope } from '../types/api';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { getErrorMessage } from '../utils/errors';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import SingleImageField from '../components/media/SingleImageField';

const EMPTY_FORM: UserFormData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'CUSTOMER',
  status: 'ACTIVE',
};

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useNotification();
  const [result, setResult] = useState<PaginatedEnvelope<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await listUsers({
        page,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setResult(data);
    } catch (err) {
      showToast(getErrorMessage(err, 'İstifadəçilər yüklənə bilmədi'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, statusFilter]);

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

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: (user.roles?.[0] as Role) || 'CUSTOMER',
      status: user.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editing) {
        const { password, ...rest } = form;
        await updateUser(editing.id, password ? form : rest);
        showToast('İstifadəçi yeniləndi', 'success');
      } else {
        await createUser(form);
        showToast('İstifadəçi yaradıldı', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'İstifadəçi yadda saxlanıla bilmədi'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChanged = (userId: number, avatar: Media | null) => {
    setEditing((prev) => (prev && prev.id === userId ? { ...prev, avatar } : prev));
    setResult((prev) => (prev ? { ...prev, data: prev.data.map((u) => (u.id === userId ? { ...u, avatar } : u)) } : prev));
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`"${user.name}" istifadəçisini silmək istəyirsiniz? Bu geri qaytarıla bilməz.`)) return;
    try {
      await deleteUser(user.id);
      showToast('İstifadəçi silindi', 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'İstifadəçi silinə bilmədi'), 'error');
    }
  };

  return (
    <div className="page-card">
      <div className="page-header">
        <div>
          <h2 className="page-title">İstifadəçilər</h2>
          <p className="page-subtitle">Platform istifadəçilərini, rolları və hesab statuslarını idarə edin</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          <span>Yeni İstifadəçi</span>
        </button>
      </div>

      <form className="filter-bar" onSubmit={handleSearchSubmit}>
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Ad və ya e-poçt üzrə axtarın…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as Role | '');
            setPage(1);
          }}
        >
          <option value="">Bütün rollar</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as UserStatus | '');
            setPage(1);
          }}
        >
          <option value="">Bütün statuslar</option>
          {USER_STATUSES.map((s) => (
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
              <th>E-poçt</th>
              <th>Telefon</th>
              <th>Rol</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="table-loading">
                  <span className="spinner" />
                </td>
              </tr>
            ) : !result || result.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  Heç bir istifadəçi tapılmadı
                </td>
              </tr>
            ) : (
              result.data.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="single-image-preview is-circle" style={{ width: 32, height: 32, flexShrink: 0 }}>
                        {user.avatar ? (
                          <img src={user.avatar.url} alt="" />
                        ) : (
                          <UserCircle size={16} style={{ color: 'var(--text-dim)' }} />
                        )}
                      </div>
                      <span style={{ fontWeight: 600 }}>{user.name}</span>
                    </div>
                  </td>
                  <td className="cell-muted">{user.email}</td>
                  <td className="cell-muted">{user.phone || '—'}</td>
                  <td>{user.roles?.join(', ') || '—'}</td>
                  <td>
                    <StatusBadge status={user.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => openEdit(user)} title="Redaktə et">
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => handleDelete(user)}
                        title={user.id === currentUser?.id ? 'Öz hesabınızı silə bilməzsiniz' : 'Sil'}
                        disabled={user.id === currentUser?.id}
                      >
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
          title={editing ? 'İstifadəçini Redaktə Et' : 'Yeni İstifadəçi'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Ləğv et
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <span className="spinner spinner-sm" /> : editing ? 'Dəyişiklikləri Yadda Saxla' : 'İstifadəçi Yarat'}
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
                <label className="form-label">E-poçt</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telefon</label>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select
                  className="form-input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}
                >
                  {USER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Şifrə {editing && <span className="form-hint">(dəyişməmək üçün boş buraxın)</span>}</label>
              <input
                type="password"
                className="form-input"
                required={!editing}
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {editing && (
              <SingleImageField
                label="Avatar"
                shape="circle"
                image={editing.avatar}
                onUpload={(file) => uploadUserAvatar(editing.id, file)}
                onDelete={() => deleteUserAvatar(editing.id)}
                onChange={(avatar) => handleAvatarChanged(editing.id, avatar)}
              />
            )}
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Users;
