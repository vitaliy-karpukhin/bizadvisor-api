import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import LangSwitcher from './LangSwitcher.jsx'
import { UIIcons } from './Icons.jsx'
import api from '../api/client'

const TYPE_COLOR = { success: '#68D391', warning: '#F6AD55', info: '#00E5FF' }

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)  return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  return `${Math.floor(diff / 86400)} д назад`
}

function NotificationPanel({ onClose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications')
      .then(r => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const markRead = async (id) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await api.patch(`/notifications/${id}/read`).catch(() => {})
  }

  const markAllRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, is_read: true })))
    await api.patch('/notifications/read-all').catch(() => {})
  }

  const clearAll = async () => {
    setItems([])
    await api.delete('/notifications/clear').catch(() => {})
  }

  const unread = items.filter(n => !n.is_read).length

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 12px)', right: 0,
      width: '340px', background: '#151B28', border: '1px solid #1E2530',
      borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      zIndex: 100, overflow: 'hidden',
    }}>
      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #1E2530' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#E2E8F0', fontWeight: '700', fontSize: '0.9rem' }}>Уведомления</span>
          {unread > 0 && (
            <span style={{ background: '#FF2D55', color: '#fff', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '700', padding: '2px 7px' }}>{unread}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#00E5FF', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer' }}>
              Прочитать все
            </button>
          )}
          {items.length > 0 && (
            <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#4A5568', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer' }}>
              Очистить
            </button>
          )}
        </div>
      </div>

      {/* Список */}
      <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#4A5568', fontSize: '0.82rem' }}>Загрузка...</div>
        )}
        {!loading && items.length === 0 && (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔔</div>
            <div style={{ color: '#4A5568', fontSize: '0.82rem' }}>Уведомлений пока нет</div>
          </div>
        )}
        {!loading && items.map(n => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            style={{
              display: 'flex', gap: '12px', padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: n.is_read ? 'transparent' : 'rgba(0,229,255,0.03)',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(0,229,255,0.03)'}
          >
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '5px',
              background: n.is_read ? 'transparent' : TYPE_COLOR[n.type] || '#00E5FF',
            }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#E2E8F0', fontSize: '0.82rem', fontWeight: '600', marginBottom: '2px' }}>{n.title}</div>
              <div style={{ color: '#6B7280', fontSize: '0.75rem', lineHeight: '1.4' }}>{n.body}</div>
              <div style={{ color: '#4A5568', fontSize: '0.68rem', marginTop: '4px' }}>{timeAgo(n.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Header({ showProfile = true, onMenuClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [userData, setUserData] = useState(null)
  const [showNotif, setShowNotif] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const bellRef = useRef(null)

  const getPageTitle = (path) => {
    if (path.includes('/finances'))     return 'Финансы'
    if (path.includes('/analytics'))    return 'Анализ'
    if (path.includes('/dashboard'))    return 'Главная'
    if (path.includes('/ai-chat'))      return 'AI Чат'
    if (path.includes('/calendar'))     return 'Календарь'
    if (path.includes('/profile'))      return 'Профиль'
    if (path.includes('/documents'))    return 'Документы'
    if (path.includes('/transactions')) return 'Транзакции'
    return 'TrueVision'
  }

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('user')
      if (stored) {
        try { setUserData(JSON.parse(stored)) } catch {}
      }
    }
    loadUser()
    window.addEventListener('storage', loadUser)
    return () => window.removeEventListener('storage', loadUser)
  }, [])

  useEffect(() => {
    const fetchUnread = () => {
      api.get('/notifications').then(r => {
        setUnreadCount(r.data.filter(n => !n.is_read).length)
      }).catch(() => {})
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const firstName = userData?.first_name || 'Vitalii'
  const lastName  = userData?.last_name  || 'Karpukhin'
  const role      = userData?.role === 'user' ? 'Premium Plan' : (userData?.role || 'Premium Plan')
  const avatar    = userData?.avatar_url
  const initials  = `${firstName[0] || 'V'}${lastName[0] || 'K'}`.toUpperCase()

  return (
    <header style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 2rem 0 1.5rem', height: 'var(--header-h)', width: '100%',
      background: '#04080F', borderBottom: '1px solid #1E2530',
      boxSizing: 'border-box', zIndex: 10,
    }}>
      {/* ЛЕВАЯ ЧАСТЬ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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

      {/* ПРАВАЯ ЧАСТЬ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div className="header-lang"><LangSwitcher /></div>

        {showProfile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

            {/* КОЛОКОЛЬЧИК */}
            <div ref={bellRef} style={{ position: 'relative' }}>
              <div
                onClick={() => setShowNotif(v => !v)}
                style={{ cursor: 'pointer', color: showNotif ? '#00E5FF' : '#6B7280', position: 'relative', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
              >
                <UIIcons.Bell />
                {unreadCount > 0 && (
                  <div style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    width: '7px', height: '7px', background: '#FF2D55',
                    borderRadius: '50%', border: '2px solid #04080F',
                  }} />
                )}
              </div>
              {showNotif && (
                <NotificationPanel onClose={() => setShowNotif(false)} />
              )}
            </div>

            <div className="header-divider" style={{ width: '1px', height: '24px', background: '#1E2530' }} />

            {/* ПРОФИЛЬ */}
            <div
              onClick={() => navigate('/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
            >
              <div style={{
                width: '40px', height: '40px', background: '#111827', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600, fontSize: '0.8rem', color: '#00E5FF',
                border: '1px solid #1E2530', overflow: 'hidden', flexShrink: 0,
              }}>
                {avatar ? (
                  <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
                ) : null}
                <span style={{ display: avatar ? 'none' : 'block' }}>{initials}</span>
              </div>

              <div className="header-name-block" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', lineHeight: '1.2' }}>
                  {firstName} {lastName}
                </div>
                <div className="header-role" style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
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
