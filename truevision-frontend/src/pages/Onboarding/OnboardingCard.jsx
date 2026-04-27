import React from 'react';

const ICONS = {
  chart: <path d="M23 6l-9.5 9.5-5-5L1 18" />,
  stats: <path d="M12 20V10M18 20V4M6 20v-4" />,
  business: <rect x="2" y="7" width="20" height="14" rx="2" />,
  grow: <path d="M3 3v18h18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </>
  ),
  office: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
    </>
  )
};

export default function OnboardingCard({ title, iconId, features }) {
  return (
    <div style={{
      background: '#111827',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '24px',
      padding: '1.5rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0
    }}>
      <div style={{
        width: '48px', height: '48px',
        background: 'rgba(0, 229, 255, 0.1)',
        borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1rem', flexShrink: 0
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[iconId] || <circle cx="12" cy="12" r="10" />} {/* Фолбек на круг, если ID не найден */}
        </svg>
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.8rem' }}>{title}</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
        {features.map((f, idx) => (
          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#9CA3AF', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
             <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '3px' }}>
              <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4.5L3.5 7L9 1" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}