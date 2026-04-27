import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Защитник роутов
 * @param {boolean} requirePath - нужно ли проверять, выбран ли путь (employee/business)
 */
export default function ProtectedRoute({ children, requirePath = true }) {
  const token = localStorage.getItem('token');
  const userPath = localStorage.getItem('user_path');
  const location = useLocation();

  // 1. Если токена нет — отправляем на логин
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Если путь ОБЯЗАТЕЛЕН (для дашборда), но он еще не выбран
  if (requirePath && !userPath) {
    return <Navigate to="/path-selection" replace />;
  }

  // 3. Если мы на странице выбора пути (requirePath=false), но путь УЖЕ есть
  // отправляем на дашборд, чтобы не выбирать повторно
  if (!requirePath && userPath) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}