import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { s } from './styles'
import api from '../../api/client'
import { UIIcons, ActionIcons, NewsIcons } from '../../components/Icons.jsx'

// Вспомогательные мини-компоненты
const StatBox = ({ val, lab }) => (
  <div style={{ background: '#1E2530', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
    <div style={{ color: '#00E5FF', fontWeight: '800', fontSize: '1.1rem' }}>{val}</div>
    <div style={{ color: '#6B7280', fontSize: '0.65rem', marginTop: '4px', fontWeight: '700' }}>{lab}</div>
  </div>
);

const CustomNewsRow = ({ label, color, icon: Icon }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  }}>
    <div style={{
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `${color}15`,
      padding: '8px',
      borderRadius: '10px'
    }}>
      <Icon />
    </div>
    <span style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: '500' }}>{label}</span>
  </div>
);

// Псевдонимы для удобства использования в компоненте
const Icons = {
  Trend:   UIIcons.Trend,
  Chevron: UIIcons.ChevronDown,
  File:    () => <ActionIcons.File size={18} />,
};

export default function Analytics() {
  const [openStates, setOpenStates] = useState({ growth: true, model: true, news: true });
  const toggle = (key) => setOpenStates(prev => ({ ...prev, [key]: !prev[key] }));

  const [lineData, setLineData] = useState([]);
  const [metrics, setMetrics] = useState({ income: 0, expenses: 0, business_score: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/dashboard/chart-data?period=year'),
      api.get('/dashboard?period=year'),
    ])
      .then(([chartRes, metricsRes]) => {
        if (cancelled) return;
        setLineData(chartRes.data.map(d => ({ n: d.name, v: d.income, e: d.expenses })));
        setMetrics(metricsRes.data);
      })
      .catch((err) => console.error('Analytics fetch error:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const hasData = lineData.some(d => d.v > 0 || d.e > 0);

  const maxIncome = lineData.reduce((max, d) => Math.max(max, d.v), 0);
  const firstIncome = lineData.find(d => d.v > 0)?.v || 0;
  const growthPct = firstIncome > 0 && maxIncome > firstIncome
    ? Math.round(((maxIncome - firstIncome) / firstIncome) * 100)
    : 0;

  const savingsRate = metrics.income > 0
    ? Math.round(((metrics.income - metrics.expenses) / metrics.income) * 100)
    : 0;

  return (
    <div style={s.container}>
      <div style={s.mainContent}>
        <main className="two-col-grid" style={s.grid}>

          {/* ЛЕВАЯ КОЛОНКА: РОСТ ДОХОДА */}
          <section style={s.card}>
            <div onClick={() => toggle('growth')} style={s.header}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={s.title}>Рост дохода</h3>
                {growthPct > 0 && <div style={s.badge}><Icons.Trend /> +{growthPct}%</div>}
                {loading && <span style={{ color: '#4A5568', fontSize: '0.75rem' }}>загрузка...</span>}
              </div>
              <Icons.Chevron isOpen={openStates.growth} />
            </div>
            {openStates.growth && (
              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <p style={s.subText}>Динамика по месяцам (12 мес.)</p>
                <div style={{ height: '300px' }}>
                  {!hasData ? (
                    <div style={{ color: '#4A5568', textAlign: 'center', paddingTop: '4rem', fontSize: '0.85rem' }}>
                      Нет данных — загрузите и проанализируйте документы
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2530" />
                        <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 11 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
                        <Tooltip
                          contentStyle={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '12px', color: '#fff' }}
                          formatter={(val, name) => [`${val} €`, name === 'v' ? 'Доходы' : 'Расходы']}
                        />
                        <Line type="monotone" dataKey="v" stroke="#00E5FF" strokeWidth={3} dot={{ r: 4, fill: '#00E5FF', strokeWidth: 2, stroke: '#0B0F17' }} />
                        <Line type="monotone" dataKey="e" stroke="#F687B3" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ПРАВАЯ КОЛОНКА */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* КАРТОЧКА: ФИНАНСОВАЯ МОДЕЛЬ */}
            <section style={s.card}>
              <div onClick={() => toggle('model')} style={s.header}>
                <h3 style={s.title}>Финансовая модель</h3>
                <Icons.Chevron isOpen={openStates.model} />
              </div>
              {openStates.model && (
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                  <div style={s.progressContainer}>
                    <div style={{ width: `${savingsRate > 0 ? Math.min(savingsRate, 100) : 10}%`, background: '#10B981', height: '100%' }} />
                    <div style={{ width: `${metrics.expenses > 0 && metrics.income > 0 ? Math.min(Math.round(metrics.expenses / metrics.income * 100), 90) : 80}%`, background: '#F59E0B', height: '100%' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <StatBox val={`${metrics.income > 0 ? Math.round(metrics.income).toLocaleString('de-DE') : 0} €`} lab="ДОХОДЫ" />
                    <StatBox val={`${metrics.expenses > 0 ? Math.round(metrics.expenses).toLocaleString('de-DE') : 0} €`} lab="РАСХОДЫ" />
                    <StatBox val={`${savingsRate}%`} lab="SAVINGS RATE" />
                    <StatBox val={`${metrics.business_score}%`} lab="BIZ SCORE" />
                  </div>
                  <div style={s.balanceRow}>
                    <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>Business Score</span>
                    <span style={{ color: '#00E5FF', fontSize: '1.1rem', fontWeight: '800' }}>{metrics.business_score}%</span>
                  </div>
                </div>
              )}
            </section>

            {/* КАРТОЧКА: НОВОСТИ И ВОЗМОЖНОСТИ */}
            <section style={s.card}>
              <div onClick={() => toggle('news')} style={s.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: 'rgba(0, 229, 255, 0.05)',
                    padding: '8px',
                    borderRadius: '10px',
                    display: 'flex'
                  }}>
                    <Icons.File />
                  </div>
                  <div>
                    <h3 style={s.title}>Новости и возможности</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280' }}>4 рекомендации</p>
                  </div>
                </div>
                <Icons.Chevron isOpen={openStates.news} />
              </div>

              {openStates.news && (
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                  <CustomNewsRow
                    label="Новый депозит с доходностью 8%"
                    color="#F59E0B"
                    icon={NewsIcons.Deposit}
                  />
                  <CustomNewsRow
                    label="Оптимизация налогов -15%"
                    color="#10B981"
                    icon={NewsIcons.Tax}
                  />
                  <CustomNewsRow
                    label="Рефинансирование ипотеки"
                    color="#3B82F6"
                    icon={NewsIcons.Home}
                  />
                  <CustomNewsRow
                    label="Страховой кешбэк 200€"
                    color="#8B5CF6"
                    icon={NewsIcons.Flash}
                  />
                </div>
              )}
            </section>

          </div>
        </main>
      </div>
    </div>
  )
}