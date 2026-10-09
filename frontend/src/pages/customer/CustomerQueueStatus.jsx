import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import useSocket from '../../hooks/useSocket';
import StatusBadge from '../../components/StatusBadge';
import CountdownTimer from '../../components/CountdownTimer';
import { Clock, UserCheck, ArrowLeft, LogOut, Sparkles, Building, AlertCircle } from 'lucide-react';

export const CustomerQueueStatus = ({ queueId, onBackToHome }) => {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!queueId) return;
    try {
      const res = await api.get(`/customer/queue/${queueId}`);
      if (res.success && res.data) {
        setQueueData(res.data);
      }
    } catch (err) {
      console.error('Error fetching queue ticket:', err);
      setError(err.message || 'Unable to load ticket details.');
    } finally {
      setLoading(false);
    }
  }, [queueId]);

  useEffect(() => {
    fetchStatus();

    // 8-second polling fallback in case socket disconnects
    const pollInterval = setInterval(fetchStatus, 8000);
    return () => clearInterval(pollInterval);
  }, [fetchStatus]);

  // Real-time socket updates for this queue record
  useSocket('queue', queueId, (eventName, data) => {
    if (eventName === 'customer_status_changed' || eventName === 'service_time_adjusted') {
      fetchStatus();
    }
  });

  const handleLeaveQueue = async () => {
    if (!window.confirm('Are you sure you want to leave the queue? Your position will be forfeited.')) {
      return;
    }

    try {
      setLeaving(true);
      await api.post(`/customer/queue/${queueId}/leave`);
      await fetchStatus();
    } catch (err) {
      alert(err.message || 'Failed to leave queue.');
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <div style={{ color: '#A84E2E', fontSize: '1.2rem', fontWeight: 600 }}>
          Retrieving your live queue ticket...
        </div>
      </div>
    );
  }

  if (error || !queueData) {
    return (
      <div className="container" style={{ width: '100%', maxWidth: '500px', margin: '4rem auto' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <AlertCircle size={44} color="#C25E58" style={{ marginBottom: '1rem' }} />
          <h3>Queue Ticket Not Found</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            {error || 'This queue ticket is not active or has been removed.'}
          </p>
          <button className="btn btn-primary" onClick={onBackToHome}>
            <ArrowLeft size={16} /> Return to Home
          </button>
        </div>
      </div>
    );
  }

  const isServing = queueData.status === 'SERVING';
  const isWaiting = queueData.status === 'WAITING';
  const isCompleted = queueData.status === 'COMPLETED';
  const isCancelled = queueData.status === 'CANCELLED' || queueData.status === 'LEFT';

  return (
    <div className="container" style={{ width: '100%', maxWidth: '640px', padding: 'clamp(1.5rem, 5vw, 2.5rem) clamp(1rem, 4vw, 1.5rem) 5rem' }}>
      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem 0.75rem', marginBottom: '1.5rem' }}>
        <button
          className="btn btn-secondary"
          onClick={onBackToHome}
          style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
        >
          <ArrowLeft size={15} /> All Businesses
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#4C8C6A', fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4C8C6A', animation: 'pulse-dot 1.5s infinite' }} />
          Live Real-Time Tracker
        </div>
      </div>

      {/* Main Ticket Card */}
      <div
        className="glass-card"
        style={{
          textAlign: 'center',
          padding: '2.5rem clamp(1rem, 4vw, 2rem)',
          position: 'relative',
          overflow: 'hidden',
          borderColor: isServing
            ? 'rgba(76, 140, 106, 0.45)'
            : 'rgba(194, 94, 58, 0.35)',
          boxShadow: isServing
            ? 'var(--shadow-md)'
            : 'var(--shadow-md)',
        }}
      >
        {/* KARIBU Watermark */}
        <img
          src="/karibu-logo.png"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '0.9rem',
            right: '1rem',
            width: '40px',
            height: '40px',
            objectFit: 'contain',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />

        {/* Business Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          <Building size={14} color="#A84E2E" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{queueData.business.name}</span>
        </div>

        {/* Big Queue Number */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Your Queue Number
          </div>
          <div className="queue-number-hero" style={{ margin: '0.2rem 0' }}>
            {queueData.queueNumber}
          </div>
        </div>

        {/* Status Pill */}
        <div style={{ marginBottom: '2rem' }}>
          <StatusBadge status={queueData.status} />
        </div>

        {/* Dynamic Status Presentation */}
        {isServing && (
          <div
            style={{
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(76, 140, 106, 0.08)',
              border: '1px solid rgba(76, 140, 106, 0.3)',
              marginBottom: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#356B4E', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              <Sparkles size={18} />
              <span>It is your turn! Please proceed to the service desk.</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Your service is currently underway. Estimated remaining service time:
            </p>

            <CountdownTimer
              expectedEndAt={queueData.expectedEndAt}
              onExpire={fetchStatus}
            />

            {queueData.extensionMinutes > 0 && (
              <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: '#96660F', fontFamily: 'var(--font-mono)' }}>
                Time adjusted by staff: +{queueData.extensionMinutes} minutes
              </div>
            )}
          </div>
        )}

        {isWaiting && (
          <div
            className="resp-grid cols-2"
            style={{
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Position Ahead
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#96660F' }}>
                #{queueData.position}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {queueData.position === 1 ? 'Next in line!' : `${queueData.position - 1} customer(s) ahead`}
              </div>
            </div>

            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Est. Waiting Time
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#35597B' }}>
                ~{queueData.estimatedWaitMinutes}m
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Based on active service durations
              </div>
            </div>
          </div>
        )}

        {isCompleted && (
          <div
            style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(74, 123, 166, 0.1)',
              border: '1px solid rgba(74, 123, 166, 0.3)',
              marginBottom: '1.75rem',
            }}
          >
            <UserCheck size={36} color="#35597B" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>Service Completed</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Your session has concluded. Thank you for using the KARIBU Smart Queue System!
            </p>
          </div>
        )}

        {isCancelled && (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(194, 94, 88, 0.1)',
              border: '1px solid rgba(194, 94, 88, 0.3)',
              marginBottom: '1.75rem',
            }}
          >
            <h4 style={{ color: '#A33D38' }}>Ticket No Longer Active</h4>
            <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              This queue entry has been {queueData.status.toLowerCase()}.
            </p>
          </div>
        )}

        {/* Ticket Metadata Breakdown */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.35rem 1rem',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Service: </span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{queueData.service.name}</span>
            <span style={{ color: '#96660F', marginLeft: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              ({queueData.service.durationMinutes} min)
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Customer: </span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{queueData.customer.name}</span>
          </div>
        </div>

        {/* Leave Queue Button (Only for WAITING or SERVING) */}
        {(isWaiting || isServing) && (
          <div style={{ marginTop: '1.75rem' }}>
            <button
              onClick={handleLeaveQueue}
              disabled={leaving}
              className="btn btn-danger"
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            >
              <LogOut size={14} />
              <span>Leave Queue</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerQueueStatus;
