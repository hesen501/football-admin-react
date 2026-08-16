import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { getErrorMessage } from '../utils/errors';
import { deleteMyAvatar, updateProfile, uploadMyAvatar } from '../api/profile';
import { Media } from '../types/media';
import { ShieldCheck, Mail, Phone, Shield } from 'lucide-react';
import SingleImageField from '../components/media/SingleImageField';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useNotification();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChanged = (avatar: Media | null) => {
    if (user) updateUser({ ...user, avatar });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateProfile({
        name,
        email,
        phone: phone || null,
        ...(password ? { password } : {}),
      });
      updateUser(updated);
      setPassword('');
      showToast('Profil yeniləndi', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Profil yenilənə bilmədi'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-card" style={{ maxWidth: '640px' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Admin Profili</h2>
          <p className="page-subtitle">Hesab məlumatlarınız və rollarınız</p>
        </div>
      </div>

      <div
        style={{
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="logo-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden' }}>
          {user?.avatar ? (
            <img src={user.avatar.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <ShieldCheck size={26} />
          )}
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{user?.name}</div>
          <div
            style={{
              display: 'flex',
              gap: '14px',
              marginTop: '4px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={13} /> {user?.email}
            </span>
            {user?.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} /> {user.phone}
              </span>
            )}
            {user?.roles && user.roles.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={13} /> {user.roles.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      <SingleImageField
        label="Avatar"
        shape="circle"
        image={user?.avatar}
        onUpload={uploadMyAvatar}
        onDelete={deleteMyAvatar}
        onChange={handleAvatarChanged}
      />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Ad</label>
          <input className="form-input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">E-poçt</label>
            <input
              type="email"
              className="form-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Telefon</label>
            <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">
            Yeni Şifrə <span className="form-hint">(dəyişməmək üçün boş buraxın)</span>
          </label>
          <input
            type="password"
            className="form-input"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? <span className="spinner spinner-sm" /> : 'Dəyişiklikləri Yadda Saxla'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
