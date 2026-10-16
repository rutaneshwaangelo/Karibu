import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from './StatusBadge';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Hash,
  Loader2,
  Search,
  Ticket,
  Users,
} from 'lucide-react';

// The place in line is the one number a customer actually cares about, so keep
// it fresh while the card is open instead of making them re-submit the form.
const REFRESH_INTERVAL_MS = 15000;

/**
 * "Where am I in line?" lookup for customers.
 *
 * Tickets are only reachable through the queueId handed out at join time, so
 * anyone who closed that tab had no way back to their own status. This card
 * finds every still-active ticket matching the name or ticket number typed in
 * and shows its position in the line for that business.
 */
export const TrackTicket = ({ onOpenTicket }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // null = never searched, [] = searched with no active ticket found
  const [matches, setMatches] = useState(null);
  // Kept in state (not a ref) so the result panel renders the searched term
  const [lastQuery, setLastQuery] = useState('');

  const lookup = useCallback(async (rawQuery, { silent = false } = {}) => {
    const value = rawQuery.trim();

    if (value.length < 2) {
      if (!silent) {
        setError('Enter your name (at least 2 characters) or your ticket number, e.g. K001.');
      }
      return;
    }

    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const res = await api.post('/customer/queue/track', { query: value });

      if (res.success) {
        setMatches(res.data?.matches || []);
        setLastQuery(value);
        setError('');
      }
    } catch (err) {
      // A silent background refresh must never wipe a good result with an error
      if (!silent) {
        setError(err.message || 'Could not look up that ticket. Please try again.');
        setMatches(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!lastQuery || matches === null) return undefined;

    const interval = setInterval(
      () => lookup(lastQuery, { silent: true }),
      REFRESH_INTERVAL_MS
    );

    return () => clearInterval(interval);
  }, [lastQuery, matches, lookup]);

  const handleSubmit = (e) => {
    e.preventDefault();
    lookup(query);
  };

  return (
    <div
      className="glass-card"
      style={{
        textAlign: 'left',
        marginTop: '1.75rem',
        padding: '1.35rem',
        borderColor: 'rgba(194, 94, 58, 0.28)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        <Ticket size={17} color="#A84E2E" />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#A84E2E',
          }}
        >
          Already in a queue?
        </span>
      </div>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.9rem' }}>
        Lost your ticket? Type your full name or ticket number to see exactly where you are in the
        line.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
      >
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            placeholder="Your name or ticket (K001)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={60}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ flex: '0 0 auto', padding: '0.6rem 1.1rem' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          <span>Find my place</span>
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: '0.9rem',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(194, 94, 88, 0.1)',
            border: '1px solid rgba(194, 94, 88, 0.3)',
            color: '#A33D38',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {Array.isArray(matches) && matches.length === 0 && !error && (
        <div
          style={{
            marginTop: '0.9rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          No active ticket found for <strong>{lastQuery}</strong>. Check the spelling, or your
          ticket may already be completed.
        </div>
      )}

      {Array.isArray(matches) && matches.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {matches.map((match) => {
            const isServing = match.status === 'SERVING';
            const peopleAhead = match.peopleAhead ?? 0;

            return (
              <div
                key={match.queueId}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isServing ? 'rgba(76, 140, 106, 0.08)' : 'rgba(194, 94, 58, 0.05)',
                  border: `1px solid ${
                    isServing ? 'rgba(76, 140, 106, 0.35)' : 'rgba(194, 94, 58, 0.22)'
                  }`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {match.business?.name}
                      {match.business?.location ? ` • ${match.business.location}` : ''}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.45rem',
                        fontWeight: 600,
                        color: '#A84E2E',
                        lineHeight: 1.2,
                      }}
                    >
                      {match.queueNumber}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {/* The name is only echoed when the search was that person's
                          full name; otherwise the ticket number identifies it. */}
                      {[match.customer?.name, match.service?.name].filter(Boolean).join(' · ')}
                    </div>
                  </div>

                  <StatusBadge status={match.status} />
                </div>

                {/* The number the customer came here for */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    marginTop: '0.85rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                  }}
                >
                  {isServing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#356B4E', fontWeight: 700 }}>
                      <Hash size={17} />
                      <span>You are being served now — please proceed to the desk.</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '1.9rem',
                            fontWeight: 800,
                            color: '#96660F',
                            lineHeight: 1,
                          }}
                        >
                          #{match.placeInLine}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>in line</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <Users size={14} />
                        <span>
                          {peopleAhead === 0
                            ? 'Nobody ahead of you — you are next'
                            : `${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead of you`}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#35597B' }}>
                        <Clock size={14} />
                        <span>~{match.estimatedWaitMinutes ?? 0} min wait</span>
                      </div>
                    </>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginTop: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {match.nowServing ? `Now serving ${match.nowServing}` : 'No one at the desk yet'}
                    {typeof match.totalWaiting === 'number' ? ` · ${match.totalWaiting} waiting` : ''}
                  </div>

                  {onOpenTicket && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onOpenTicket(match.queueId)}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                    >
                      <span>Open live ticket</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrackTicket;
