import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../context/LangContext.jsx'
import Logo from './Logo.jsx'
import { getMenuItems } from '../config/menuConfig.jsx'
import { UIIcons } from './Icons.jsx'

export default function Sidebar({ onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang } = useLang()
  const menuItems = getMenuItems(lang)

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  const s = {
    aside: {
      width: '240px',
      borderRight: '1px solid #1E2530',
      padding: '1.5rem 0 2rem 0',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0B0F17',
      boxSizing: 'border-box',
      overflowY: 'auto',
    },
    nav: {
      flexGrow: 1,
      padding: '0 1rem'
    },
    li: (isActive) => ({
      padding: '12px 16px',
      borderRadius: '12px',
      marginBottom: '8px',
      cursor: 'pointer',
      display: 'flex',
      gap: '14px',
      alignItems: 'center',
      position: 'relative',
      background: isActive ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
      color: isActive ? '#00E5FF' : '#6B7280',
      fontWeight: isActive ? 600 : 500,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }),
    indicator: {
      position: 'absolute',
      left: '-1rem',
      width: '4px',
      height: '20px',
      background: '#00E5FF',
      borderRadius: '0 4px 4px 0'
    },
    logoutSection: {
      marginTop: 'auto',
      padding: '1.5rem 1rem 0 1rem',
      borderTop: '1px solid #1E2530'
    },
    logoutBtn: {
      color: '#6B7280',
      cursor: 'pointer',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      borderRadius: '12px',
      transition: 'all 0.2s ease'
    }
  }

  return (
    <aside style={s.aside}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', padding: '0 1rem 0 1.5rem' }}>
        <Logo />
        {onClose && (
          <button
            onClick={onClose}
            style={{ display: 'none', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '4px' }}
            className="sidebar-close-btn"
            aria-label="Close menu"
          >
            <UIIcons.Close />
          </button>
        )}
      </div>

      <nav style={s.nav}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <li
                key={item.id}
                onClick={() => { navigate(item.path); onClose?.(); }}
                style={s.li(isActive)}
                onMouseEnter={(e) => {
                  if(!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.color = '#FFFFFF'
                  }
                }}
                onMouseLeave={(e) => {
                  if(!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#6B7280'
                  }
                }}
              >
                {isActive && <div style={s.indicator} />}
                {item.icon}
                <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
              </li>
            )
          })}
        </ul>
      </nav>

      <div style={s.logoutSection}>
        <div
          onClick={handleLogout}
          style={s.logoutBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FF4560'
            e.currentTarget.style.background = 'rgba(255, 69, 96, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6B7280'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <UIIcons.Logout />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            {lang === 'ru' ? 'Выйти' : 'Abmelden'}
          </span>
        </div>
      </div>
    </aside>
  )
}