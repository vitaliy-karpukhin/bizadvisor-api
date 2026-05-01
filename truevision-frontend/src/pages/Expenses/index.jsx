import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { s, PERIOD_LABELS, CAT_COLORS, CAT_LABELS } from './styles';
import { useExport } from '../../hooks/useExport';
import { CategoryIcons, ActionIcons } from '../../components/Icons.jsx';

// ─── Иконки категорий ────────────────────────────────────────────────────────

const CatIcon = ({ type, color }) => {
  const Icon = CategoryIcons[type] || CategoryIcons.default;
  return <Icon color={color} />;
};

// ─── Элемент категории ───────────────────────────────────────────────────────

const CategoryItem = ({ label, amount, percentage, color, type }) => (
  <div style={s.catCard}>
    <div style={s.catLeft}>
      <div style={s.iconBg(color)}>
        <CatIcon type={type} color={color} />
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

// ─── Главный компонент ───────────────────────────────────────────────────────

export default function Expenses() {
  const { download, loading: exportLoading } = useExport();
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState({ total: 0, items: [] });
  const [docsCount, setDocsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.get(`/dashboard/events/categories?type=expense&period=${period}`),
      api.get(`/dashboard?period=${period}`),
    ])
      .then(([catRes, metricsRes]) => {
        if (cancelled) return;
        setData(catRes.data);
        setDocsCount(metricsRes.data.documents_analyzed || 0);
      })
      .catch((err) => console.error('Expenses fetch error:', err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [period]);

  const totalFormatted = Number(data.total).toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const stripItems = data.items.length > 0
    ? data.items
    : [{ percentage: 100 }];

  return (
    <div style={s.container}>

      {/* Выбор периода */}
      <div style={s.periodRow}>
        {Object.entries(PERIOD_LABELS).map(([key, label]) => (
          <button key={key} style={s.pill(period === key)} onClick={() => setPeriod(key)}>
            {label}
          </button>
        ))}
        {loading && (
          <span style={{ color: '#4A5568', fontSize: '0.75rem', marginLeft: '8px' }}>
            загрузка...
          </span>
        )}
        <button
          onClick={() => download({ period, type: 'expense' })}
          disabled={exportLoading}
          style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #1E2530', color: '#9CA3AF', padding: '6px 14px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ActionIcons.Download />
          {exportLoading ? 'Экспорт...' : 'CSV'}
        </button>
      </div>

      <div className="income-grid" style={s.grid}>

        {/* ── Левая карточка: итог ── */}
        <div style={s.mainCard}>
          <div style={s.mainCardTop}>
            <span style={{ fontSize: '1.3rem' }}>↓</span>
            <span style={s.mainLabel}>общие расходы</span>
          </div>
          <div style={s.mainAmountRow}>
            {loading ? (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '2rem' }}>...</span>
            ) : (
              <>
                <span style={s.amountNum}>{totalFormatted}</span>
                <span style={s.amountEur}>€</span>
              </>
            )}
          </div>
          <div style={s.badge}>
            <span>↑</span>
            <span>{docsCount}</span>
            <span style={s.badgeSub}>&nbsp;документов обработано</span>
          </div>

          {/* Полоска категорий */}
          <div style={s.strip}>
            {stripItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: CAT_COLORS[idx % CAT_COLORS.length],
                  width: `${item.percentage}%`,
                  height: '100%',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Правая карточка: разбивка ── */}
        <div style={s.breakdownCard}>
          <div style={s.bdHeader}>
            <div style={s.bdTitle}>
              <ActionIcons.BarChart style={{ color: '#6B7280' }} />
              По категориям
            </div>
            <div style={s.bdSub}>
              {PERIOD_LABELS[period]?.toUpperCase()}
            </div>
          </div>

          <div style={s.list}>
            {!loading && data.items.length === 0 && (
              <div style={s.empty}>
                Нет данных — загрузите и проанализируйте документы
              </div>
            )}
            {!loading && data.items.map((item, idx) => (
              <CategoryItem
                key={idx}
                type={item.category}
                label={CAT_LABELS[item.category] || item.category}
                amount={item.amount}
                percentage={item.percentage}
                color={CAT_COLORS[idx % CAT_COLORS.length]}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
