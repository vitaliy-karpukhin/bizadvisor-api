import React from 'react';
import { s } from './styles';

// Вспомогательная функция для стилей уведомлений
const getNotifyStyle = (type) => {
  switch(type) {
    case 'error': return { bg: 'rgba(255, 45, 85, 0.1)', color: '#FF2D55', icon: '!' };
    case 'warning': return { bg: 'rgba(255, 204, 0, 0.1)', color: '#FFCC00', icon: '💡' };
    case 'success': return { bg: 'rgba(52, 211, 153, 0.1)', color: '#34D399', icon: '⚡' };
    default: return { bg: '#1E2530', color: '#6B7280', icon: '•' };
  }
};

// ЭКСПОРТ 1: Карточки уведомлений
export function NotificationItem({ type, title, text, time }) {
  const style = getNotifyStyle(type);
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem' }}>
      <div style={{
        minWidth: '40px', height: '40px', borderRadius: '12px',
        background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ color: style.color, fontWeight: 800 }}>{style.icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white', maxWidth: '180px' }}>{title}</div>
          <div style={{ color: '#4A5568', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{time}</div>
        </div>
        <div style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: '4px', lineHeight: '1.4' }}>{text}</div>
      </div>
    </div>
  );
}

// ЭКСПОРТ 2: Карточки статистики (ТО, ЧЕГО НЕ ХВАТАЛО)
export function StatCard({ title, value, change, trend, desc }) {
  return (
    <div style={s.statCard}>
      <div style={{ color: '#6B7280', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '4px' }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>{value}</div>
        {change && (
          <span style={{ fontSize: '0.65rem', color: trend === 'up' ? '#00E5FF' : '#FF2D55', fontWeight: 700 }}>
            {change}
          </span>
        )}
      </div>
      {desc && <div style={{ color: '#4A5568', fontSize: '0.65rem', marginTop: '2px' }}>{desc}</div>}
    </div>
  );
}