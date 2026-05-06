import React from 'react';

export default function ConfirmModal({ title = 'Подтвердите действие', message, confirmLabel = 'Удалить', onConfirm, onCancel, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }} onClick={onCancel}>
      <div style={{
        background: '#151B28', border: '1px solid #1E2530', borderRadius: '16px',
        padding: '1.5rem', width: '100%', maxWidth: '340px',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ color: '#E2E8F0', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          {title}
        </div>
        {message && (
          <div style={{ color: '#6B7280', fontSize: '0.82rem', lineHeight: '1.5', marginBottom: children ? '1rem' : '1.5rem' }}>
            {message}
          </div>
        )}
        {children && (
          <div style={{ marginBottom: '1.5rem' }}>{children}</div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '9px', background: 'transparent',
            border: '1px solid #2D3748', borderRadius: '10px',
            color: '#6B7280', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
          }}>Отмена</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '9px', background: '#FC8181',
            border: 'none', borderRadius: '10px',
            color: '#0B0F17', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
