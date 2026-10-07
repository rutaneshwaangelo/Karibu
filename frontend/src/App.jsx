import React, { useState } from 'react';
import Home from './pages/Home.jsx';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import CustomerHome from './pages/customer/CustomerHome';
import JoinQueueModal from './pages/customer/JoinQueueModal';
import CustomerQueueStatus from './pages/customer/CustomerQueueStatus';
import StaffDashboard from './pages/staff/StaffDashboard';
import BusinessOwnerDashboard from './pages/business/BusinessOwnerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import { Heart } from 'lucide-react';

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
      </main>

      {/* Join Queue Modal for Customer */}
      {selectedBusiness && (
        <JoinQueueModal
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          onJoined={handleJoinedQueue}
        />
      )}

      {/* Clean Modern Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          backgroundColor: 'rgba(9, 13, 22, 0.95)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
          <img
            src="/karibu-logo.png"
            alt=""
            aria-hidden="true"
            style={{ width: '26px', height: '26px', objectFit: 'contain', mixBlendMode: 'screen', verticalAlign: 'middle' }}
          />
          <span>KARIBU Smart Queue System</span>
          <span>•</span>
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
