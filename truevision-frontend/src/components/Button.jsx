import React from 'react'

export default function Button({ children, onClick, variant = 'primary', loading = false, type = 'button', style = {} }) {
  const styles = {
    primary: { background: 'var(--blue)', color: '#fff', border: 'none' },
    secondary: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    teal: { background: 'var(--teal)', color: '#0B0F17', border: 'none' }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%', padding: '0.85rem', borderRadius: 10,
        fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1,
        ...styles[variant], ...style
      }}
    >
      {loading ? 'Загрузка...' : children}
    </button>
  )
}