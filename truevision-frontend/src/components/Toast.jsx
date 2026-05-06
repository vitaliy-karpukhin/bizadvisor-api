import React, { useEffect } from 'react';

export default function Toast({ message, type = 'error', onClose }) {
  const colors = {
    error:   { border: '#FC8181', text: '#FC8181' },
    success: { border: '#68D391', text: '#68D391' },
    warning: { border: '#F6AD55', text: '#F6AD55' },
    info:    { border: '#00E5FF', text: '#00E5FF' },
  };
  const { border, text } = colors[type] || colors.error;

  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      background: '#1E2530', border: `1px solid ${border}`,
      borderRadius: '12px', padding: '12px 16px',
      color: text, fontSize: '0.82rem', fontWeight: '600',
      zIndex: 2000, maxWidth: '320px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      {message}
    </div>
  );
}
