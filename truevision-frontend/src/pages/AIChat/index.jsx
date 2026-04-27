import React, { useState } from 'react';
import { s } from './styles';

const Icons = {
  Robot: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4M8 16h.01M16 16h.01" />
    </svg>
  ),
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Stars: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2">
      <path d="M12 3l1.91 5.89h6.19l-5.01 3.64 1.91 5.89-5-3.64-5 3.64 1.91-5.89-5.01-3.64h6.19z" />
    </svg>
  )
};

export default function AIChat() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Привет! Я ваш финансовый ассистент. Как я могу помочь?", isBot: true }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), text: input, isBot: false }]);
    setInput("");
  };

  return (
    <div style={s.container}>
      <div style={s.chatWrapper}>

        {/* Хедер чата */}
        <div style={s.chatHeader}>
          <div style={s.botAvatar}>
            <Icons.Robot />
          </div>
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

        {/* Окно сообщений */}
        <div style={s.messagesArea}>
          {messages.map((msg) => (
            <div key={msg.id} style={msg.isBot ? s.botMsgRow : s.userMsgRow}>
              {msg.isBot && <div style={s.miniAvatar}><Icons.Robot /></div>}
              <div style={msg.isBot ? s.botBubble : s.userBubble}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Поле ввода */}
        <div style={s.inputContainer}>
          <div style={s.inputWrapper}>
            <input
              style={s.input}
              placeholder="Спросите о финансах..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} style={s.sendBtn}>
              <Icons.Send />
            </button>
          </div>
          <p style={s.footerNote}>Your financial data is encrypted and secure.</p>
        </div>

      </div>
    </div>
  );
}