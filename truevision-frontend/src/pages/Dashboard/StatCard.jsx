import React, { useState } from 'react';

export default function StatCard({ title, value, change, trend, desc, onClick }) {
  const [hovered, setHovered] = useState(false);
  const clickable = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => clickable && setHovered(true)}
      onMouseLeave={() => clickable && setHovered(false)}
      style={{
        background: '#151B28', padding: '1rem 1.2rem', borderRadius: '20px',
        border: `1px solid ${hovered ? '#00E5FF55' : '#1E2530'}`,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'border-color 0.2s, transform 0.15s',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.2rem' }}>{value}</div>
      <div style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {change && <span style={{ color: trend === 'up' ? '#00E5FF' : '#FF2D55', fontWeight: 700 }}>{change}</span>}
        <span style={{ color: '#4A5568' }}>{desc}</span>
      </div>
    </div>
  );
}