import React from 'react'
import { s } from './styles'

export const StatBox = ({ val, lab }) => (
  <div style={s.statBox}>
    <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px', color: '#FFFFFF' }}>{val}</div>
    <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lab}</div>
  </div>
)

export const NewsRow = ({ label, color }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#111827',
    borderRadius: '12px',
    border: '1px solid #1E2530',
    marginBottom: '8px'
  }}>
    <span style={{ fontSize: '0.85rem', color: '#FFFFFF' }}>{label}</span>
    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
  </div>
)

export const Icons = {
  File: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  Trend: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2.5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Chevron: ({ isOpen }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5"
      style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-180deg)', transition: '0.3s' }}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}