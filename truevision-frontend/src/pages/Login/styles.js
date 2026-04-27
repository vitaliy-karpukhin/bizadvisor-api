export const s = {
  wrapper: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    background: '#000',
    color: '#fff',
    overflow: 'hidden',
    fontFamily: 'Inter, sans-serif',
    position: 'relative'
  },
  left: {
    flex: 1.3,
    padding: '40px 60px',
    display: 'flex',
    flexDirection: 'column',
    background: 'radial-gradient(circle at 80% 20%, #0D2B33 0%, #000 65%)'
  },
  right: {
    width: '480px',
    background: '#0B0F17',
    display: 'flex',
    flexDirection: 'column',
    padding: '2.5rem',
    justifyContent: 'center',
    boxSizing: 'border-box',
    position: 'relative'
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto'
  },
  inputGroup: {
    position: 'relative',
    marginBottom: '1.2rem',
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '16px',
    paddingRight: '50px',
    background: '#E8F0FE',
    border: 'none',
    borderRadius: '12px',
    color: '#000',
    fontSize: '16px',
    outline: 'none',
    marginTop: '4px'
  },
  eyeBtn: {
    position: 'absolute',
    right: '15px',
    bottom: '14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center'
  },
  mainBtn: {
    width: '100%',
    padding: '18px',
    background: '#0066FF',
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '700',
    fontSize: '1.1rem',
    cursor: 'pointer',
    marginTop: '10px'
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    color: '#9CA3AF',
    marginLeft: '4px'
  },
  featureCard: {
    background: 'rgba(255,255,255,0.03)',
    padding: '1.2rem',
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.06)',
    boxSizing: 'border-box'
  },
  // ВОТ ЭТА ЧАСТЬ БЫЛА С ОШИБКОЙ
  toast: {
    position: 'fixed',
    top: '-100px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '14px 28px',
    borderRadius: '12px',
    color: '#000',
    fontWeight: '700',
    fontSize: '0.9rem',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    zIndex: 9999,
    textAlign: 'center',
    whiteSpace: 'nowrap'
  },
  toastVisible: {
    top: '30px'
  }
};