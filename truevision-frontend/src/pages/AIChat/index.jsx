import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/client';
import { s } from './styles';

const Icons = {
  Robot: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4M8 16h.01M16 16h.01" />
    </svg>
  ),
  Send: ({ disabled }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={disabled ? '#374151' : 'currentColor'} strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Stars: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2">
      <path d="M12 3l1.91 5.89h6.19l-5.01 3.64 1.91 5.89-5-3.64-5 3.64 1.91-5.89-5.01-3.64h6.19z" />
    </svg>
  ),
};

const SUGGESTIONS = [
  'Какой у меня доход?',
  'Где больше всего трачу?',
  'Как снизить расходы?',
  'Анализ прибыли',
  'Что такое повторяющиеся платежи?',
];

function TypingIndicator() {
  return (
    <div style={{ ...s.botMsgRow, alignItems: 'center' }}>
      <div style={s.miniAvatar}><Icons.Robot /></div>
      <div style={{ ...s.botBubble, padding: '14px 20px' }}>
        <span style={dotStyle(0)} />
        <span style={dotStyle(1)} />
        <span style={dotStyle(2)} />
      </div>
    </div>
  );
}

function dotStyle(i) {
  return {
    display: 'inline-block',
    width: 7, height: 7,
    borderRadius: '50%',
    background: '#00E5FF',
    margin: '0 3px',
    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
  };
}

export default function AIChat() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Привет! Я ваш финансовый ассистент. Спросите о доходах, расходах или попросите совет по бизнесу.', isBot: true },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;

    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), text: query, isBot: false }]);
    setLoading(true);

    try {
      const res = await api.post('/chat/query', { query });
      setMessages(prev => [...prev, { id: Date.now() + 1, text: res.data.answer, isBot: true }]);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || 'Неизвестная ошибка';
      const status = err?.response?.status;
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: `Ошибка ${status ? `(${status})` : ''}: ${detail}`,
        isBot: true,
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-6px); }
        }
      `}</style>

      <div style={s.container}>
        <div style={s.chatWrapper}>

          {/* Хедер */}
          <div style={s.chatHeader}>
            <div style={s.botAvatar}><Icons.Robot /></div>
            <div style={s.headerInfo}>
              <h3 style={s.botName}>AI Чат</h3>
              <div style={s.statusRow}>
                <span style={s.statusDot} />
                <span style={s.statusText}>Online Assistant</span>
              </div>
            </div>
            <div style={s.poweredBadge}>
              <Icons.Stars />
              <span>Powered by VisionAI</span>
            </div>
          </div>

          {/* Сообщения */}
          <div style={s.messagesArea}>
            {messages.map((msg) => (
              <div key={msg.id} style={msg.isBot ? s.botMsgRow : s.userMsgRow}>
                {msg.isBot && <div style={s.miniAvatar}><Icons.Robot /></div>}
                <div style={
                  msg.isBot
                    ? { ...s.botBubble, ...(msg.error ? { borderLeft: '3px solid #FC8181', color: '#FC8181' } : {}) }
                    : s.userBubble
                }>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && <TypingIndicator />}

            {/* Быстрые вопросы — показываем только в начале */}
            {showSuggestions && (
              <div style={chipRowStyle}>
                {SUGGESTIONS.map((q) => (
                  <button key={q} onClick={() => send(q)} style={chipStyle}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Поле ввода */}
          <div style={s.inputContainer}>
            <div style={s.inputWrapper}>
              <input
                style={{ ...s.input, opacity: loading ? 0.6 : 1 }}
                placeholder="Спросите о финансах..."
                value={input}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{ ...s.sendBtn, color: loading || !input.trim() ? '#374151' : '#00E5FF' }}
              >
                <Icons.Send disabled={loading || !input.trim()} />
              </button>
            </div>
            <p style={s.footerNote}>Ваши финансовые данные зашифрованы и в безопасности.</p>
          </div>

        </div>
      </div>
    </>
  );
}

const chipRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '8px',
  paddingLeft: '44px',
};

const chipStyle = {
  background: 'rgba(0,229,255,0.07)',
  border: '1px solid rgba(0,229,255,0.2)',
  borderRadius: '20px',
  color: '#00E5FF',
  fontSize: '0.78rem',
  fontWeight: '600',
  padding: '6px 14px',
  cursor: 'pointer',
  transition: 'background 0.2s',
};
