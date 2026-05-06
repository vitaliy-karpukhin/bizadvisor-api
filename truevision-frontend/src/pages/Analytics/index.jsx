import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, Cell } from 'recharts'
import { s } from './styles'
import api from '../../api/client'
import { UIIcons, ActionIcons, NewsIcons } from '../../components/Icons.jsx'

function fmt(n) {
  return Number(n).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const MetricRow = ({ label, value, color = '#00E5FF', sub }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid #1E2530',
  }}>
    <div>
      <div style={{ color: '#9CA3AF', fontSize: '0.78rem' }}>{label}</div>
      {sub && <div style={{ color: '#4A5568', fontSize: '0.68rem', marginTop: '2px' }}>{sub}</div>}
    </div>
    <div style={{ color, fontWeight: '800', fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
  </div>
);

const NewsRow = ({ label, color, icon: Icon }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
  }}>
    <div style={{
      color, background: `${color}18`, padding: '8px', borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon />
    </div>
    <span style={{ fontSize: '0.83rem', color: '#CBD5E0', fontWeight: '500', lineHeight: '1.4' }}>{label}</span>
  </div>
);

const Icons = {
  Trend:   UIIcons.Trend,
  Chevron: UIIcons.ChevronDown,
  File:    () => <ActionIcons.File size={18} />,
};

function ChevronBtn({ isOpen }) {
  return (
    <div style={{
      color: '#4A5568', transition: 'transform 0.2s',
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    }}>
      ▾
    </div>
  );
}

export default function Analytics() {
  const [open, setOpen] = useState({ growth: true, model: true, news: true });
  const toggle = k => setOpen(prev => ({ ...prev, [k]: !prev[k] }));

  const [lineData, setLineData] = useState([]);
  const [metrics, setMetrics]   = useState({ income: 0, expenses: 0, business_score: 0 });
  const [loading, setLoading]   = useState(true);

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
      .catch(err => console.error('Analytics fetch error:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const pointsWithData = lineData.filter(d => d.v > 0 || d.e > 0).length;
  const hasChart = pointsWithData >= 1;
  const hasLine  = pointsWithData >= 2;

  const maxIncome   = lineData.reduce((max, d) => Math.max(max, d.v), 0);
  const firstIncome = lineData.find(d => d.v > 0)?.v || 0;
  const growthPct   = firstIncome > 0 && maxIncome > firstIncome
    ? Math.round(((maxIncome - firstIncome) / firstIncome) * 100)
    : 0;

  const savingsRate = metrics.income > 0
    ? Math.round(((metrics.income - metrics.expenses) / metrics.income) * 100)
    : 0;

  const total  = metrics.income + metrics.expenses;
  const incPct = total > 0 ? Math.round(metrics.income / total * 100) : 50;
  const expPct = 100 - incPct;

  return (
    <div style={s.container}>
      <div style={s.mainContent}>
        <main style={s.grid}>

          {/* ─── РОСТ ДОХОДА (полная ширина) ─── */}
          <section style={s.card}>
            <div onClick={() => toggle('growth')} style={s.header}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <h3 style={{ ...s.title, whiteSpace: 'nowrap' }}>Рост дохода</h3>
                {growthPct > 0 && (
                  <div style={s.badge}><Icons.Trend /> +{growthPct}%</div>
                )}
                {loading && <span style={{ color: '#4A5568', fontSize: '0.72rem' }}>загрузка...</span>}
              </div>
              <ChevronBtn isOpen={open.growth} />
            </div>

            {open.growth && (
              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <p style={{ ...s.subText, marginBottom: '1rem' }}>Доходы и расходы по месяцам</p>

                {/* Легенда */}
                {hasChart && (
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    <span style={{ color: '#00E5FF', fontSize: '0.72rem', fontWeight: '600' }}>
                      {hasLine ? '━' : '▮'} Доходы
                    </span>
                    <span style={{ color: '#F687B3', fontSize: '0.72rem', fontWeight: '600' }}>
                      {hasLine ? '╌' : '▮'} Расходы
                    </span>
                  </div>
                )}

                <div style={{ height: '280px' }}>
                  {loading ? (
                    <div style={{ color: '#4A5568', textAlign: 'center', paddingTop: '5rem', fontSize: '0.85rem' }}>Загрузка...</div>
                  ) : !hasChart ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
                      <div style={{ fontSize: '2rem' }}>📊</div>
                      <div style={{ color: '#4A5568', fontSize: '0.82rem', textAlign: 'center' }}>
                        Загрузите документы для отображения динамики
                      </div>
                    </div>
                  ) : hasLine ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={lineData}>
                        <defs>
                          <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#00E5FF" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2530" />
                        <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 11 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 11 }} tickFormatter={v => `${fmt(v)}€`} width={60} />
                        <Tooltip
                          contentStyle={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '12px', color: '#fff', fontSize: '0.82rem' }}
                          formatter={(val, name) => [`${fmt(val)} €`, name === 'v' ? 'Доходы' : 'Расходы']}
                        />
                        <Area type="monotone" dataKey="v" stroke="#00E5FF" strokeWidth={2.5} fill="url(#incGrad)" dot={{ r: 3, fill: '#00E5FF', strokeWidth: 0 }} />
                        <Line type="monotone" dataKey="e" stroke="#F687B3" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lineData.filter(d => d.v > 0 || d.e > 0)} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2530" />
                        <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 11 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4A5568', fontSize: 11 }} tickFormatter={v => `${fmt(v)}€`} width={60} />
                        <Tooltip
                          contentStyle={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '12px', color: '#fff', fontSize: '0.82rem' }}
                          formatter={(val, name) => [`${fmt(val)} €`, name === 'v' ? 'Доходы' : 'Расходы']}
                        />
                        <Bar dataKey="v" name="v" fill="#00E5FF" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="e" name="e" fill="#F687B3" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ─── ДВА БЛОКА РЯДОМ (планшет+) ─── */}
          <div className="analytics-bottom-grid" style={{ alignItems: 'start' }}>

            {/* ФИНАНСОВАЯ МОДЕЛЬ */}
            <section style={s.card}>
              <div onClick={() => toggle('model')} style={s.header}>
                <h3 style={{ ...s.title, whiteSpace: 'nowrap' }}>Финансовая модель</h3>
                <ChevronBtn isOpen={open.model} />
              </div>

              {open.model && (
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                  {/* Прогресс-бар */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ ...s.progressContainer, marginBottom: '6px' }}>
                      <div style={{ width: `${incPct}%`, background: '#10B981', height: '100%', borderRadius: '10px 0 0 10px', transition: 'width 0.4s' }} />
                      <div style={{ width: `${expPct}%`, background: '#F59E0B', height: '100%', borderRadius: '0 10px 10px 0', transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#10B981', fontSize: '0.68rem', fontWeight: '600' }}>● Доходы {incPct}%</span>
                      <span style={{ color: '#F59E0B', fontSize: '0.68rem', fontWeight: '600' }}>Расходы {expPct}% ●</span>
                    </div>
                  </div>

                  {/* Метрики */}
                  <MetricRow
                    label="Доходы"
                    value={`${fmt(metrics.income)} €`}
                    color="#68D391"
                  />
                  <MetricRow
                    label="Расходы"
                    value={`${fmt(metrics.expenses)} €`}
                    color="#FC8181"
                  />
                  <MetricRow
                    label="Норма сбережений"
                    value={`${savingsRate}%`}
                    color={savingsRate >= 20 ? '#68D391' : savingsRate >= 10 ? '#F6AD55' : '#FC8181'}
                    sub="(Доходы − Расходы) / Доходы"
                  />
                  <div style={{ paddingTop: '10px' }}>
                    <MetricRow
                      label="Рейтинг бизнеса"
                      value={`${metrics.business_score ?? 0}%`}
                      color="#00E5FF"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* НОВОСТИ И ВОЗМОЖНОСТИ */}
            <section style={s.card}>
              <div onClick={() => toggle('news')} style={s.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(0,229,255,0.06)', padding: '7px', borderRadius: '10px', display: 'flex' }}>
                    <Icons.File />
                  </div>
                  <div>
                    <h3 style={{ ...s.title, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>Новости и возможности</h3>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#4A5568' }}>4 рекомендации</p>
                  </div>
                </div>
                <ChevronBtn isOpen={open.news} />
              </div>

              {open.news && (
                <div style={{ padding: '0 1.25rem 1rem' }}>
                  <NewsRow label="Новый депозит с доходностью 8%"  color="#F59E0B" icon={NewsIcons.Deposit} />
                  <NewsRow label="Оптимизация налогов −15%"         color="#10B981" icon={NewsIcons.Tax}     />
                  <NewsRow label="Рефинансирование ипотеки"         color="#3B82F6" icon={NewsIcons.Home}    />
                  <NewsRow label="Страховой кешбэк 200 €"           color="#8B5CF6" icon={NewsIcons.Flash}   />
                </div>
              )}
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
