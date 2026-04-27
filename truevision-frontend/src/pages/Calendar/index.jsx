import React from 'react';
import { s } from './styles';

export default function Calendar() {
  return (
    <div style={s.container}>
      <div style={s.placeholderCard}>
        <div style={s.iconWrapper}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
          </svg>
        </div>
        <h2 style={s.title}>Календарь событий</h2>
        <p style={s.text}>Раздел находится в разработке. Здесь будет отображаться график ваших платежей и доходов.</p>
        <div style={s.badge}>Скоро (Coming Soon)</div>
      </div>
    </div>
  );
}