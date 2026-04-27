export const s = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    background: '#04080F', // Более глубокий темный цвет
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, sans-serif'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px'
  },
  headerBox: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  title: {
    fontSize: '2.5rem', // Уменьшен размер (был 3.5)
    fontWeight: 800,
    marginBottom: '12px',
    letterSpacing: '-1px'
  },
  subtitle: {
    color: '#6B7280',
    fontSize: '1rem',
    maxWidth: '500px',
    margin: '0 auto'
  },
  grid: {
    display: 'flex',
    gap: '24px',
    width: '100%',
    maxWidth: '900px',
    justifyContent: 'center'
  },
  hintBox: {
    marginTop: '40px',
    background: 'rgba(255,255,255,0.02)',
    padding: '16px 24px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.05)',
    color: '#6B7280',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    maxWidth: '900px',
    width: '100%'
  }
};