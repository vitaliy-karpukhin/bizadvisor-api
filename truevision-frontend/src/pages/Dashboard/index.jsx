import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { s } from './styles';
import { StatCard, NotificationItem } from './components';
import api from '../../api/client';
import { useExport } from '../../hooks/useExport';
import { ActionIcons } from '../../components/Icons.jsx';

const PERIOD_LABELS = { week: 'Неделя', month: 'Месяц', year: 'Год' };
const BAR_COLORS = ['#4FD1C5', '#F687B3', '#3182CE', '#68D391', '#F6AD55', '#90CDF4', '#B794F4'];

const periodSelectorStyle = {
  display: 'flex',
  gap: '8px',
  marginBottom: '1.5rem',
  alignItems: 'center',
};

const pillStyle = (active) => ({
  padding: '6px 16px',
  borderRadius: '20px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.78rem',
  fontWeight: '600',
  background: active ? '#00E5FF' : '#1E2530',
  color: active ? '#0B0F17' : '#6B7280',
  transition: 'all 0.2s',
});

function fmt(val) {
  const n = Number(val) || 0;
  return `${n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`;
}

export default function Dashboard() {
  const { download, loading: exportLoading } = useExport();
  const [period,   setPeriod]   = useState('month');
  const [metrics,  setMetrics]  = useState({ income: 0, expenses: 0, business_score: 0, documents_analyzed: 0 });
  const [chartData, setChartData] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.get(`/dashboard?period=${period}`),
      api.get('/dashboard/chart-data?period=week'),
      api.get('/dashboard/forecast'),
    ])
      .then(([metricsRes, chartRes, forecastRes]) => {
        if (cancelled) return;
        setMetrics(metricsRes.data);
        setChartData(chartRes.data);
        setForecast(forecastRes.data);
      })
      .catch((err) => console.error('Dashboard fetch error:', err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [period]);

  const savingsRate = metrics.income > 0
    ? Math.round(((metrics.income - metrics.expenses) / metrics.income) * 100)
    : 0;
  const available = metrics.income - metrics.expenses;

  const barData = chartData.map((item, idx) => ({
    name: item.name,
    value: item.income,
    color: BAR_COLORS[idx % BAR_COLORS.length],
  }));

  const hasChartData = barData.some(d => d.value > 0);

  return (
    <main style={s.main}>
      <div style={periodSelectorStyle}>
        {Object.entries(PERIOD_LABELS).map(([key, label]) => (
          <button key={key} style={pillStyle(period === key)} onClick={() => setPeriod(key)}>
            {label}
          </button>
        ))}
        {loading && (
          <span style={{ color: '#4A5568', fontSize: '0.75rem', marginLeft: '8px' }}>
            загрузка...
          </span>
        )}
        <button
          onClick={() => download({ period, type: 'all' })}
          disabled={exportLoading}
          style={{
            marginLeft: 'auto', padding: '6px 14px', borderRadius: '10px', border: '1px solid #1E2530',
            background: 'transparent', color: exportLoading ? '#4A5568' : '#9CA3AF',
            fontSize: '0.78rem', fontWeight: '600', cursor: exportLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <ActionIcons.Download />
          {exportLoading ? 'Экспорт...' : 'CSV'}
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <StatCard title="Доходы" value={fmt(metrics.income)} change={`${metrics.documents_analyzed} doc`} trend="up" />
        <StatCard title="Расходы" value={fmt(metrics.expenses)} change="" trend="down" />
        <StatCard title="Savings Rate" value={`${savingsRate}%`} />
        <StatCard title="Available" value={fmt(available)} />
      </div>

      {/* Подсказка как включить прогноз — показываем если нет recurring транзакций */}
      {forecast && forecast.count === 0 && metrics.documents_analyzed > 0 && (
        <div style={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '14px', padding: '0.75rem 1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1rem' }}>📅</span>
          <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>
            Хотите видеть прогноз на следующий месяц? Откройте раздел{' '}
            <a href="/transactions" style={{ color: '#00E5FF', textDecoration: 'none', fontWeight: '600' }}>Транзакции</a>
            {' '}и отметьте регулярные платежи (аренда, зарплата, подписки).
          </span>
        </div>
      )}

      {/* Прогноз следующего месяца — показываем только если есть recurring */}
      {forecast && forecast.count > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(59,130,246,0.06) 100%)',
          border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: '16px', padding: '1rem 1.25rem',
          marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ color: '#00E5FF', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Прогноз на следующий месяц
            </div>
            <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>
              {forecast.count} ежемесячн{forecast.count === 1 ? 'ая' : 'ых'} транзакци{forecast.count === 1 ? 'я' : 'й'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Доходы',  val: forecast.income,  color: '#68D391' },
              { label: 'Расходы', val: forecast.expense, color: '#FC8181' },
              { label: 'Остаток', val: forecast.net,     color: forecast.net >= 0 ? '#00E5FF' : '#FC8181' },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div style={{ color: '#6B7280', fontSize: '0.7rem', marginBottom: '2px' }}>{label}</div>
                <div style={{ color, fontWeight: '700', fontSize: '1rem' }}>
                  {val >= 0 ? '+' : '−'}{Math.abs(val).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="two-col-grid" style={{ flex: 1, minHeight: 0 }}>
        <div style={s.card}>
          <h3 style={{ color: 'white', marginBottom: '2rem' }}>Динамика доходов по дням</h3>
          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
            {!hasChartData ? (
              <div style={{ color: '#4A5568', textAlign: 'center', paddingTop: '4rem', fontSize: '0.85rem' }}>
                Нет данных — загрузите и проанализируйте документы
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2530" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => [`${val} €`, 'Доход']}
                  />
                  <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={45}>
                    {barData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'white', margin: 0 }}>Уведомления</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {available < 0 && (
              <NotificationItem
                type="error"
                title="Расходы превышают доходы"
                text={`Перерасход: ${fmt(Math.abs(available))}`}
                time="сейчас"
              />
            )}
            {available >= 0 && metrics.income > 0 && (
              <NotificationItem
                type="success"
                title="Финансы в порядке"
                text={`Свободный остаток: ${fmt(available)}`}
                time="сейчас"
              />
            )}
            {savingsRate > 0 && (
              <NotificationItem
                type="success"
                title={`Savings Rate: ${savingsRate}%`}
                text="Доходы превышают расходы"
                time=""
              />
            )}
            {metrics.documents_analyzed === 0 && (
              <NotificationItem
                type="warning"
                title="Нет обработанных документов"
                text="Загрузите счета или договоры для анализа"
                time=""
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
