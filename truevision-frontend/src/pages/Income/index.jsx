import React, { useState, useEffect } from 'react';
import { useLang } from '../../context/LangContext.jsx';
import { s } from './styles';
import { IncomeIcons } from '../../components/Icons.jsx';
import api from '../../api/client';
import { useExport } from '../../hooks/useExport';

const ITEM_COLORS = ['#2563EB', '#4ADE80', '#A855F7', '#FBBF24', '#F87171', '#34D399', '#60A5FA'];

const t = {
  ru: {
    total: 'общий доход',
    compare: 'документов обработано',
    breakdown: 'По источникам',
    monthly: 'ПЕРИОД: МЕСЯЦ',
    add: 'Загрузить документ',
    empty: 'Нет данных. Загрузите счета или договоры.',
  },
  de: {
    total: 'Gesamteinnahmen',
    compare: 'Dokumente analysiert',
    breakdown: 'Nach Quellen',
    monthly: 'ZEITRAUM: MONAT',
    add: 'Dokument hochladen',
    empty: 'Keine Daten. Laden Sie Rechnungen oder Verträge hoch.',
  },
};

const CategoryItem = ({ label, amount, percentage, color }) => (
  <div style={s.catCard}>
    <div style={s.catLeft}>
      <div style={{ ...s.iconBg, background: `${color}20` }}>
        <IncomeIcons.Wallet style={{ width: 14, height: 14, color }} />
      </div>
      <div style={s.catInfo}>
        <div style={s.catLabel}>{label}</div>
        <div style={s.catAmount}>{Number(amount).toLocaleString('de-DE')} €</div>
      </div>
    </div>
    <div style={s.catProgressBox}>
      <div style={s.progressText}>{percentage}%</div>
      <div style={s.barBg}>
        <div style={s.barFill(color, percentage)} />
      </div>
    </div>
  </div>
);

export default function Income() {
  const { lang } = useLang();
  const curT = t[lang] || t.ru;
  const { download, loading: exportLoading } = useExport();

  const [data, setData] = useState({ total: 0, items: [] });
  const [docsCount, setDocsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.get('/dashboard/events/categories?type=income&period=month'),
      api.get('/dashboard?period=month'),
    ])
      .then(([catRes, metricsRes]) => {
        if (cancelled) return;
        setData(catRes.data);
        setDocsCount(metricsRes.data.documents_analyzed || 0);
      })
      .catch((err) => console.error('Income fetch error:', err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const stripItems = data.items.length > 0 ? data.items : [{ percentage: 100, color: '#1E2530' }];

  const totalFormatted = Number(data.total).toLocaleString('de-DE', {
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  });

  return (
    <div style={s.container}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button
          onClick={() => download({ period: 'month', type: 'income' })}
          disabled={exportLoading}
          style={{ background: 'transparent', border: '1px solid #1E2530', color: '#9CA3AF', padding: '8px 14px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {exportLoading ? 'Экспорт...' : 'CSV'}
        </button>
        <button style={s.addBtn} onClick={() => window.location.href = '/documents'}>
          <span>+</span> {curT.add}
        </button>
      </div>

      <div className="income-grid" style={s.grid}>
        <div style={s.mainCard}>
          <div style={s.mainCardTop}>
            <span style={s.dollarIcon}>€</span>
            <span style={s.mainLabel}>{curT.total}</span>
          </div>
          <div style={s.mainAmountRow}>
            {loading ? (
              <span style={{ color: '#4A5568', fontSize: '1.5rem' }}>...</span>
            ) : (
              <>
                <span style={s.amountNum}>{totalFormatted}</span>
                <span style={s.amountEur}>€</span>
              </>
            )}
          </div>
          <div style={s.badge}>
            <IncomeIcons.ArrowUp style={{ width: 10, height: 10 }} />
            <span>{docsCount}</span>
            <span style={s.badgeSub}>&nbsp;{curT.compare}</span>
          </div>
          <div style={s.strip}>
            {stripItems.map((item, idx) => (
              <div
                key={idx}
                style={{ background: ITEM_COLORS[idx % ITEM_COLORS.length], width: `${item.percentage}%`, height: '100%' }}
              />
            ))}
          </div>
        </div>

        <div style={s.breakdownCard}>
          <div style={s.bdHeader}>
            <div style={s.bdTitle}>
              <IncomeIcons.Pie style={{ width: 14, height: 14, color: '#6B7280' }} /> {curT.breakdown}
            </div>
            <div style={s.bdSub}>{curT.monthly}</div>
          </div>
          <div style={s.list}>
            {loading && (
              <div style={{ color: '#4A5568', fontSize: '0.85rem', padding: '1rem 0' }}>загрузка...</div>
            )}
            {!loading && data.items.length === 0 && (
              <div style={{ color: '#4A5568', fontSize: '0.85rem', padding: '1rem 0' }}>{curT.empty}</div>
            )}
            {!loading && data.items.map((item, idx) => (
              <CategoryItem
                key={idx}
                label={item.category}
                amount={item.amount}
                percentage={item.percentage}
                color={ITEM_COLORS[idx % ITEM_COLORS.length]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
