import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import { LogIn, LogOut, Shield, Store, User, Users } from 'lucide-react';

export const Navbar = ({ currentView, onViewChange }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogout = () => {
    logout();
    onViewChange('customer-home');
  };

  return (
    <>
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(9, 13, 22, 0.8)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '70px',
          }}
        >
          {/* Logo Brand */}
          <div
            onClick={() => onViewChange('customer-home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <img
              src="/karibu-logo.png"
              alt="KARIBU logo"
              style={{
                width: '44px',
                height: '44px',
                objectFit: 'contain',
                mixBlendMode: 'screen',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#FFF' }}>
                  KARIBU
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#FBBF24',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontWeight: 700,
                  }}
                >
                  SMART QUEUE
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Pick your place before you arrive
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className={`btn ${currentView.startsWith('customer') ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onViewChange('customer-home')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
            >
              <Users size={16} /> Customer View
            </button>

            {isAuthenticated && user?.role === 'ADMIN' && (
              <button
                className={`btn ${currentView === 'admin-dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onViewChange('admin-dashboard')}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
              >
                <Shield size={16} /> Admin Portal
              </button>
            )}

            {isAuthenticated && user?.role === 'BUSINESS_OWNER' && (
              <button
                className={`btn ${currentView === 'owner-dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onViewChange('owner-dashboard')}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
              >
                <Store size={16} /> Owner Portal
              </button>
            )}

            {isAuthenticated && (user?.role === 'STAFF' || user?.role === 'BUSINESS_OWNER') && (
              <button
                className={`btn ${currentView === 'staff-dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onViewChange('staff-dashboard')}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
              >
                <User size={16} /> Staff Queue
              </button>
            )}

            {/* Auth Actions */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginLeft: '0.5rem' }}>
                <div
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Logged in as: </span>
                  <span style={{ fontWeight: 600, color: '#FFF' }}>{user.name}</span>{' '}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color:
                        user.role === 'ADMIN'
                          ? '#A78BFA'
                          : user.role === 'BUSINESS_OWNER'
                          ? '#FBBF24'
                          : '#34D399',
                    }}
                  >
                    ({user.role})
                  </span>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={handleLogout}
                  title="Logout"
                  style={{ padding: '0.5rem 0.75rem' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => setShowLoginModal(true)}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                <LogIn size={16} /> Staff / Admin Login
              </button>
            )}
          </nav>
        </div>
      </header>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(loggedUser) => {
          if (loggedUser.role === 'ADMIN') onViewChange('admin-dashboard');
          else if (loggedUser.role === 'BUSINESS_OWNER') onViewChange('owner-dashboard');
          else if (loggedUser.role === 'STAFF') onViewChange('staff-dashboard');
        }}
      />
    </>
  );
};

export default Navbar;
