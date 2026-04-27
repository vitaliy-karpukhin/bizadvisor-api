import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import LangSwitcher from './LangSwitcher.jsx'
import { UIIcons } from './Icons.jsx'

export default function Header({ showProfile = true, onMenuClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [userData, setUserData] = useState(null)

  // Маппинг для определения заголовка на основе URL
  const getPageTitle = (path) => {
    if (path.includes('/income')) return 'Доходы';
    if (path.includes('/analytics')) return 'Анализ';
    if (path.includes('/dashboard')) return 'Главная';
    if (path.includes('/ai-chat')) return 'AI Чат';
    if (path.includes('/calendar')) return 'Календарь';
    if (path.includes('/profile')) return 'Профиль';
    if (path.includes('/documents')) return 'Документы';
    if (path.includes('/expenses'))     return 'Расходы';
    if (path.includes('/transactions')) return 'Транзакции';
    return 'TrueVision';
  };

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('user')
      if (stored) {
        try {
          setUserData(JSON.parse(stored))
        } catch (e) {
          console.error("Ошибка парсинга пользователя:", e)
        }
      }
    }

    loadUser()
    window.addEventListener('storage', loadUser)
    return () => window.removeEventListener('storage', loadUser)
  }, [])

  const firstName = userData?.first_name || 'Vitalii'
  const lastName = userData?.last_name || 'Karpukhin'
  const role = userData?.role === 'user' ? 'Premium Plan' : (userData?.role || 'Premium Plan')
  const avatar = userData?.avatar_url
  const initials = `${firstName[0] || 'V'}${lastName[0] || 'K'}`.toUpperCase()

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 2rem 0 1.5rem',
      height: 'var(--header-h)',
      width: '100%',
      background: '#04080F',
      borderBottom: '1px solid #1E2530',
      boxSizing: 'border-box',
      zIndex: 10
    }}>

      {/* ЛЕВАЯ ЧАСТЬ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Гамбургер — виден только на мобильном через CSS */}
        <button
          onClick={onMenuClick}
          className="hamburger-btn"
          style={{ display: 'none', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
          aria-label="Menu"
        >
          <UIIcons.Menu />
        </button>
        <h2 style={{ fontSize: '1.2rem', color: '#FFFFFF', fontWeight: 700, margin: 0 }}>
          {getPageTitle(location.pathname)}
        </h2>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: Инструменты и профиль */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

        <LangSwitcher />

        {showProfile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

            {/* УВЕДОМЛЕНИЯ */}
            <div style={{ cursor: 'pointer', color: '#6B7280', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <UIIcons.Bell />
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '7px',
                height: '7px',
                background: '#FF2D55',
                borderRadius: '50%',
                border: '2px solid #04080F'
              }} />
            </div>

            <div style={{ width: '1px', height: '24px', background: '#1E2530' }} />

            {/* БЛОК ПРОФИЛЯ */}
            <div
              onClick={() => navigate('/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: '#111827',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.8rem',
                color: '#00E5FF',
                border: '1px solid #1E2530',
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                  />
                ) : null}
                <span style={{ display: avatar ? 'none' : 'block' }}>
                  {initials}
                </span>
              </div>

              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', lineHeight: '1.2' }}>
                  {firstName} {lastName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                  {role}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}