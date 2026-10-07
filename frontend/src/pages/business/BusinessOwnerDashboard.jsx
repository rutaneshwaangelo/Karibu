import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import useSocket from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import {
  Store,
  LayoutDashboard,
  Users,
  Briefcase,
  Clock,
  Settings,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2,
  Calendar,
  Check,
  Zap,
  X,
  ShieldCheck,
} from 'lucide-react';

export const BusinessOwnerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [openingHours, setOpeningHours] = useState([]);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newService, setNewService] = useState({ name: '', description: '', durationMinutes: 30 });
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', password: '' });
  const [statusMsg, setStatusMsg] = useState('');

  // Subscription Payment States
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [payModalPlan, setPayModalPlan] = useState(null); // null | 'BASIC' | 'PRO' | 'ENTERPRISE'
  const [paymentMethod, setPaymentMethod] = useState('Card'); // 'Card' | 'M-Pesa'
  const [payLoading, setPayLoading] = useState(false);
  const [payCard, setPayCard] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [payPhone, setPayPhone] = useState('');

  const businessId = user?.businessId;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, servRes, staffRes, hoursRes, profRes, subRes] = await Promise.all([
        api.get('/business/dashboard'),
        api.get('/services'),
        api.get('/business/staff'),
        api.get('/business/opening-hours'),
        api.get('/business/profile'),
        api.get('/business/subscription'),
      ]);

      if (dashRes.success) setDashboardData(dashRes.data);
      if (servRes.success) setServices(servRes.data);
      if (staffRes.success) setStaff(staffRes.data);
      if (hoursRes.success) setOpeningHours(hoursRes.data);
      if (profRes.success) setProfile(profRes.data);
      if (subRes.success) setSubscription(subRes.data);
    } catch (err) {
      console.error('Error loading business owner data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates
  useSocket('business', businessId, (eventName) => {
    if (eventName === 'queue_updated') {
      api.get('/business/dashboard').then((res) => {
        if (res.success) setDashboardData(res.data);
      });
    }
  });

  // Service creation handler
  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/services', newService);
      if (res.success) {
        setServices([res.data, ...services]);
        setNewService({ name: '', description: '', durationMinutes: 30 });
        setStatusMsg('Service created successfully!');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to create service.');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      setServices(services.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to deactivate service.');
    }
  };

  // Staff creation handler
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/business/staff', newStaff);
      if (res.success) {
        setStaff([res.data, ...staff]);
        setNewStaff({ name: '', email: '', phone: '', password: '' });
        setStatusMsg('Staff member added successfully!');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to create staff account.');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this staff account?')) return;
    try {
      await api.delete(`/business/staff/${id}`);
      setStaff(staff.filter((st) => st._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to deactivate staff.');
    }
  };

  // Opening hours save handler
  const handleSaveHours = async () => {
    try {
      await api.put('/business/opening-hours', { hours: openingHours });
      setStatusMsg('Opening hours updated!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update opening hours.');
    }
  };

  // Profile update handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/business/profile', profile);
      if (res.success) {
        setStatusMsg('Business profile saved successfully!');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to save profile.');
    }
  };

  // Subscription payment handler
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!payModalPlan) return;
    setPayLoading(true);
    try {
      const res = await api.post('/business/subscription/pay', {
        plan: payModalPlan,
        billingCycle,
        paymentMethod,
      });
      if (res.success) {
        setSubscription(res.data);
        setPayModalPlan(null);
        setStatusMsg(res.message || 'Subscription successfully activated!');
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Payment processing failed.');
    } finally {
      setPayLoading(false);
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Days left calculation
  const getDaysLeft = () => {
    if (!subscription?.endDate) return 0;
    const diff = new Date(subscription.endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isTrial = subscription?.plan === 'FREE_TRIAL';
  const daysLeft = getDaysLeft();

  const plans = [
    {
      id: 'BASIC',
      name: 'Starter Business',
      monthlyPrice: 29,
      yearlyPrice: 290,
      description: 'Ideal for single-location barbershops, salons, and consultancies.',
      features: [
        '1 Active Queue Desk',
        'Up to 5 Staff accounts',
        'Staff time adjustments (+5, -5m)',
        'Standard Email support',
      ],
      popular: false,
    },
    {
      id: 'PRO',
      name: 'Professional Business',
      monthlyPrice: 59,
      yearlyPrice: 590,
      description: 'Full automated queuing power for busy clinics and service centers.',
      features: [
        'Unlimited Active Queue Desks',
        'Unlimited Staff accounts',
        'Advanced Time Adjustment (+15, -10m)',
        'Real-time Queue Analytics',
        'Priority 24/7 Support',
      ],
      popular: true,
    },
    {
      id: 'ENTERPRISE',
      name: 'Multi-Branch Enterprise',
      monthlyPrice: 120,
      yearlyPrice: 1200,
      description: 'For corporate branches, hospitals, and high-volume institutions.',
      features: [
        'Multi-location centralized queue',
        'Custom SMS notification gateway',
        'Dedicated account manager',
        'Full REST API and Webhook access',
      ],
      popular: false,
    },
  ];

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#FBBF24', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            BUSINESS MANAGEMENT CONSOLE
          </div>
          <h1 style={{ fontSize: '1.9rem' }}>{profile?.name || 'Business Portal'}</h1>
        </div>

        {statusMsg && (
          <div
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399',
              fontSize: '0.85rem',
            }}
          >
            {statusMsg}
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem',
          marginBottom: '2rem',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'services', label: 'Services', icon: Briefcase },
          { id: 'staff', label: 'Staff Team', icon: Users },
          { id: 'hours', label: 'Opening Hours', icon: Clock },
          { id: 'profile', label: 'Profile', icon: Settings },
          { id: 'subscription', label: 'Subscription', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div>
          {/* KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            <div className="glass-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Queues Today
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FBBF24', margin: '0.4rem 0' }}>
                {dashboardData?.totalQueuesToday || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily total joined</div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Currently Waiting
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38BDF8', margin: '0.4rem 0' }}>
                {dashboardData?.waitingCount || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active in waiting line</div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Completed Today
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34D399', margin: '0.4rem 0' }}>
                {dashboardData?.completedToday || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Finished sessions</div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Active Staff
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#A78BFA', margin: '0.4rem 0' }}>
                {dashboardData?.totalStaff || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered operators</div>
            </div>
          </div>

          {/* Current Serving Quick View */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Active Service Status</h3>
            {dashboardData?.currentServing ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <span className="badge badge-serving">Serving Now</span>
                  <h4 style={{ fontSize: '1.3rem', marginTop: '0.4rem' }}>
                    {dashboardData.currentServing.customerId?.name} ({dashboardData.currentServing.queueNumber})
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Service: {dashboardData.currentServing.serviceId?.name}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expected Finish</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: '#34D399', fontWeight: 700 }}>
                    {new Date(dashboardData.currentServing.expectedEndAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', padding: '1.5rem 0' }}>
                No customer is currently in service desk.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES */}
      {activeTab === 'services' && (
        <div>
          {/* Create Service Card */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Create New Service</h3>
            <form onSubmit={handleAddService} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1.5fr auto', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haircut, Consultation"
                  className="form-input"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Wash and style included"
                  className="form-input"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Est. Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="720"
                  placeholder="30"
                  className="form-input"
                  value={newService.durationMinutes}
                  onChange={(e) => setNewService({ ...newService, durationMinutes: parseInt(e.target.value, 10) || 1 })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                <Plus size={16} /> Add Service
              </button>
            </form>
          </div>

          {/* Services List */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Active Business Services ({services.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {services.map((s) => (
                <div
                  key={s._id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <h4 style={{ fontSize: '1.1rem', color: '#FFF' }}>{s.name}</h4>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#FBBF24', background: 'rgba(245, 158, 11, 0.1)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        {s.durationMinutes} mins
                      </span>
                    </div>
                    {s.description && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        {s.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteService(s._id)}
                    className="btn btn-danger"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', alignSelf: 'flex-start', marginTop: '0.75rem' }}
                  >
                    <Trash2 size={13} /> Deactivate
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STAFF */}
      {activeTab === 'staff' && (
        <div>
          {/* Add Staff Card */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Add Staff Member</h3>
            <form onSubmit={handleAddStaff} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Doe"
                  className="form-input"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  required
                  placeholder="alex@business.com"
                  className="form-input"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  placeholder="+254 700..."
                  className="form-input"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                <Plus size={16} /> Add Staff
              </button>
            </form>
          </div>

          {/* Staff List */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Staff Team ({staff.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Phone</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((st) => (
                    <tr key={st._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#FFF' }}>{st.name}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{st.email}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{st.phone || '—'}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: st.active ? '#34D399' : '#FB7185' }}>
                          {st.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteStaff(st._id)}
                          className="btn btn-danger"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        >
                          <Trash2 size={13} /> Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OPENING HOURS */}
      {activeTab === 'hours' && (
        <div className="glass-card" style={{ maxWidth: '720px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Weekly Operating Schedule</h3>
              <p style={{ fontSize: '0.85rem' }}>Configure the opening and closing hours for queue availability.</p>
            </div>
            <button onClick={handleSaveHours} className="btn btn-primary">
              <Save size={16} /> Save Hours
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {openingHours.map((h, idx) => (
              <div
                key={h.dayOfWeek}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 100px 1fr 1fr',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontWeight: 600, color: '#FFF' }}>{dayNames[h.dayOfWeek]}</span>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={h.isOpen}
                    onChange={(e) => {
                      const updated = [...openingHours];
                      updated[idx].isOpen = e.target.checked;
                      setOpeningHours(updated);
                    }}
                  />
                  <span>{h.isOpen ? 'Open' : 'Closed'}</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From:</span>
                  <input
                    type="time"
                    disabled={!h.isOpen}
                    className="form-input"
                    style={{ padding: '0.35rem 0.6rem' }}
                    value={h.openingTime}
                    onChange={(e) => {
                      const updated = [...openingHours];
                      updated[idx].openingTime = e.target.value;
                      setOpeningHours(updated);
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
                  <input
                    type="time"
                    disabled={!h.isOpen}
                    className="form-input"
                    style={{ padding: '0.35rem 0.6rem' }}
                    value={h.closingTime}
                    onChange={(e) => {
                      const updated = [...openingHours];
                      updated[idx].closingTime = e.target.value;
                      setOpeningHours(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE */}
      {activeTab === 'profile' && profile && (
        <div className="glass-card" style={{ maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Business Profile Information</h3>
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">City / Location</label>
              <input
                type="text"
                className="form-input"
                value={profile.location || ''}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Physical Address</label>
              <input
                type="text"
                className="form-input"
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                className="form-input"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              <Save size={16} /> Save Profile Changes
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: SUBSCRIPTION & PAYMENT */}
      {activeTab === 'subscription' && (
        <div style={{ maxWidth: '1080px' }}>
          {/* Status & Free Trial Alert Banner */}
          <div
            className="glass-card"
            style={{
              marginBottom: '2rem',
              borderColor: isTrial ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)',
              background: isTrial ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <CreditCard size={18} color={isTrial ? '#FBBF24' : '#34D399'} />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: isTrial ? '#FBBF24' : '#34D399',
                      textTransform: 'uppercase',
                    }}
                  >
                    {isTrial ? '1-Month Free Trial Active' : `${subscription?.plan || 'PAID'} Plan Active`}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.4rem' }}>
                  {isTrial
                    ? `${daysLeft} Day${daysLeft === 1 ? '' : 's'} Remaining on Free Trial`
                    : `Active Subscription: ${subscription?.plan} Plan`}
                </h3>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {isTrial
                    ? 'All registered businesses receive a 30-day (1-month) free trial of KARIBU. Select a paid plan below before your trial expires to maintain uninterrupted service.'
                    : `Your current plan is active until ${
                        subscription?.endDate
                          ? new Date(subscription.endDate).toLocaleDateString()
                          : 'N/A'
                      }.`}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                <div style={{ color: '#34D399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {subscription?.status || 'ACTIVE'}
                </div>
                {subscription?.lastPaymentAmount > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Last Paid: ${subscription.lastPaymentAmount} ({subscription.paymentMethod})
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Billing Toggle */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '0.35rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                gap: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`btn ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)', padding: '0.4rem 1.25rem', fontSize: '0.85rem' }}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`btn ${billingCycle === 'yearly' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)', padding: '0.4rem 1.25rem', fontSize: '0.85rem' }}
              >
                Annual Billing <span style={{ color: '#34D399', fontWeight: 700 }}>(Save 20%)</span>
              </button>
            </div>
          </div>

          {/* Pricing Plans Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            {plans.map((p) => {
              const price = billingCycle === 'yearly' ? p.yearlyPrice : p.monthlyPrice;
              const isCurrent = subscription?.plan === p.id;
              return (
                <div
                  key={p.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderColor: p.popular
                      ? 'rgba(245, 158, 11, 0.5)'
                      : isCurrent
                      ? 'rgba(16, 185, 129, 0.4)'
                      : 'var(--border-subtle)',
                    background: p.popular
                      ? 'rgba(245, 158, 11, 0.04)'
                      : 'var(--bg-card)',
                    position: 'relative',
                  }}
                >
                  {p.popular && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: '#090D16',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        padding: '0.2rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.25rem', color: '#FFF' }}>{p.name}</h4>
                      {isCurrent && (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                          Current Plan
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      {p.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FFF' }}>
                        ${price}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>

                    {/* Features list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem' }}>
                      {p.features.map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <Check size={15} color="#10B981" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPayModalPlan(p.id)}
                    className={`btn ${p.popular ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%', padding: '0.75rem' }}
                  >
                    <CreditCard size={16} />
                    <span>{isCurrent ? `Renew ${p.name}` : `Upgrade to ${p.name}`}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PAYMENT CHECKOUT MODAL */}
      {payModalPlan && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(9, 13, 22, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setPayModalPlan(null)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '500px',
              background: '#0F172A',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPayModalPlan(null)}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <ShieldCheck size={18} color="#10B981" />
              <span style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                SECURE SUBSCRIPTION CHECKOUT
              </span>
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>
              Subscribe to {payModalPlan} Plan
            </h2>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Select payment method to activate your {billingCycle} subscription.
            </p>

            {/* Plan Summary Box */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#FFF' }}>{payModalPlan} Plan ({billingCycle})</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Adds {billingCycle === 'yearly' ? '365 days' : '30 days'} of automated queuing
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: '#FBBF24' }}>
                ${plans.find((p) => p.id === payModalPlan)?.[billingCycle === 'yearly' ? 'yearlyPrice' : 'monthlyPrice']}
              </div>
            </div>

            <form onSubmit={handleProcessPayment}>
              {/* Payment Method Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  Payment Method:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Card')}
                    className={`btn ${paymentMethod === 'Card' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.65rem', fontSize: '0.85rem' }}
                  >
                    <CreditCard size={16} /> Credit / Debit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('M-Pesa')}
                    className={`btn ${paymentMethod === 'M-Pesa' ? 'btn-emerald' : 'btn-secondary'}`}
                    style={{ padding: '0.65rem', fontSize: '0.85rem' }}
                  >
                    <Zap size={16} /> M-Pesa / Mobile
                  </button>
                </div>
              </div>

              {/* Card Form */}
              {paymentMethod === 'Card' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      className="form-input"
                      value={payCard.name}
                      onChange={(e) => setPayCard({ ...payCard, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength="19"
                      placeholder="4242 •••• •••• 4242"
                      className="form-input"
                      value={payCard.number}
                      onChange={(e) => setPayCard({ ...payCard, number: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        required
                        placeholder="12/28"
                        maxLength="5"
                        className="form-input"
                        value={payCard.expiry}
                        onChange={(e) => setPayCard({ ...payCard, expiry: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVC / CVV</label>
                      <input
                        type="text"
                        required
                        maxLength="4"
                        placeholder="123"
                        className="form-input"
                        value={payCard.cvc}
                        onChange={(e) => setPayCard({ ...payCard, cvc: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* M-Pesa Form */}
              {paymentMethod === 'M-Pesa' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">M-Pesa Mobile Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +254 712 345 678"
                      className="form-input"
                      value={payPhone}
                      onChange={(e) => setPayPhone(e.target.value)}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      An STK push prompt will be sent to your phone to authorize payment.
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={payLoading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }}
              >
                {payLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Lock size={16} />
                    <span>
                      Authorize & Pay $
                      {plans.find((p) => p.id === payModalPlan)?.[
                        billingCycle === 'yearly' ? 'yearlyPrice' : 'monthlyPrice'
                      ]}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessOwnerDashboard;
