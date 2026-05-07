export const STATUS_COLORS = {
  uploaded: '#F6AD55',
  analyzing: '#4FD1C5',
  analyzed: '#68D391',
  processing_failed: '#FC8181',
};

export const PAYMENT_COLORS = {
  pending: '#F6AD55',
  paid:    '#68D391',
  overdue: '#FC8181',
};

export const PAYMENT_LABELS = {
  pending: 'Ожидает',
  paid:    'Оплачен',
  overdue: 'Просрочен',
};

export const STATUS_LABELS = {
  uploaded: 'Загружен',
  analyzing: 'Анализируется...',
  analyzed: 'Проанализирован',
  processing_failed: 'Ошибка',
};

export const FIELD_LABELS = {
  amount:       'Сумма',
  category:     'Категория',
  vendor:       'Поставщик',
  currency:     'Валюта',
  netto:        'Нетто',
  mwst:         'НДС (MwSt)',
  events_count: 'Событий',
  firma:        'Компания',
  iban:         'IBAN',
  bic:          'BIC / SWIFT',
  rechnung_nr:  'Номер счёта',
  datum:        'Дата документа',
  faellig_am:   'Срок оплаты',
  empfaenger:   'Получатель',
  language:     'Язык',
};

export function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const s = {
  page:  { padding: '1.5rem', backgroundColor: '#0B0F17', minHeight: '100%', boxSizing: 'border-box' },
  empty: { color: '#4A5568', textAlign: 'center', padding: '3rem', fontSize: '0.85rem' },

  uploadZone: (drag) => ({
    border: `2px dashed ${drag ? '#00E5FF' : '#1E2530'}`,
    borderRadius: '16px', padding: '2rem', textAlign: 'center',
    cursor: 'pointer', background: drag ? 'rgba(0,229,255,0.05)' : '#151B28',
    transition: 'all 0.2s', marginBottom: '1.5rem',
  }),

  card: {
    background: '#151B28', border: '1px solid #1E2530',
    borderRadius: '16px', padding: '0.9rem 1.25rem',
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem',
    minWidth: 0,
  },
  fileIcon: {
    width: '36px', height: '36px', background: 'rgba(0,229,255,0.08)',
    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, color: '#00E5FF',
  },
  fileName: {
    color: '#E2E8F0', fontSize: '0.85rem', fontWeight: '600', marginBottom: '3px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  fileMeta: { color: '#4A5568', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },

  badge: (st) => ({
    padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '600',
    background: `${STATUS_COLORS[st] || '#4A5568'}20`, color: STATUS_COLORS[st] || '#4A5568',
    whiteSpace: 'nowrap', flexShrink: 0,
  }),

  btn: (variant, disabled) => {
    const variants = {
      primary:     { background: '#00E5FF', color: '#0B0F17', border: 'none' },
      secondary:   { background: '#1E2530', color: '#CBD5E0', border: '1px solid #2D3748' },
      destructive: { background: 'transparent', color: '#6B7280', border: '1px solid #1E2530' },
      warning:     { background: 'transparent', color: '#F6AD55', border: '1px solid #2D3748' },
    };
    const v = variants[variant] || variants.secondary;
    return {
      padding: '6px 16px', borderRadius: '10px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '0.78rem', fontWeight: '600',
      opacity: disabled ? 0.45 : 1, transition: 'all 0.2s', whiteSpace: 'nowrap',
      ...v,
      ...(disabled ? { background: '#1E2530', color: '#4A5568', border: '1px solid #1E2530' } : {}),
    };
  },

  // ── Детальный экран ──────────────────────────────────────────────────────────
  detailBack: {
    display: 'flex', alignItems: 'center', gap: '8px',
    color: '#4A5568', fontSize: '0.82rem', cursor: 'pointer',
    marginBottom: '1.25rem', background: 'none', border: 'none', padding: 0,
  },

  // Главная карточка — glassmorphism
  infoCard: {
    background: 'rgba(21,27,40,0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    overflow: 'hidden',
  },

  // Hero-полоса карточки
  cardHero: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '18px 20px',
    background: 'linear-gradient(135deg, rgba(0,229,255,0.07) 0%, transparent 65%)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  cardHeroIcon: {
    width: '46px', height: '46px',
    background: 'rgba(0,229,255,0.1)',
    border: '1px solid rgba(0,229,255,0.18)',
    borderRadius: '13px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#00E5FF', flexShrink: 0,
  },
  cardTitle: {
    color: '#E2E8F0', fontSize: '0.92rem', fontWeight: '700',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cardMeta: { color: '#4A5568', fontSize: '0.73rem', marginTop: '3px' },

  // Строка метрик (Сумма / Категория / Поставщик)
  metricsRow: {
    display: 'flex', gap: '10px',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexWrap: 'wrap',
  },
  metricBox: {
    flex: 1, minWidth: '110px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '10px 14px',
  },
  metricLabel: {
    color: '#4A5568', fontSize: '0.62rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px',
  },

  // Сетка детальных полей
  detailBody: { padding: '14px 20px 18px' },
  detailSectionLabel: {
    color: '#4A5568', fontSize: '0.62rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    marginBottom: '10px',
  },
  detailFieldsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0 28px',
  },
  detailFieldItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    gap: '8px',
  },
  detailFieldKey: { color: '#6B7280', fontSize: '0.77rem', flexShrink: 0 },
  detailFieldVal: { color: '#CBD5E0', fontSize: '0.77rem', fontWeight: '600', textAlign: 'right', wordBreak: 'break-all' },

  // Статус оплаты
  paymentSection: {
    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
    padding: '12px 20px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },

  // Кнопка анализа
  analyzeBtn: (disabled) => ({
    display: 'block', width: '100%',
    background: disabled ? '#1E2530' : 'linear-gradient(90deg, #00C8E0 0%, #0070FF 100%)',
    color: disabled ? '#4A5568' : '#0B0F17',
    border: 'none', padding: '11px',
    borderRadius: '12px', fontWeight: '800',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.9rem', opacity: disabled ? 0.6 : 1,
    transition: 'opacity 0.2s',
    margin: '12px 20px 18px', width: 'calc(100% - 40px)',
  }),

  // Секция просмотра файла (коллапс)
  viewerOuter: {
    background: 'rgba(21,27,40,0.9)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  viewerHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '13px 16px',
    cursor: 'pointer', userSelect: 'none',
  },
  viewerHeaderTitle: { color: '#9CA3AF', fontSize: '0.85rem', fontWeight: '600' },
  downloadLink: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 12px',
    background: 'rgba(0,229,255,0.08)',
    border: '1px solid rgba(0,229,255,0.25)',
    borderRadius: '8px',
    color: '#00E5FF', fontSize: '0.75rem', fontWeight: '600',
    textDecoration: 'none',
    transition: 'background 0.2s',
  },
};
