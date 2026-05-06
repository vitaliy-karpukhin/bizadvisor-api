import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../../context/LangContext.jsx';
import { PROFILE_T } from '../../locales/profile/translations';
import { s } from './styles';
import InputGroup from './InputGroup.jsx';
import SuccessOverlay from '../../components/SuccessOverlay.jsx';

export default function Profile() {
  const { lang } = useLang();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [user, setUser] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    avatar_url: '',
    company: { name: '', position: '', tax_id: '' }
  });

  const t = PROFILE_T[lang] || PROFILE_T.ru;
  const getAuthToken = () => localStorage.getItem('access_token') || localStorage.getItem('token');

  const triggerSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const syncUserWithStorage = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('storage'));
  };

  const updateField = (field, value) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  const updateCompanyField = (field, value) => {
    setUser(prev => ({
      ...prev,
      company: { ...prev.company, [field]: value }
    }));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getAuthToken();
      if (!token) { setLoading(false); return; }
      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const fullUser = {
            ...data,
            company: data.company || { name: '', position: '', tax_id: '' }
          };
          setUser(fullUser);
          syncUserWithStorage(fullUser);
        }
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAvatarClick = () => fileInputRef.current.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif');

    if (isHEIC) {
      alert(lang === 'ru'
        ? 'Формат HEIC не поддерживается браузером. Пожалуйста, используйте JPG или PNG.'
        : 'HEIC format is not supported by the browser. Please use JPG or PNG.');
      return;
    }

    const token = getAuthToken();
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = { ...user, avatar_url: data.avatar_url };
        setUser(updatedUser);
        syncUserWithStorage(updatedUser);
        triggerSuccess();
      } else {
        const err = await response.json();
        alert(err.detail || 'Error uploading file');
      }
    } catch (e) {
      console.error("Upload error:", e);
      alert('Network error during upload');
    }
  };

  const handleSave = async () => {
    const token = getAuthToken();
    if (!token) return;

    const updateData = {
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      company: {
        name: user.company?.name,
        position: user.company?.position,
        tax_id: user.company?.tax_id
      }
    };

    try {
      const response = await fetch('/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const savedUser = await response.json();
        syncUserWithStorage(savedUser);
        triggerSuccess();
      } else {
        const err = await response.json();
        console.error("Server error details:", err);
      }
    } catch (e) {
      console.error("Update error:", e);
    }
  };

  if (loading) return null;

  return (
    <div style={s.container}>
      <div style={s.card}>

        {/* ── Hero ── */}
        <div style={s.hero}>
          <div style={s.avatarWrap} onClick={handleAvatarClick}>
            <div style={s.avatar}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt="avatar" style={s.avatarImg} />
                : (user.first_name?.[0] || 'U').toUpperCase()
              }
            </div>
            <SuccessOverlay show={showSuccess} style={{ position: 'absolute', bottom: '-8px', right: '-8px' }} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
              {user.first_name || 'User'} {user.last_name || ''}
            </div>
            <div style={{ color: '#4A5568', fontSize: '0.75rem', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <button
              onClick={handleAvatarClick}
              style={{ marginTop: '7px', background: 'none', border: 'none', color: '#00E5FF', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              {lang === 'de' ? 'Foto ändern' : 'Сменить фото'}
            </button>
          </div>
        </div>

        {/* ── Form ── */}
        <div style={s.body}>

          <div style={s.sectionLabel}>{lang === 'de' ? 'Persönliche Daten' : 'Личные данные'}</div>
          <div style={s.grid}>
            <InputGroup label={t.name}    value={user.first_name} onChange={v => updateField('first_name', v)} />
            <InputGroup label={t.surname} value={user.last_name}  onChange={v => updateField('last_name', v)} />
            <InputGroup label="Email"     value={user.email}      disabled />
            <InputGroup label="Phone"     value={user.phone}      onChange={v => updateField('phone', v)} />
          </div>

          <div style={s.divider} />
          <div style={s.sectionLabel}>{t.biz}</div>
          <div style={s.grid}>
            <InputGroup label={t.company}  value={user.company?.name}     onChange={v => updateCompanyField('name', v)} />
            <InputGroup label={t.position} value={user.company?.position} onChange={v => updateCompanyField('position', v)} />
            <div style={{ gridColumn: '1 / span 2' }}>
              <InputGroup label={t.tax_id} value={user.company?.tax_id}   onChange={v => updateCompanyField('tax_id', v)} />
            </div>
          </div>

          <button onClick={handleSave} style={s.saveBtn}>{t.save}</button>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/jpeg,image/png,image/webp" />
      </div>
    </div>
  );
}