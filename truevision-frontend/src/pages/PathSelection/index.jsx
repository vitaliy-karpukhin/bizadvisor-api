import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext.jsx';
import Header from '../../components/Header.jsx';
import PathCard from './PathCard.jsx';
import api from '../../api/client.js';
import { PATH_T } from '../../locales/pathSelection/translations';
import { s } from './styles';
import './path-selection.css';

export default function PathSelection() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const t = PATH_T[lang] || PATH_T.ru;

  useEffect(() => {
    const savedPath = localStorage.getItem('user_path');
    const isOnboarded = localStorage.getItem('is_onboarded') === 'true';

    if (savedPath) {
      // Если путь есть, но онбординг не пройден — шлем на онбординг
      if (!isOnboarded) {
        navigate('/onboarding', { replace: true });
      } else {
        // Если всё пройдено — на дашборд
        navigate('/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  const handleSelect = async (pathType) => {
    setLoading(pathType);
    try {
      // 1. Отправляем на бэкенд
      await api.post('/auth/set-path', { path: pathType });

      // 2. Сохраняем путь в localStorage
      localStorage.setItem('user_path', pathType);

      // 3. !!! ГЛАВНОЕ ИЗМЕНЕНИЕ !!!
      // Теперь мы шлем юзера НЕ на дашборд, а на ОНБОРДИНГ
      navigate('/onboarding', { replace: true });

    } catch (err) {
      console.error("Ошибка сохранения:", err);
      // Даже если бэкенд упал, сохраняем локально и ведем на онбординг
      localStorage.setItem('user_path', pathType);
      navigate('/onboarding', { replace: true });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={s.container}>
      <Header showProfile={false} />
      <main style={s.main} className="path-main">
        <div style={s.headerBox} className="path-header">
          <h1 style={s.title} className="path-title">{t.title}</h1>
          <p style={s.subtitle} className="path-subtitle">{t.subtitle}</p>
        </div>
        <div style={s.grid} className="path-grid">
          <PathCard
            num={1}
            type="employee"
            title={t.employee}
            desc={t.employeeDesc}
            action={t.action}
            onClick={() => handleSelect('employee')}
            isLoading={loading === 'employee'}
          />
          <PathCard
            num={2}
            type="business"
            title={t.business}
            desc={t.businessDesc}
            action={t.action}
            onClick={() => handleSelect('business')}
            isLoading={loading === 'business'}
          />
        </div>
      </main>
    </div>
  );
}