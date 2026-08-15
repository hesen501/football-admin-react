import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { getErrorMessage } from '../utils/errors';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Zəhmət olmasa E-poçt və Şifrəni doldurun');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      showToast('Admin girişi uğurlu oldu', 'success');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Admin məlumatları yanlışdır');
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-center screen-height" style={{ background: 'var(--bg-dark)' }}>
      <div className="page-card" style={{ width: '100%', maxWidth: '420px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            className="logo-icon"
            style={{ width: '56px', height: '56px', margin: '0 auto 16px auto', borderRadius: '14px' }}
          >
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>Admin Portalı</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Futbol məkanları idarəetmə panelinə daxil olmaq üçün giriş edin
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--status-danger)',
              color: 'var(--status-danger)',
              fontSize: '0.88rem',
              marginBottom: '20px',
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              E-poçt
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                id="email-input"
                type="email"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="admin@footballbooking.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password-input">
              Şifrə
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                id="password-input"
                type="password"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="spinner spinner-sm" />
            ) : (
              <>
                <span>Daxil ol</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
