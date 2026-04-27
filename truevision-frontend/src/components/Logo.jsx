import React from 'react';

export default function Logo() {
  return (
    <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <div style={{ display: 'flex', gap: 5 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--teal)', opacity: 0.5 }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--teal)' }} />
      </div>
      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
        True<span style={{ color: 'var(--teal)' }}>Vision</span>
      </span>
    </a>
  );
}