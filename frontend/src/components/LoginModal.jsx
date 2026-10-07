import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, Loader2, ShieldCheck, Store, UserCheck } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      onClose();
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role) => {
    setError('');
    if (role === 'ADMIN') {
      setEmail('admin@karibu.com');
      setPassword('Admin@Karibu2026!');
    } else if (role === 'OWNER') {
      setEmail('john@kibalisalon.com');
      setPassword('SalonPass2026!');
    } else if (role === 'STAFF') {
      setEmail('sarah@kibalisalon.com');
      setPassword('StaffPass2026!');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#0F172A',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            marginBottom: '1rem',
          }}
        >
          <img
            src="/karibu-logo.png"
            alt="KARIBU logo"
            style={{
              width: '46px',
              height: '46px',
              objectFit: 'contain',
              mixBlendMode: 'screen',
            }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: '1.35rem',
              letterSpacing: '-0.02em',
              color: '#FFF',
            }}
          >
            KARIBU
          </span>
        </div>

        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', textAlign: 'center' }}>
          Portal Authentication
        </h2>
        <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem', textAlign: 'center' }}>
          Log in to access your business, staff or admin dashboard.
        </p>

        {/* Quick Demo Fill Buttons */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            Quick Demo Autofill:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fillCredentials('ADMIN')}
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem' }}
            >
              <ShieldCheck size={13} color="#8B5CF6" /> Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fillCredentials('OWNER')}
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem' }}
            >
              <Store size={13} color="#F59E0B" /> Owner
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fillCredentials('STAFF')}
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem' }}
            >
              <UserCheck size={13} color="#10B981" /> Staff
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#FB7185',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Log In to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
