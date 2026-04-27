export const s = {
    container: {
    padding: '2rem',
    height: 'calc(100vh - 100px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '780px',
    background: '#111827',
    borderRadius: '24px',
    padding: '25px',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
    boxSizing: 'border-box'
  },
  avatarContainer: { display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem' },
  avatarCircle: (url) => ({
      width: '80px',
      height: '80px',
      borderRadius: '20px', // Или '50%' для круга
      backgroundImage: url ? `url(${url})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: '#1E2530',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '1.5rem',
      color: '#00E5FF',
      fontWeight: 'bold',
      border: '2px solid #1E2530'
    }),
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' },
  sectionTitle: {
    color: '#6B7280', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
    marginBottom: '1rem', borderBottom: '1px solid #1E2530', paddingBottom: '0.5rem', letterSpacing: '0.5px'
  },
  saveBtn: {
    marginTop: '1.8rem', width: '100%', background: '#00E5FF', color: '#0B0F17',
    border: 'none', padding: '13px', borderRadius: '14px', fontWeight: '800',
    cursor: 'pointer', fontSize: '0.95rem', transition: '0.2s'
  }
};