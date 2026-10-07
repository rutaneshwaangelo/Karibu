import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  Shield,
  LayoutDashboard,
  Building2,
  FolderTree,
  Users,
  Layers,
  CreditCard,
  BarChart3,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
  MapPin,
  Mail,
  Lock,
  User,
  X,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kpis, setKpis] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [queues, setQueues] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register Business Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [newBiz, setNewBiz] = useState({
    name: '',
    categoryId: '',
    ownerName: '',
    email: '',
    phone: '',
    location: '',
    address: '',
    password: '',
    status: 'ACTIVE',
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Category creation
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [kpiRes, bizRes, catRes, userRes, queueRes, subRes, repRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/businesses'),
        api.get('/admin/categories'),
        api.get('/admin/users'),
        api.get('/admin/queues'),
        api.get('/admin/subscriptions'),
        api.get('/admin/reports'),
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);
      if (bizRes.success) setBusinesses(bizRes.data);
      if (catRes.success) {
        setCategories(catRes.data);
        if (catRes.data.length > 0 && !newBiz.categoryId) {
          setNewBiz((prev) => ({ ...prev, categoryId: catRes.data[0]._id }));
        }
      }
      if (userRes.success) setUsers(userRes.data);
      if (queueRes.success) setQueues(queueRes.data);
      if (subRes.success) setSubscriptions(subRes.data);
      if (repRes.success) setReports(repRes.data);
    } catch (err) {
      console.error('Error loading admin portal data:', err);
    } finally {
      setLoading(false);
    }
  }, [newBiz.categoryId]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Business Registration Handler
  const handleRegisterBusiness = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    setRegLoading(true);

    try {
      const res = await api.post('/admin/businesses', newBiz);
      if (res.success) {
        setRegSuccess(`Business "${res.data.business.name}" registered successfully!`);
        setShowRegModal(false);
        setNewBiz({
          name: '',
          categoryId: categories[0]?._id || '',
          ownerName: '',
          email: '',
          phone: '',
          location: '',
          address: '',
          password: '',
          status: 'ACTIVE',
        });
        loadAdminData();
      }
    } catch (err) {
      setRegError(err.message || 'Business registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  // Category Creation Handler
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await api.post('/admin/categories', {
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      if (res.success) {
        setCategories([...categories, res.data]);
        setNewCatName('');
        setNewCatDesc('');
      }
    } catch (err) {
      alert(err.message || 'Failed to create category.');
    }
  };

  // Toggle user status
  const handleToggleUser = async (userItem) => {
    try {
      const res = await api.patch(`/admin/users/${userItem._id}/toggle-status`);
      if (res.success) {
        setUsers(users.map((u) => (u._id === userItem._id ? res.data : u)));
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle user status.');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
      {/* Top Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <img
              src="/karibu-logo.png"
              alt=""
              aria-hidden="true"
              style={{ width: '22px', height: '22px', objectFit: 'contain', mixBlendMode: 'screen' }}
            />
            <span style={{ fontSize: '0.8rem', color: '#A78BFA', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              KARIBU SYSTEM ADMIN
            </span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>Platform Control Center</h1>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowRegModal(true)}
          style={{ fontSize: '0.9rem' }}
        >
          <Plus size={16} />
          <span>Register New Business</span>
        </button>
      </div>

      {regSuccess && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34D399',
            marginBottom: '1.5rem',
          }}
        >
          {regSuccess}
        </div>
      )}

      {/* Tabs */}
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
          { id: 'businesses', label: 'Businesses', icon: Building2 },
          { id: 'categories', label: 'Categories', icon: FolderTree },
          { id: 'users', label: 'Users & Staff', icon: Users },
          { id: 'queues', label: 'Queue Overview', icon: Layers },
          { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            <div className="glass-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Businesses
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FBBF24', margin: '0.3rem 0' }}>
                {kpis?.totalBusinesses || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#34D399' }}>{kpis?.activeBusinesses || 0} currently active</div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Users
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#A78BFA', margin: '0.3rem 0' }}>
                {kpis?.totalUsers || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Owners & Staff</div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Queues Today
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38BDF8', margin: '0.3rem 0' }}>
                {kpis?.queuesToday || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kpis?.activeServingCount || 0} currently serving</div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Active Categories
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34D399', margin: '0.3rem 0' }}>
                {kpis?.totalCategories || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Classifications</div>
            </div>
          </div>

          {/* Quick Active Queues Feed */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Active System Queues (Serving & Waiting)</h3>
            {queues.length === 0 ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active queues at the moment.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Business</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Ticket</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Service</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Est. Wait</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queues.map((q) => (
                      <tr key={q._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#FFF' }}>{q.businessId?.name}</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', color: '#FBBF24', fontWeight: 700 }}>
                          {q.queueNumber}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>{q.customerId?.name}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{q.serviceId?.name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${q.status === 'SERVING' ? 'badge-serving' : 'badge-waiting'}`}>
                            {q.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>~{q.estimatedWaitMinutes}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BUSINESSES */}
      {activeTab === 'businesses' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Registered Businesses ({businesses.length})</h3>
            <button className="btn btn-primary" onClick={() => setShowRegModal(true)}>
              <Plus size={15} /> Register Business
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Business Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Owner</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Services</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#FFF' }}>{b.name}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#60A5FA' }}>{b.categoryId?.name || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div>{b.ownerId?.name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.ownerId?.email}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{b.location || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)' }}>{b.serviceCount}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          background: b.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                          color: b.status === 'ACTIVE' ? '#34D399' : '#FB7185',
                          border: `1px solid ${b.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                        }}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div>
          {/* Add Category Form */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Add Business Category</h3>
            <form onSubmit={handleAddCategory} style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr auto', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wellness & Spa"
                  className="form-input"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Massage therapy, saunas and holistic health"
                  className="form-input"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                <Plus size={16} /> Add Category
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Active Categories ({categories.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <h4 style={{ fontSize: '1.1rem', color: '#FFF', marginBottom: '0.35rem' }}>{cat.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{cat.description || 'No description'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USERS / STAFF */}
      {activeTab === 'users' && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Registered Users ({users.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Business</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Toggle Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#FFF' }}>{u.name}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          background:
                            u.role === 'ADMIN'
                              ? 'rgba(139, 92, 246, 0.15)'
                              : u.role === 'BUSINESS_OWNER'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                          color:
                            u.role === 'ADMIN'
                              ? '#A78BFA'
                              : u.role === 'BUSINESS_OWNER'
                              ? '#FBBF24'
                              : '#34D399',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {u.businessId?.name || (u.role === 'ADMIN' ? 'Platform Wide' : '—')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: u.active ? '#34D399' : '#FB7185' }}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleUser(u)}
                          className={`btn ${u.active ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: QUEUE OVERVIEW */}
      {activeTab === 'queues' && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Platform-Wide Active Queues</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Business</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Ticket</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Joined At</th>
                </tr>
              </thead>
              <tbody>
                {queues.map((q) => (
                  <tr key={q._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#FFF' }}>{q.businessId?.name}</td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FBBF24' }}>
                      {q.queueNumber}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>{q.customerId?.name}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${q.status === 'SERVING' ? 'badge-serving' : 'badge-waiting'}`}>
                        {q.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(q.joinedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Business Subscriptions</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Business</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Plan Tier</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Started</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Renews / Ends</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#FFF' }}>{sub.businessId?.name}</td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', color: '#FBBF24', fontWeight: 700 }}>
                      {sub.plan}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: sub.status === 'ACTIVE' ? '#34D399' : '#FB7185' }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {new Date(sub.startDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#FFF' }}>
                      {new Date(sub.endDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: REPORTS */}
      {activeTab === 'reports' && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Platform Queue Analytics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Customers Served</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34D399', margin: '0.4rem 0' }}>
                {reports?.totalQueuesServed || 0}
              </div>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Waiting Volume</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38BDF8', margin: '0.4rem 0' }}>
                {reports?.totalQueuesWaiting || 0}
              </div>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cancelled / Left</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FB7185', margin: '0.4rem 0' }}>
                {reports?.totalCancelled || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER BUSINESS MODAL */}
      {showRegModal && (
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
          onClick={() => setShowRegModal(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '600px',
              background: '#0F172A',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowRegModal(false)}
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

            <h2 style={{ fontSize: '1.45rem', marginBottom: '0.4rem' }}>Register New Business</h2>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Create the business record, owner account, default opening hours, and subscription.
            </p>

            {regError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#FB7185',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterBusiness}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Health Dental Clinic"
                    className="form-input"
                    value={newBiz.name}
                    onChange={(e) => setNewBiz({ ...newBiz, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={newBiz.categoryId}
                    onChange={(e) => setNewBiz({ ...newBiz, categoryId: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id} style={{ background: '#0F172A', color: '#FFF' }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Owner Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Ouma"
                    className="form-input"
                    value={newBiz.ownerName}
                    onChange={(e) => setNewBiz({ ...newBiz, ownerName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Owner Login Email</label>
                  <input
                    type="email"
                    required
                    placeholder="owner@business.com"
                    className="form-input"
                    value={newBiz.email}
                    onChange={(e) => setNewBiz({ ...newBiz, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Initial Owner Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="form-input"
                    value={newBiz.password}
                    onChange={(e) => setNewBiz({ ...newBiz, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    placeholder="+254 7..."
                    className="form-input"
                    value={newBiz.phone}
                    onChange={(e) => setNewBiz({ ...newBiz, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">City / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Nairobi West"
                    className="form-input"
                    value={newBiz.location}
                    onChange={(e) => setNewBiz({ ...newBiz, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Physical Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Westgate Plaza 2nd Floor"
                    className="form-input"
                    value={newBiz.address}
                    onChange={(e) => setNewBiz({ ...newBiz, address: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }}
              >
                {regLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm & Register Business'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
