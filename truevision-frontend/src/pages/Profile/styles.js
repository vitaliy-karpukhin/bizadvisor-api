export const s = {
  container: {
    padding: '1.5rem',
    maxWidth: '820px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },

  // ── Hero ─────────────────────────────────────────────────────────────────
  hero: {
    position: 'relative',
    borderRadius: '20px',
    overflow: 'hidden',
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #0f1e35 0%, #0B0F17 60%)',
    border: '1px solid rgba(0,229,255,0.12)',
    padding: '28px 24px 24px',
  },
  heroBg: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(ellipse 60% 80% at 90% 20%, rgba(0,229,255,0.08) 0%, transparent 70%)',
  },
  heroRow: {
    position: 'relative', display: 'flex', alignItems: 'center', gap: '18px',
  },
  avatarWrap: { position: 'relative', flexShrink: 0, cursor: 'pointer' },
  avatar: {
    width: '72px', height: '72px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a2a3a, #1E2530)',
    border: '2px solid rgba(0,229,255,0.4)',
    boxShadow: '0 0 28px rgba(0,229,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.5rem', color: '#00E5FF', fontWeight: '700', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' },
  heroInfo: { flex: 1, minWidth: 0 },
  heroName: { color: '#F7FAFC', fontWeight: '800', fontSize: '1.15rem', lineHeight: 1.2, marginBottom: '3px' },
  heroEmail: { color: '#4A5568', fontSize: '0.78rem', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  planBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'linear-gradient(90deg, rgba(0,229,255,0.12), rgba(0,112,255,0.12))',
    border: '1px solid rgba(0,229,255,0.2)',
    borderRadius: '20px', padding: '3px 10px',
    color: '#00E5FF', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.03em',
  },

  // ── Stats ────────────────────────────────────────────────────────────────
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px',
  },
  statCard: {
    background: '#0f1520', border: '1px solid #1a2235',
    borderRadius: '14px', padding: '16px 14px',
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px',
  },
  statIcon: {
    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  statValue: {
    color: '#F7FAFC', fontWeight: '800', fontSize: '1.2rem',
    fontVariantNumeric: 'tabular-nums', lineHeight: 1,
  },
  statLabel: {
    color: '#4A5568', fontSize: '0.65rem', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '3px',
  },

  // ── Section card ─────────────────────────────────────────────────────────
  section: {
    background: '#0f1520', border: '1px solid #1a2235',
    borderRadius: '16px', marginBottom: '10px', overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 18px', borderBottom: '1px solid #1a2235',
  },
  sectionIcon: {
    width: '30px', height: '30px', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0,
  },
  sectionTitle: { color: '#CBD5E0', fontSize: '0.82rem', fontWeight: '700' },
  sectionBody: { padding: '16px 18px' },

  // ── Form ─────────────────────────────────────────────────────────────────
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  fieldLabel: {
    color: '#4A5568', fontSize: '0.67rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px',
  },
  input: (disabled) => ({
    width: '100%', boxSizing: 'border-box',
    background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    padding: '9px 12px', borderRadius: '10px',
    color: disabled ? '#374151' : '#E2E8F0',
    fontSize: '0.85rem', outline: 'none', transition: 'border-color 0.2s',
  }),

  saveBtn: {
    marginTop: '14px', width: '100%',
    background: 'linear-gradient(90deg, #00C8E0 0%, #0070FF 100%)',
    color: '#0B0F17', border: 'none', padding: '11px',
    borderRadius: '12px', fontWeight: '800', cursor: 'pointer',
    fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,229,255,0.2)', transition: 'opacity 0.2s',
  },
  pwBtn: (active) => ({
    marginTop: '12px', width: '100%', padding: '10px',
    background: active ? 'linear-gradient(90deg, #00C8E0 0%, #0070FF 100%)' : '#1a2235',
    border: active ? 'none' : '1px solid #2D3748',
    borderRadius: '10px',
    color: active ? '#0B0F17' : '#4A5568',
    fontWeight: '700', fontSize: '0.85rem',
    cursor: active ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
  }),
};
