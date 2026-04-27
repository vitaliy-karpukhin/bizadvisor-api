import React, { useRef } from 'react';

export default function AvatarUpload({ user, onUpload }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
    }
  };

  // Генерируем инициал (первая буква имени или 'U')
  const initial = (user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div style={{ position: 'relative', width: '72px', height: '72px', marginBottom: '1.5rem' }}>
      <div
        onClick={() => fileInputRef.current.click()}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.1)',
          transition: 'all 0.3s ease',
          background: 'linear-gradient(135deg, #00E5FF, #0066FF)',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.querySelector('.overlay').style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.querySelector('.overlay').style.opacity = '0';
        }}
      >
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt="Avatar"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block' // ГАРАНТИРУЕМ ВИДИМОСТЬ
            }}
            onError={(e) => {
              // Если картинка не загрузилась (например, 404), скрываем её и показываем градиент
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <span style={{ fontSize: '1.6rem', fontWeight: '800', color: 'white' }}>
            {initial}
          </span>
        )}

        {/* Оверлей при наведении */}
        <div
          className="overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: '0.2s',
            fontSize: '0.75rem',
            color: 'white',
            fontWeight: '600'
          }}
        >
          Изменить
        </div>
      </div>

      {/* Скрытый инпут */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*"
      />
    </div>
  );
}