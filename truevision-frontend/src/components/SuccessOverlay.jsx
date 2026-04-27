import React from 'react';

// Стили для самой анимированной галочки
const tickStyles = {
  // Контейнер галочки (теперь он маленький)
  checkmark: {
    width: '40px', // Уменьшили размер для размещения у фото
    height: '40px',
    borderRadius: '50%',
    display: 'block',
    strokeWidth: '4',
    stroke: '#0B0F17', // Цвет самой линии галочки (темный)
    // Анимация заливки бирюзовым цветом
    animation: 'fillTick .4s ease-in-out .4s forwards, scaleTick .3s ease-in-out .9s both',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)', // Тень для объема
  },
  // Круг внутри SVG
  checkmarkCircle: {
    strokeDasharray: '166',
    strokeDashoffset: '166',
    strokeWidth: '2',
    strokeMiterlimit: '10',
    stroke: '#00E5FF', // Бирюзовый цвет круга
    fill: 'none',
    animation: 'strokeTick 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards'
  },
  // Линия галочки внутри SVG
  checkmarkCheck: {
    transformOrigin: '50% 50%',
    strokeDasharray: '48',
    strokeDashoffset: '48',
    animation: 'strokeTick 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards'
  }
};

// Принимаем style как пропс для позиционирования (например, { top: 0, right: 0 })
export default function SuccessOverlay({ show, style }) {
  if (!show) return null;

  return (
    <div style={{
      position: 'absolute',
      zIndex: 10,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      // Плавно появляемся
      animation: 'fadeInTick 0.3s ease-out forwards',
      ...style // Накладываем внешние стили позиционирования
    }}>
      {/* CSS Анимации (переименованы, чтобы не конфликтовать со старыми) */}
      <style>{`
        @keyframes strokeTick { 100% { stroke-dashoffset: 0; } }
        @keyframes scaleTick { 0%, 100% { transform: none; } 50% { transform: scale3d(1.1, 1.1, 1); } }
        @keyframes fillTick { 100% { box-shadow: inset 0px 0px 0px 40px #00E5FF; } }
        @keyframes fadeInTick { from { opacity: 0; transform: translate(0, 10px); } to { opacity: 1; transform: translate(0, 0); } }
      `}</style>

      <svg style={tickStyles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle style={tickStyles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
        <path style={tickStyles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
    </div>
  );
}