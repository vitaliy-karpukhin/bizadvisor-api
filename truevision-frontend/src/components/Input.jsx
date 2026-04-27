import React, { useState } from 'react'

export default function Input({ label, type = 'text', placeholder, value, onChange, error, hint }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div style={{ marginBottom: '1.1rem', textAlign: 'left' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            width: '100%', background: 'var(--bg-input)',
            border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
            borderRadius: 10, padding: isPassword ? '0.75rem 2.8rem 0.75rem 1rem' : '0.75rem 1rem',
            fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
          }}
        />
        {isPassword && (
          <span
            onClick={() => setShow(!show)}
            style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            {show ? '👁️' : '🔒'}
          </span>
        )}
      </div>
    </div>
  )
}