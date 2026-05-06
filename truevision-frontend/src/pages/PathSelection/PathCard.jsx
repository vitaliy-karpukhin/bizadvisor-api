import React from 'react';

const cardStyle = (isActive) => ({
  background: '#0B0F17',
  border: `1px solid ${isActive ? '#00E5FF' : 'rgba(255, 255, 255, 0.05)'}`,
  borderRadius: '24px',
  padding: '32px',
  cursor: 'pointer',
  flex: 1,
  transition: '0.3s ease',
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left'
});

const iconBoxStyle = {
  width: '48px',
  height: '48px',
  background: 'rgba(0, 229, 255, 0.1)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '24px'
};

export default function PathCard({ num, title, desc, action, onClick, isLoading, type }) {
  return (
    <div onClick={onClick} style={cardStyle(isLoading)} className="path-card">
      <div style={iconBoxStyle} className="path-card-icon">
        {type === 'employee' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2">
            <rect x="3" y="7" width="18" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2">
            <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21v-4a3 3 0 0 1 6 0v4" />
          </svg>
        )}
      </div>

      <div className="path-card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="path-badges" style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700,
            background: 'rgba(0, 229, 255, 0.1)', color: '#00E5FF',
            padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase'
          }}>
            Вариант {num}
          </span>
          <span style={{ color: '#4B5563', fontSize: '0.75rem' }}>Шаг {num}/2</span>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px' }}>{title}</h2>
        <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>{desc}</p>

        <div style={{ color: '#00E5FF', fontWeight: 600, fontSize: '0.9rem', marginTop: 'auto', display: 'flex', alignItems: 'center' }}>
          {action} <span style={{ marginLeft: '8px' }}>→</span>
        </div>
      </div>
    </div>
  );
}