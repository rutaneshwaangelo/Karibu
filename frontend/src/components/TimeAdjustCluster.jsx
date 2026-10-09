import React, { useState } from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';

export const TimeAdjustCluster = ({ onAdjust, disabled }) => {
  const [loadingMinutes, setLoadingMinutes] = useState(null);

  const handleAdjust = async (minutes) => {
    try {
      setLoadingMinutes(minutes);
      await onAdjust(minutes);
    } finally {
      setLoadingMinutes(null);
    }
  };

  const options = [
    { label: '+5 min', value: 5, type: 'plus' },
    { label: '+10 min', value: 10, type: 'plus' },
    { label: '+15 min', value: 15, type: 'plus' },
    { label: '-5 min', value: -5, type: 'minus' },
    { label: '-10 min', value: -10, type: 'minus' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Staff Time Adjustment:
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleAdjust(opt.value)}
            disabled={disabled || loadingMinutes !== null}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              borderColor:
                opt.type === 'plus'
                  ? 'rgba(194, 94, 58, 0.3)'
                  : 'rgba(74, 123, 166, 0.3)',
              color:
                opt.type === 'plus'
                  ? '#A84E2E'
                  : '#35597B',
            }}
          >
            {loadingMinutes === opt.value ? (
              <Loader2 size={14} className="animate-spin" />
            ) : opt.type === 'plus' ? (
              <Plus size={14} />
            ) : (
              <Minus size={14} />
            )}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeAdjustCluster;
