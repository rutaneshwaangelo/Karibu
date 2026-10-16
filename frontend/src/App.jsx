import React, { Suspense, lazy, useState } from 'react';
import Home from './pages/Home.jsx';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

// ---------------------------------------------------------------------------
// Route-level code splitting
// ---------------------------------------------------------------------------
// Only the landing page (and the always-visible navbar/auth shell) is needed
// for the first paint. The customer flow and the three dashboards are split
// into separate chunks that download on demand, which keeps the initial
// JavaScript payload small on mobile connections.
const CustomerHome = lazy(() => import('./pages/customer/CustomerHome'));
const JoinQueueModal = lazy(() => import('./pages/customer/JoinQueueModal'));
const CustomerQueueStatus = lazy(() => import('./pages/customer/CustomerQueueStatus'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const BusinessOwnerDashboard = lazy(() => import('./pages/business/BusinessOwnerDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

/**
 * Lightweight placeholder shown while a split chunk is being fetched.
 * Deliberately dependency-free so it costs nothing in the initial bundle.
 */
function ViewLoader() {
  return (
    <div
      className="container animate-fade-in"
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.85rem',
        minHeight: '50vh',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '3px solid rgba(194, 94, 58, 0.25)',
          borderTopColor: '#A84E2E',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      Loading…
    </div>
  );
}

function KaribuApp() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [activeQueueId, setActiveQueueId] = useState(null);

  const handleSelectBusiness = (business) => {
    setSelectedBusiness(business);
  };

  const handleJoinedQueue = (ticketData) => {
    setSelectedBusiness(null);
    setActiveQueueId(ticketData.queueId);
    setCurrentView('customer-status');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Universal Navbar */}
      <Navbar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main View Area */}
      <main style={{ flex: 1 }}>
        <Suspense fallback={<ViewLoader />}>
          {currentView === 'home' && (<Home onGetStarted={() => setCurrentView('customer-home')} />)}
          {currentView === 'customer-home' && (
          <CustomerHome onSelectBusiness={handleSelectBusiness} />
        )}

        {currentView === 'customer-status' && (
          <CustomerQueueStatus
            queueId={activeQueueId}
            onBackToHome={() => setCurrentView('customer-home')}
          />
        )}

        {currentView === 'staff-dashboard' && <StaffDashboard />}

        {currentView === 'owner-dashboard' && <BusinessOwnerDashboard />}

        {currentView === 'admin-dashboard' && <AdminDashboard />}
        </Suspense>
      </main>

      {/* Join Queue Modal for Customer */}
      {selectedBusiness && (
        <Suspense fallback={null}>
          <JoinQueueModal
            business={selectedBusiness}
            onClose={() => setSelectedBusiness(null)}
            onJoined={handleJoinedQueue}
          />
        </Suspense>
      )}

      {/* Clean Modern Footer */}
      <footer
        className="app-footer"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 1.5rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '0.4rem',
            marginBottom: '0.4rem',
          }}
        >
          <img
            src="/karibu-logo.png"
            alt=""
            aria-hidden="true"
            width="26"
            height="26"
            style={{ width: '26px', height: '26px', objectFit: 'contain', verticalAlign: 'middle' }}
          />
          <span>KARIBU Smart Queue System</span>
          <span aria-hidden="true">•</span>
          <span>Pick your place before you arrive</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          All new businesses receive a 1-Month Free Trial. Upgrade anytime to keep serving seamlessly.
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <KaribuApp />
    </AuthProvider>
  );
}
