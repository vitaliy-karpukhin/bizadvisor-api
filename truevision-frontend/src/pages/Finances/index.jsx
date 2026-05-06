import React, { useState, useEffect } from 'react';
import { useLang } from '../../context/LangContext.jsx';
import { useExport } from '../../hooks/useExport';
import api from '../../api/client';
import { s, PERIOD_LABELS, INCOME_COLORS, EXPENSE_COLORS, CAT_LABELS } from './styles';
import './finances.css';

const TABS = {
  income:  { ru: 'Доходы',  de: 'Einnahmen', color: '#059669', bg: '#064E3B', arrow: '↑' },
  expense: { ru: 'Расходы', de: 'Ausgaben',  color: '#DC2626', bg: '#7C2D12', arrow: '↓' },
};

const CategoryItem = ({ label, amount, percentage, color }) => (
  <div style={s.catCard}>
    <div style={s.catLeft}>
      <div style={s.iconBg(color)}>
        <span style={{ color, fontWeight: '700', fontSize: '0.85rem' }}>
          {label?.charAt(0)?.toUpperCase()}
        </span>
      </div>
      <div style={s.catInfo}>
        <div style={s.catLabel}>{label}</div>
        <div style={s.catAmount(color)}>{Number(amount).toLocaleString('de-DE')} €</div>
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

export default function Finances() {
  const { lang } = useLang();
  const { download, loading: exportLoading } = useExport();

  const [tab, setTab] = useState('income');
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState({ total: 0, items: [] });
  const [docsCount, setDocsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isRu = lang === 'ru';
  const tabMeta = TABS[tab];
  const colors = tab === 'income' ? INCOME_COLORS : EXPENSE_COLORS;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get(`/dashboard/events/categories?type=${tab}&period=${period}`),
      api.get(`/dashboard?period=${period}`),
    ])
      .then(([catRes, metricsRes]) => {
        if (cancelled) return;
        setData(catRes.data);
        setDocsCount(metricsRes.data.documents_analyzed || 0);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, period]);

  const totalFormatted = Number(data.total).toLocaleString('de-DE', {
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  });

  const stripItems = data.items.length > 0 ? data.items : [{ percentage: 100 }];

  return (
    <div style={s.container}>

      {/* ── Тулбар ── */}
      <div style={s.toolbar}>
        {/* Табы */}
        <div style={s.tabGroup}>
          {Object.entries(TABS).map(([key, meta]) => (
            <button
              key={key}
              style={s.tab(tab === key, meta.color)}
              onClick={() => setTab(key)}
            >
              {isRu ? meta.ru : meta.de}
            </button>
          ))}
        </div>

        <div style={s.divider} />

        {/* Период */}
        {Object.entries(PERIOD_LABELS).map(([key, label]) => (
          <button key={key} style={s.pill(period === key)} onClick={() => setPeriod(key)}>
            {label}
          </button>
        ))}

        {/* CSV */}
        <button
          style={s.csvBtn}
          onClick={() => download({ period, type: tab })}
          disabled={exportLoading}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {exportLoading ? '...' : 'CSV'}
        </button>
      </div>

      {/* ── Сетка карточек ── */}
      <div style={s.grid} className="finances-grid">

        {/* Итоговая карточка */}
        <div style={s.mainCard(tabMeta.bg)}>
          <div style={s.mainCardTop}>
            <span style={{ fontSize: '1.3rem' }}>{tabMeta.arrow}</span>
            <span style={s.mainLabel}>{isRu ? tabMeta.ru : tabMeta.de}</span>
          </div>
          <div style={s.mainAmountRow}>
            {loading ? (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '2rem' }}>...</span>
            ) : (
              <>
                <span style={s.amountNum} className="finances-amount">{totalFormatted}</span>
                <span style={s.amountEur}>€</span>
              </>
            )}
          </div>
          <div style={s.badge}>
            <span>{tabMeta.arrow}</span>
            <span>{docsCount}</span>
            <span style={s.badgeSub}>&nbsp;{isRu ? 'документов обработано' : 'Dokumente analysiert'}</span>
          </div>
          <div style={s.strip}>
            {stripItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: colors[idx % colors.length],
                  width: `${item.percentage}%`,
                  height: '100%',
                }}
              />
            ))}
          </div>
        </div>

        {/* Разбивка по категориям */}
        <div style={s.breakdownCard}>
          <div style={s.bdHeader}>
            <div style={s.bdTitle}>
              {isRu ? 'По категориям' : 'Nach Kategorien'}
            </div>
            <div style={s.bdSub}>{PERIOD_LABELS[period]?.toUpperCase()}</div>
          </div>
          <div style={s.list}>
            {loading && (
              <div style={s.empty}>загрузка...</div>
            )}
            {!loading && data.items.length === 0 && (
              <div style={s.empty}>
                {isRu ? 'Нет данных — загрузите документы' : 'Keine Daten — Dokumente hochladen'}
              </div>
            )}
            {!loading && data.items.map((item, idx) => (
              <CategoryItem
                key={idx}
                label={CAT_LABELS[item.category] || item.category}
                amount={item.amount}
                percentage={item.percentage}
                color={colors[idx % colors.length]}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
