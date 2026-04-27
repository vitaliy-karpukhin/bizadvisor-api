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
  // Финансовые данные
  amount:       'Сумма',
  category:     'Категория',
  vendor:       'Поставщик',
  currency:     'Валюта',
  netto:        'Нетто',
  mwst:         'НДС (MwSt)',
  events_count: 'Событий извлечено',
  // Реквизиты
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
  page:   { padding: '1.5rem', backgroundColor: '#0B0F17', minHeight: '100%', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title:  { color: '#fff', fontSize: '1.2rem', fontWeight: '700', margin: 0 },
  empty:  { color: '#4A5568', textAlign: 'center', padding: '3rem', fontSize: '0.85rem' },

  uploadZone: (drag) => ({
    border: `2px dashed ${drag ? '#00E5FF' : '#1E2530'}`,
    borderRadius: '16px', padding: '2rem', textAlign: 'center',
    cursor: 'pointer', background: drag ? 'rgba(0,229,255,0.05)' : '#151B28',
    transition: 'all 0.2s', marginBottom: '1.5rem',
  }),

  card: {
    background: '#151B28', border: '1px solid #1E2530',
    borderRadius: '16px', padding: '1rem 1.25rem',
    display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem',
  },
  fileIcon: {
    width: '38px', height: '38px', background: 'rgba(0,229,255,0.08)',
    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  fileName: { color: '#E2E8F0', fontSize: '0.88rem', fontWeight: '600', marginBottom: '2px' },
  fileMeta: { color: '#4A5568', fontSize: '0.72rem' },

  badge: (st) => ({
    padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600',
    background: `${STATUS_COLORS[st] || '#4A5568'}20`, color: STATUS_COLORS[st] || '#4A5568',
    whiteSpace: 'nowrap',
  }),

  btn: (variant, disabled) => {
    const variants = {
      primary:     { background: '#00E5FF', color: '#0B0F17', border: 'none' },
      secondary:   { background: '#1E2530', color: '#CBD5E0', border: '1px solid #2D3748' },
      destructive: { background: 'transparent', color: '#6B7280', border: '1px solid #1E2530' },
      blue:        { background: '#3B82F6', color: '#fff', border: 'none' },
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

  // Детальный экран
  detailBack: {
    display: 'flex', alignItems: 'center', gap: '8px',
    color: '#4A5568', fontSize: '0.82rem', cursor: 'pointer',
    marginBottom: '1.25rem', background: 'none', border: 'none', padding: 0,
  },
  detailHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    marginBottom: '1.5rem', flexWrap: 'wrap',
  },
  detailTitle: { color: '#fff', fontSize: '1rem', fontWeight: '700', margin: 0 },
  detailGrid: {
    display: 'grid', gridTemplateColumns: '320px 1fr',
    gap: '20px', alignItems: 'start',
  },
  infoCard: {
    background: '#151B28', border: '1px solid #1E2530',
    borderRadius: '16px', padding: '1.25rem',
  },
  infoSection: { marginBottom: '1.25rem' },
  infoLabel: {
    color: '#4A5568', fontSize: '0.7rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem',
  },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E2530' },
  infoKey: { color: '#6B7280', fontSize: '0.8rem' },
  infoVal: { color: '#E2E8F0', fontSize: '0.8rem', fontWeight: '600', textAlign: 'right', maxWidth: '180px', wordBreak: 'break-word' },
  viewerCard: {
    background: '#151B28', border: '1px solid #1E2530',
    borderRadius: '16px', overflow: 'hidden',
  },
  viewerBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.75rem 1rem', borderBottom: '1px solid #1E2530',
  },
  viewerBarTitle: { color: '#CBD5E0', fontSize: '0.82rem', fontWeight: '600' },
};
