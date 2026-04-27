import React from 'react';
import { useLang } from '../context/LangContext.jsx';
import { AuthIcons } from './Icons.jsx'; // Проверь путь к файлу с иконками

export default function LangSwitcher() {
  const { lang, switchLang } = useLang();

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      // РАМКА И ОБЩИЙ СТИЛЬ (как в хедере на скриншоте)
      border: '1px solid #1E2530',
      borderRadius: '20px',
      padding: '4px 12px',
      background: 'rgba(255, 255, 255, 0.03)',
      userSelect: 'none',
      transition: 'all 0.2s ease'
    }}>

      {/* ГЛОБУС (Всегда бирюзовый) */}
      <div className="lang-icon-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
        <AuthIcons.Global />
      </div>

      {/* ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКОВ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {['ru', 'de'].map((l, i) => (
          <React.Fragment key={l}>
            <span
              onClick={() => switchLang(l)}
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                color: lang === l ? '#FFFFFF' : '#6B7280',
                transition: 'color 0.2s ease'
              }}
            >
              {l.toUpperCase()}
            </span>
            {/* Разделитель между RU и DE */}
            {i === 0 && <span style={{ color: '#1E2530', fontSize: '0.85rem' }}>|</span>}
          </React.Fragment>
        ))}
      </div>

      {/* CSS-костыль для принудительной покраски SVG глобуса */}
      <style>{`
        .lang-icon-wrapper svg {
          stroke: #00E5FF !important;
          width: 16px;
          height: 16px;
        }
      `}</style>
    </div>
  );
}