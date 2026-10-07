import React, { useState } from 'react';
import api from '../../services/api';
import { X, Clock, User, Phone, Loader2, CheckCircle2 } from 'lucide-react';

export const JoinQueueModal = ({ business, onClose, onJoined }) => {
  const [selectedServiceId, setSelectedServiceId] = useState(
    business.services && business.services.length > 0 ? business.services[0]._id : ''
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) {
      setError('Please select a service.');
      return;
    }
    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/customer/queue/join', {
        businessId: business.id || business._id,
        serviceId: selectedServiceId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      });

      if (res.success && res.data) {
        onJoined(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to join queue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#0F172A',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
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

        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <img
            src="/karibu-logo.png"
            alt="KARIBU logo"
            style={{
              width: '42px',
              height: '42px',
              objectFit: 'contain',
              mixBlendMode: 'screen',
              flexShrink: 0,
              marginTop: '0.1rem',
            }}
          />
          <div>
            <div style={{ fontSize: '0.8rem', color: '#FBBF24', fontWeight: 600, textTransform: 'uppercase' }}>
              Joining Queue for
            </div>
            <h2 style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>{business.name}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {business.location} {business.address ? `• ${business.address}` : ''}
            </div>
          </div>
        </div>

        {error && (
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
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Service Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.65rem', display: 'block' }}>
              Select Desired Service:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {business.services && business.services.length > 0 ? (
                business.services.map((s) => {
                  const isSelected = selectedServiceId === s._id;
                  return (
                    <div
                      key={s._id}
                      onClick={() => setSelectedServiceId(s._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected
                          ? 'rgba(245, 158, 11, 0.12)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${
                          isSelected ? 'rgba(245, 158, 11, 0.45)' : 'var(--border-subtle)'
                        }`,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? '#F59E0B' : 'var(--text-muted)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#FFF' }}>{s.name}</div>
                          {s.description && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {s.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          color: '#FBBF24',
                          fontWeight: 600,
                        }}
                      >
                        <Clock size={14} />
                        <span>{s.durationMinutes} min</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No services configured for this business.
                </div>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="form-group">
            <label className="form-label">Your Name (Required)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Maya Lin"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <User
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (Optional for updates)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. +254 700 000000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Phone
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
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Confirm & Get Queue Ticket</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinQueueModal;
