import React from 'react';

export default function NotificationItem({ type, title, text, time }) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '1.2rem' }}>
       <div style={{
         minWidth: '32px', height: '32px', borderRadius: '10px',
         background: type === 'error' ? 'rgba(255, 45, 85, 0.1)' : 'rgba(0, 229, 255, 0.1)',
         display: 'flex', alignItems: 'center', justifyContent: 'center'
       }}>
         <span style={{ color: type === 'error' ? '#FF2D55' : '#00E5FF', fontWeight: 'bold' }}>!</span>
       </div>
       <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
             <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</div>
             <div style={{ color: '#4A5568', fontSize: '0.7rem' }}>{time}</div>
          </div>
          <div style={{ color: '#6B7280', fontSize: '0.8rem', lineHeight: '1.3' }}>{text}</div>
       </div>
    </div>
  );
}