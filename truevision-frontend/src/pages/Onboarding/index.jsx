import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext.jsx';
import Header from '../../components/Header.jsx';
import OnboardingCard from './OnboardingCard.jsx';
import { ONBOARDING_T } from '../../locales/onboarding/translations';
import { s } from './styles';
import './onboarding.css';

export default function Onboarding() {
  const navigate = useNavigate();
  const { lang } = useLang();

  const userPath = localStorage.getItem('user_path') || 'employee';
  const t = ONBOARDING_T[lang] || ONBOARDING_T.ru;
  const current = userPath === 'business' ? t.business : t.employee;

  const finishOnboarding = () => {
    // Устанавливаем именно 'is_onboarded', так как его ждет DashboardGuard в App.jsx
    localStorage.setItem('is_onboarded', 'true');

    // Удаляем временные флаги, если они тебе больше не нужны
    localStorage.removeItem('onboarding_started');

    navigate('/dashboard', { replace: true });
  };

  return (
    <div style={s.container} className="onb-container">
      <Header showProfile={false} />

      <main style={s.main} className="onb-main">
        <div style={s.stepIndicator} className="onb-step-indicator">
          <div style={s.barContainer}>
            <div style={s.bar(userPath === 'employee')} />
            <div style={s.bar(userPath === 'business')} />
          </div>
          <span style={s.stepLabel}>{current.step}</span>
        </div>

        <div style={{ marginBottom: '2.5rem', flexShrink: 0 }} className="onb-header-block">
          <h1 style={s.title} className="onb-title">{current.title}</h1>
          <p style={s.subtitle} className="onb-subtitle">{current.subtitle}</p>
        </div>

        <div style={s.grid} className="onb-grid">
          {current.cards.map((card, idx) => (
            <OnboardingCard
              key={idx}
              title={card.title}
              iconId={card.iconId}
              features={card.features}
            />
          ))}
        </div>

        <div style={s.footer} className="onb-footer">
          <button onClick={finishOnboarding} style={s.nextBtn} className="onb-next-btn">
            {t.btn}
          </button>
        </div>
      </main>
    </div>
  );
}