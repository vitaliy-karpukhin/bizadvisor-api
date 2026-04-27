import React from 'react';

export default function LoginFeature({ Icon, title, desc }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      padding: '1.2rem',
      borderRadius: '18px',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{marginBottom: '0.6rem'}}><Icon /></div>
      <div style={{fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px', color: '#fff'}}>{title}</div>
      <div style={{fontSize: '0.75rem', color: '#4B5563', lineHeight: '1.4'}}>{desc}</div>
    </div>
  );
}