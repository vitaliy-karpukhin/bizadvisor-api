import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext.jsx'

import Logo from '../../components/Logo.jsx'
import api from '../../api/client.js'
import { AuthIcons } from '../../components/Icons.jsx'
import LangSwitcher from '../../components/LangSwitcher.jsx'
import { s } from './styles'
import './login.css'

const Feature = ({ Icon, title, desc }) => (
  <div style={s.featureCard} className="auth-feature-card">
    <div style={{ marginBottom: '0.6rem' }}>
      <Icon style={{ stroke: '#00E5FF' }} />
    </div>
    <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>{title}</div>
    <div style={{ fontSize: '0.75rem', color: '#4B5563', lineHeight: '1.4' }}>{desc}</div>
  </div>
)

export default function Login() {
  const navigate = useNavigate()
  const { lang } = useLang()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Ошибки под полями
  const [error, setError] = useState('')

  // Состояние для кастомного уведомления (только для успеха)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type }), 3000)
  }

  // Сброс ошибок при переключении между Входом и Регистрацией
  useEffect(() => {
    setError('')
  }, [isLogin])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedPath = localStorage.getItem('user_path')
    const isOnboarded = localStorage.getItem('is_onboarded') === 'true'

    if (token) {
      if (!savedPath) {
        navigate('/path-selection', { replace: true })
      } else if (!isOnboarded) {
        navigate('/onboarding', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [navigate])

  const t = {
    ru: {
      welcome: 'Добро пожаловать в',
      system: 'вашу финансовую систему',
      h2: isLogin ? 'Войдите в аккаунт' : 'Регистрация',
      sub: isLogin ? 'Введите данные для входа' : 'Создайте новый профиль',
      btn: isLogin ? 'Войти' : 'Создать аккаунт',
      footer: isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?',
      action: isLogin ? 'Зарегистрироваться' : 'Войти',
      passMismatch: "Пароли не совпадают!"
    },
    de: {
      welcome: 'Willkommen in',
      system: 'Ihrem Finanzsystem',
      h2: isLogin ? 'Anmeldung' : 'Registrierung',
      sub: isLogin ? 'Zugangsdaten eingeben' : 'Konto erstellen',
      btn: isLogin ? 'Anmelden' : 'Registrieren',
      footer: isLogin ? 'Kein Konto?' : 'Haben Sie ein Konto?',
      action: isLogin ? 'Registrieren' : 'Anmelden',
      passMismatch: "Passwörter stimmen nicht überein!"
    }
  }[lang || 'ru']

  const handleAuth = async (e) => {
    if (e) e.preventDefault()
    setError('') // Сбрасываем старую ошибку

    if (!isLogin && password !== confirmPassword) {
      setError(t.passMismatch)
      return
    }

    setLoading(true)
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const res = await api.post(endpoint, { email: email.trim().toLowerCase(), password })

      if (isLogin) {
        localStorage.setItem('token', res.data.access_token)
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user))
          const serverPath = res.data.user.path
          if (serverPath) {
            localStorage.setItem('user_path', serverPath)
            localStorage.setItem('is_onboarded', 'true')
            navigate('/dashboard', { replace: true })
          } else {
            navigate('/path-selection', { replace: true })
          }
        }
      } else {
        showToast(
          lang === 'ru'
            ? 'Регистрация успешна! Перейдите в почту для подтверждения.'
            : 'Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mails zur Bestätigung.',
          'success'
        )
        setIsLogin(true)
        setConfirmPassword('')
        setPassword('')
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail) ? detail[0].msg : detail || 'Error'
      // Вместо Toast выводим ошибку под кнопкой/полями
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.wrapper} className="auth-wrapper">
      {/* Toast только для успеха */}
      <div style={{
        ...s.toast,
        ...(notification.show ? s.toastVisible : {}),
        backgroundColor: '#00E5FF'
      }}>
        {notification.message}
      </div>

      {/* Мобильный хедер — только на маленьких экранах */}
      <div className="auth-mobile-header">
        <Logo />
        <LangSwitcher />
      </div>

      <div style={s.left} className="auth-left">
        <div style={{ marginBottom: 'auto' }}><Logo /></div>
        <div style={{ marginBottom: 'auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '10px' }}>
            {t.welcome} <br /><span style={{ color: '#00E5FF' }}>{t.system}</span>
          </h1>
          <p style={{ color: '#6B7280', marginBottom: '2rem' }}>Контроль. Рост. Уверенность.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '550px' }} className="auth-features-grid">
            <Feature Icon={AuthIcons.Secure} title="Secure" desc="Bank-grade encryption" />
            <Feature Icon={AuthIcons.Growth} title="Growth" desc="Predictive analytics" />
            <Feature Icon={AuthIcons.Fast} title="Fast" desc="Real-time synchronization" />
            <Feature Icon={AuthIcons.Global} title="Global" desc="Multi-currency support" />
          </div>
        </div>
      </div>

      <div style={s.right} className="auth-right">
        <div style={{ position: 'absolute', top: '20px', right: '40px', zIndex: 100 }} className="lang-switcher-wrap">
          <LangSwitcher />
        </div>

        <div style={s.formContainer}>
          <div className="auth-mobile-logo" style={{ display: 'none' }}>
            <Logo />
          </div>
          <form onSubmit={handleAuth}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>{t.h2}</h2>
            <p style={{ color: '#6B7280', marginBottom: '2rem' }}>{t.sub}</p>

            <div style={s.inputGroup}>
              <label style={s.label}>Email</label>
              <input
                style={s.input}
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@mail.com"
              />
            </div>

            <div style={s.inputGroup}>
              <label style={s.label}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={s.input}
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  <AuthIcons.Eye hidden={!showPassword} />
                </button>
              </div>
            </div>

            {!isLogin && (
              <div style={s.inputGroup}>
                <label style={s.label}>Подтвердите пароль</label>
                <input
                  style={s.input}
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {/* ВЫВОД ОШИБКИ ПОД ПОЛЯМИ */}
            {error && (
              <div style={{
                color: '#FF4B4B',
                fontSize: '0.8rem',
                marginTop: '-0.5rem',
                marginBottom: '1rem',
                textAlign: 'left',
                fontWeight: '500'
              }}>
                {error}
              </div>
            )}

            <button type="submit" style={s.mainBtn} disabled={loading}>
              {loading ? <span className="btn-spinner" /> : t.btn}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6B7280' }}>
              {t.footer}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00E5FF',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginLeft: '6px'
                }}
              >
                {t.action}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}