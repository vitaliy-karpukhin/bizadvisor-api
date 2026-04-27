import React from 'react';

export default function InputGroup({ label, value, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled}
        style={{
          background: '#0B0F17',
          border: '1px solid #1E2530',
          padding: '12px 14px',
          borderRadius: '12px',
          color: disabled ? '#4B5563' : 'white',
          fontSize: '0.9rem',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => !disabled && (e.target.style.borderColor = '#00E5FF')}
        onBlur={(e) => (e.target.style.borderColor = '#1E2530')}
      />
    </div>
  );
}