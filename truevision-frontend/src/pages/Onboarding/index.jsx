import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext.jsx';
import Header from '../../components/Header.jsx';
import OnboardingCard from './OnboardingCard.jsx';
import { ONBOARDING_T } from '../../locales/onboarding/translations';
import { s } from './styles';

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
    <div style={s.container}>
      <Header showProfile={false} />

      <main style={s.main}>
        {/* Индикатор этапа */}
        <div style={s.stepIndicator}>
          <div style={s.barContainer}>
            {/* Предполагаю, что s.bar — это функция в твоих стилях */}
            <div style={s.bar(userPath === 'employee')} />
            <div style={s.bar(userPath === 'business')} />
          </div>
          <span style={s.stepLabel}>{current.step}</span>
        </div>

        <div style={{ marginBottom: '2.5rem', flexShrink: 0 }}>
          <h1 style={s.title}>{current.title}</h1>
          <p style={s.subtitle}>{current.subtitle}</p>
        </div>

        {/* Сетка карточек */}
        <div style={s.grid}>
          {current.cards.map((card, idx) => (
            <OnboardingCard
              key={idx}
              title={card.title}
              iconId={card.iconId}
              features={card.features}
            />
          ))}
        </div>

        <div style={s.footer}>
          <button onClick={finishOnboarding} style={s.nextBtn}>
            {t.btn}
          </button>
        </div>
      </main>
    </div>
  );
}