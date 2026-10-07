import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const CountdownTimer = ({ expectedEndAt, onExpire }) => {
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);

  useEffect(() => {
    if (!expectedEndAt) {
      setTimeLeftSeconds(0);
      return;
    }

    const calculateRemaining = () => {
      const targetTime = new Date(expectedEndAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      return diff;
    };

    setTimeLeftSeconds(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeftSeconds(remaining);

      if (remaining === 0 && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expectedEndAt, onExpire]);

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = timeLeftSeconds > 0 && timeLeftSeconds <= 120;
  const isFinished = timeLeftSeconds === 0;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.6rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: isFinished
          ? 'rgba(59, 130, 246, 0.12)'
          : isUrgent
          ? 'rgba(245, 158, 11, 0.15)'
          : 'rgba(16, 185, 129, 0.12)',
        border: `1px solid ${
          isFinished
            ? 'rgba(59, 130, 246, 0.3)'
            : isUrgent
            ? 'rgba(245, 158, 11, 0.4)'
            : 'rgba(16, 185, 129, 0.3)'
        }`,
      }}
    >
      <Clock
        size={18}
        color={
          isFinished
            ? '#60A5FA'
            : isUrgent
            ? '#FBBF24'
            : '#34D399'
        }
      />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.4rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          color: isFinished
            ? '#60A5FA'
            : isUrgent
            ? '#FBBF24'
            : '#34D399',
        }}
      >
        {isFinished ? 'Completing...' : formatted}
      </span>
    </div>
  );
};

export default CountdownTimer;
