import React from 'react';
import { NavIcons } from '../components/Icons.jsx';

export const getMenuItems = (lang) => {
  const isRu = lang === 'ru';

  return [
    { id: 'dashboard',    label: isRu ? 'Главная'      : 'Dashboard',     path: '/dashboard',    icon: <NavIcons.Dashboard /> },
    { id: 'transactions', label: isRu ? 'Транзакции'   : 'Transaktionen', path: '/transactions', icon: <NavIcons.Transactions /> },
    { id: 'income',       label: isRu ? 'Доходы'       : 'Einnahmen',     path: '/income',       icon: <NavIcons.Income /> },
    { id: 'expenses',     label: isRu ? 'Расходы'      : 'Ausgaben',      path: '/expenses',     icon: <NavIcons.Expenses /> },
    { id: 'documents',    label: isRu ? 'Документы'    : 'Dokumente',     path: '/documents',    icon: <NavIcons.Documents /> },
    { id: 'analytics',    label: isRu ? 'Аналитика'    : 'Analyse',       path: '/analytics',    icon: <NavIcons.Analytics /> },
    { id: 'chat',         label: isRu ? 'AI Чат'       : 'AI Assistant',  path: '/ai-chat',      icon: <NavIcons.Chat /> },
    { id: 'calendar',     label: isRu ? 'Календарь'    : 'Kalender',      path: '/calendar',     icon: <NavIcons.Calendar /> },
    { id: 'profile',      label: isRu ? 'Профиль'      : 'Profil',        path: '/profile',      icon: <NavIcons.Profile /> },
  ];
};
