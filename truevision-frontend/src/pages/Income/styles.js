export const s = {
  container: {
    padding: '2rem',
    height: 'calc(100vh - 100px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  pageTitle: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#fff',
    margin: 0
  },
  addBtn: {
    background: '#00E5FF',
    color: '#0B0F17',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '2rem',
    flex: 1,
    minHeight: 0,
  },
  // Левая синяя карточка
  mainCard: {
    background: '#1565C0', // Более глубокий синий как на макете
    borderRadius: '24px',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center', // Контент строго в центре
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  mainCardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '0.5rem'
  },
  dollarIcon: { fontSize: '1.5rem', fontWeight: '400' },
  mainLabel: {
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '600'
  },
  mainAmountRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
    marginBottom: '1.5rem'
  },
  amountNum: {
    fontSize: '5rem', // Возвращаем крупный размер
    fontWeight: '800',
    lineHeight: 1,
    color: '#fff'
  },
  amountEur: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#fff'
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255,255,255,0.15)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '700',
    alignSelf: 'flex-start',
    color: '#fff',
    backdropFilter: 'blur(4px)'
  },
  badgeSub: { fontWeight: '400', opacity: 0.8, marginLeft: '4px' },

  // Полоска прогресса ВНИЗУ карточки
  strip: {
    position: 'absolute',
    bottom: '30px',
    left: '2.5rem',
    right: '2.5rem',
    height: '6px',
    display: 'flex',
    borderRadius: '10px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.1)'
  },

  // Правая карточка (Breakdown)
  breakdownCard: {
    background: '#151B28',
    borderRadius: '24px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    border: '1px solid rgba(255,255,255,0.05)'
  },
  bdHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  bdTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  bdSub: {
    fontSize: '0.75rem',
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    overflowY: 'auto',
    paddingRight: '4px'
  },

  // Элемент списка категорий
  catCard: {
    background: 'rgba(255,255,255,0.03)',
    padding: '14px 18px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background 0.2s'
  },
  catLeft: { display: 'flex', alignItems: 'center', gap: '15px' },
  iconBg: {
    width: '36px',
    height: '36px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  catInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  catLabel: { fontSize: '0.95rem', fontWeight: '600', color: '#fff' },
  catAmount: { fontSize: '1rem', fontWeight: '700', color: '#00E5FF' },

  catProgressBox: {
    width: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px'
  },
  progressText: { fontSize: '0.8rem', fontWeight: '700', color: '#fff' },
  barBg: {
    width: '100%',
    height: '4px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px'
  },
  barFill: (color, width) => ({
    background: color,
    width: `${width}%`,
    height: '100%',
    borderRadius: '10px',
    boxShadow: `0 0 10px ${color}44`
  })
};