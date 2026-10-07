import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import useSocket from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import CountdownTimer from '../../components/CountdownTimer';
import TimeAdjustCluster from '../../components/TimeAdjustCluster';
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  UserCheck,
  Ban,
  Building,
} from 'lucide-react';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const [queueData, setQueueData] = useState({
    currentServing: null,
    waitingList: [],
    recentlyCompleted: [],
    totalWaiting: 0,
  });
  const [loading, setLoading] = useState(true);
  const [adjustMessage, setAdjustMessage] = useState('');

  const businessId = user?.businessId;

  const fetchQueue = useCallback(async () => {
    try {
      const res = await api.get('/staff/queue');
      if (res.success && res.data) {
        setQueueData(res.data);
      }
    } catch (err) {
      console.error('Error fetching staff queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // 6-second polling fallback
    const interval = setInterval(fetchQueue, 6000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Real-time socket updates for this business
  useSocket('business', businessId, (eventName) => {
    if (eventName === 'queue_updated') {
      fetchQueue();
    }
  });

  const handleAdjustTime = async (minutes) => {
    if (!queueData.currentServing) return;
    setAdjustMessage('');

    try {
      const res = await api.post(
        `/staff/queue/${queueData.currentServing._id}/adjust-time`,
        { minutes }
      );
      setAdjustMessage(
        `Time updated: ${minutes > 0 ? '+' : ''}${minutes}m. New expected end: ${new Date(
          res.data.expectedEndAt
        ).toLocaleTimeString()}`
      );
      await fetchQueue();
    } catch (err) {
      alert(err.message || 'Failed to adjust service time.');
    }
  };

  const handleCancelEntry = async (entry) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel ticket ${entry.queueNumber} for ${entry.customerId?.name || 'this customer'}?`
      )
    ) {
      return;
    }

    try {
      await api.post(`/staff/queue/${entry._id}/cancel`);
      await fetchQueue();
    } catch (err) {
      alert(err.message || 'Failed to cancel queue entry.');
    }
  };

  const current = queueData.currentServing;
  const nextCustomer = queueData.waitingList[0] || null;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 700,
              }}
            >
              STAFF ACTIVE DESK
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              • {user?.business?.name || 'Business Desk'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem' }}>Live Service Console</h1>
        </div>

        <button
          className="btn btn-secondary"
          onClick={fetchQueue}
          style={{ fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Grid Layout: Active Customer + Upcoming */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 1.4fr) minmax(300px, 1fr)',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* CURRENTLY SERVING CARD */}
        <div
          className="glass-card"
          style={{
            borderColor: current
              ? 'rgba(16, 185, 129, 0.4)'
              : 'rgba(255, 255, 255, 0.08)',
            background: current
              ? 'rgba(15, 23, 42, 0.85)'
              : 'rgba(15, 23, 42, 0.6)',
            boxShadow: current ? '0 0 30px rgba(16, 185, 129, 0.15)' : 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: current ? '#10B981' : '#64748B',
                  animation: current ? 'pulse-dot 1.5s infinite' : 'none',
                }}
              />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: current ? '#34D399' : 'var(--text-muted)' }}>
                {current ? 'Currently Serving' : 'Service Desk Idle'}
              </span>
            </div>

            {current && <StatusBadge status="SERVING" />}
          </div>

          {current ? (
            <div>
              {/* Customer & Ticket */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Customer Name
                  </div>
                  <h2 style={{ fontSize: '1.6rem', marginTop: '0.1rem', color: '#FFF' }}>
                    {current.customerId?.name || 'Walk-in Guest'}
                  </h2>
                  {current.customerId?.phone && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Phone: {current.customerId?.phone}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Ticket
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '2.2rem',
                      fontWeight: 800,
                      color: '#FBBF24',
                    }}
                  >
                    {current.queueNumber}
                  </div>
                </div>
              </div>

              {/* Service & Timer Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Assigned Service
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#FFF' }}>
                    {current.serviceId?.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>
                    Base: {current.serviceId?.durationMinutes} min
                    {current.extensionMinutes !== 0 && (
                      <span style={{ marginLeft: '0.4rem', color: '#38BDF8' }}>
                        (Adjusted: {current.extensionMinutes > 0 ? `+${current.extensionMinutes}` : current.extensionMinutes}m)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Time Remaining
                  </div>
                  <CountdownTimer
                    expectedEndAt={current.expectedEndAt}
                    onExpire={fetchQueue}
                  />
                </div>
              </div>

              {/* Staff Time Adjustment Cluster ⭐ */}
              <div style={{ marginBottom: '1.25rem' }}>
                <TimeAdjustCluster onAdjust={handleAdjustTime} />
              </div>

              {adjustMessage && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34D399',
                    fontSize: '0.8rem',
                    marginBottom: '1rem',
                  }}
                >
                  {adjustMessage}
                </div>
              )}

              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.85rem',
                }}
              >
                <Sparkles size={13} color="#FBBF24" />
                <span>
                  Automatic Queue Engine is active. Service finishes and advances to next customer automatically when timer reaches zero.
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <UserCheck size={42} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3>No customer currently serving</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                When a customer joins the queue, they will automatically be called and promoted to this desk.
              </p>
            </div>
          )}
        </div>

        {/* UPCOMING / NEXT IN LINE */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ fontSize: '1.1rem' }}>Next Customer</h3>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: '#FBBF24',
                background: 'rgba(245, 158, 11, 0.12)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {queueData.totalWaiting} in line
            </span>
          </div>

          {nextCustomer ? (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.6rem',
                      fontWeight: 800,
                      color: '#FBBF24',
                    }}
                  >
                    {nextCustomer.queueNumber}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#FFF' }}>
                    {nextCustomer.customerId?.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Service: {nextCustomer.serviceId?.name} ({nextCustomer.serviceId?.durationMinutes}m)
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Est. Wait
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: '#38BDF8',
                      fontSize: '1.2rem',
                    }}
                  >
                    ~{nextCustomer.estimatedWaitMinutes}m
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}
            >
              No upcoming customers in line.
            </div>
          )}

          {/* Quick Metrics */}
          <div
            style={{
              marginTop: 'auto',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Waiting Now</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FFF' }}>
                {queueData.totalWaiting}
              </div>
            </div>
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Served Today</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34D399' }}>
                {queueData.recentlyCompleted.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL WAITING QUEUE LIST */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>
          Full Waiting List ({queueData.totalWaiting})
        </h3>

        {queueData.waitingList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            The waiting queue is currently clear.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Position</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Ticket</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Service</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Est. Wait</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Joined At</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {queueData.waitingList.map((entry, index) => (
                  <tr
                    key={entry._id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', color: '#FBBF24' }}>
                      #{index + 1}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {entry.queueNumber}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#FFF' }}>
                      {entry.customerId?.name || 'Guest'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {entry.serviceId?.name} ({entry.serviceId?.durationMinutes}m)
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>
                      ~{entry.estimatedWaitMinutes}m
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCancelEntry(entry)}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        title="Cancel No-Show"
                      >
                        <Ban size={13} /> Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
