import React from 'react';

export default function InputGroup({ label, value, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{
        color: '#4A5568', fontSize: '0.62rem', fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        {label}
      </label>
      <input
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '9px 12px',
          borderRadius: '10px',
          color: disabled ? '#374151' : '#E2E8F0',
          fontSize: '0.87rem',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s, background 0.2s',
        }}
        onFocus={e => !disabled && (e.target.style.borderColor = 'rgba(0,229,255,0.45)')}
        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
      />
    </div>
  );
}
