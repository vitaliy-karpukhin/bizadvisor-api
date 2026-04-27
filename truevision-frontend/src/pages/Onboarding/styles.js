export const s = {
  container: {
    height: '100vh',
    width: '100vw',
    background: '#0B0F17',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  main: {
    flex: 1,
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 40px',
    minHeight: 0
  },
  stepIndicator: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  barContainer: { display: 'flex', gap: '6px' },
  bar: (active) => ({
    height: '3px',
    width: '30px',
    background: active ? '#00E5FF' : '#1E2530',
    borderRadius: '10px'
  }),
  stepLabel: { fontSize: '0.7rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' },
  title: { fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' },
  subtitle: { color: '#9CA3AF', fontSize: '1.1rem', maxWidth: '600px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '2.5rem',
    minHeight: 0
  },
  footer: { display: 'flex', justifyContent: 'flex-end', flexShrink: 0 },
  nextBtn: {
    background: '#00E5FF',
    color: '#0B0F17',
    border: 'none',
    padding: '1rem 3.5rem',
    borderRadius: '16px',
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(0, 229, 255, 0.2)'
  }
};