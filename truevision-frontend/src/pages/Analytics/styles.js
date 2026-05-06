export const s = {
  container: {
    display: 'flex',
    height: '100%',
    width: '100%',
    background: '#0B0F17',
    color: 'white',
    fontFamily: 'Inter, sans-serif'
  },
  mainContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  grid: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxSizing: 'border-box',
  },
  card: {
    background: '#151B28',
    borderRadius: '24px', // Чуть меньше радиус для компактности
    border: '1px solid #1E2530',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '1.2rem 1.5rem', // Сжали хедеры карточек
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer'
  },
  title: { fontSize: '1.1rem', fontWeight: '600', margin: 0 },
  subText: { color: '#6B7280', fontSize: '0.85rem', marginBottom: '1rem' },
  badge: {
    background: 'rgba(0, 229, 255, 0.1)',
    color: '#00E5FF',
    padding: '4px 10px',
    borderRadius: '10px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  progressContainer: {
    display: 'flex',
    height: '6px', // Тоньше
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '1.5rem',
    background: '#0B0F17'
  },
  balanceRow: {
    background: 'rgba(0, 229, 255, 0.03)',
    padding: '12px 20px', // Компактнее
    borderRadius: '16px',
    border: '1px solid rgba(0, 229, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px'
  },
  statBox: {
    background: '#0B0F17',
    padding: '12px',
    borderRadius: '14px',
    border: '1px solid #1E2530'
  }
};