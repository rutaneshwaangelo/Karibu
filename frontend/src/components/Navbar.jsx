import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import {
  Download,
  LogIn,
  LogOut,
  Menu,
  Shield,
  Store,
  User,
  Users,
  X,
} from 'lucide-react';

const MOBILE_QUERY = '(max-width: 900px)';

export const Navbar = ({ currentView, onViewChange }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => {
      setIsMobile(e.matches);
      if (!e.matches) setMenuOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    onViewChange('customer-home');
  };

  const go = (view) => {
    setMenuOpen(false);
    onViewChange(view);
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setMenuOpen(false);
  };

  const navItems = [
    {
      key: 'customer-home',
      label: 'Customer View',
      icon: Users,
      active: currentView.startsWith('customer'),
      show: true,
    },
    {
      key: 'admin-dashboard',
      label: 'Admin Portal',
      icon: Shield,
      active: currentView === 'admin-dashboard',
      show: isAuthenticated && user?.role === 'ADMIN',
    },
    {
      key: 'owner-dashboard',
      label: 'Owner Portal',
      icon: Store,
      active: currentView === 'owner-dashboard',
      show: isAuthenticated && user?.role === 'BUSINESS_OWNER',
    },
    {
      key: 'staff-dashboard',
      label: 'Staff Queue',
      icon: User,
      active: currentView === 'staff-dashboard',
      show: isAuthenticated && (user?.role === 'STAFF' || user?.role === 'BUSINESS_OWNER'),
    },
  ].filter((item) => item.show);

  const authAction = isAuthenticated ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
      <div
        style={{
          padding: '0.4rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Logged in as: </span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>{' '}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color:
              user.role === 'ADMIN'
                ? '#8A6FA8'
                : user.role === 'BUSINESS_OWNER'
                ? '#A84E2E'
                : '#4C8C6A',
          }}
        >
          ({user.role})
        </span>
      </div>
      <button className="btn btn-secondary" onClick={handleLogout} title="Logout">
        <LogOut size={16} /> Logout
      </button>
    </div>
  ) : (
    <button
      className="btn btn-secondary"
      onClick={() => {
        setMenuOpen(false);
        setShowLoginModal(true);
      }}
    >
      <LogIn size={16} /> Staff / Admin Login
    </button>
  );

  return (
    <>
      <header
        className="app-header"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(250, 246, 239, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
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
            height: isMobile ? '60px' : '70px',
            gap: '0.75rem',
          }}
        >
          {/* Logo Brand */}
          <div
            onClick={() => go('customer-home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              cursor: 'pointer',
              userSelect: 'none',
              minWidth: 0,
            }}
          >
            <img
              src="/karibu-logo.png"
              alt="KARIBU logo"
              style={{
                width: isMobile ? '34px' : '40px',
                height: isMobile ? '34px' : '40px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: isMobile ? '1.05rem' : '1.2rem',
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  KARIBU
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(194, 94, 58, 0.08)',
                    color: '#A84E2E',
                    border: '1px solid rgba(194, 94, 58, 0.25)',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  SMART QUEUE
                </span>
              </div>
              {!isMobile && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Pick your place before you arrive
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              {navItems.map((item) => (
                <button
                  key={item.key}
                  className={`btn ${item.active ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => go(item.key)}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
                >
                  <item.icon size={16} /> {item.label}
                </button>
              ))}

              {installPrompt && (
                <button
                  className="btn btn-emerald"
                  onClick={handleInstall}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
                >
                  <Download size={16} /> Install App
                </button>
              )}

              <div style={{ marginLeft: '0.5rem' }}>{authAction}</div>
            </nav>
          )}

          {/* Mobile Actions */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {installPrompt && (
                <button
                  className="btn btn-emerald"
                  onClick={handleInstall}
                  aria-label="Install app"
                  title="Install app"
                  style={{ padding: '0.55rem 0.7rem' }}
                >
                  <Download size={18} />
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                style={{ padding: '0.55rem 0.7rem' }}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Drawer */}
        {isMobile && menuOpen && (
          <div
            id="mobile-nav"
            className="animate-fade-in"
            style={{
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-primary)',
              padding: '0.85rem 0 1rem',
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div
              className="container"
              style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
            >
              {navItems.map((item) => (
                <button
                  key={item.key}
                  className={`btn ${item.active ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => go(item.key)}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <item.icon size={17} /> {item.label}
                </button>
              ))}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  marginTop: navItems.length ? '0.35rem' : 0,
                  paddingTop: navItems.length ? '0.85rem' : 0,
                  borderTop: navItems.length ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                {authAction}
              </div>
            </div>
          </div>
        )}
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
