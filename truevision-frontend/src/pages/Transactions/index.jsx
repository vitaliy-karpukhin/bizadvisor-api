import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useExport } from '../../hooks/useExport';
import { ActionIcons } from '../../components/Icons.jsx';

const PERIODS = { week: 'Неделя', month: 'Месяц', year: 'Год', all: 'Всё время' };
const TYPES   = { all: 'Все', income: 'Доходы', expense: 'Расходы', tax: 'Налоги' };

const CAT_LABELS = {
  revenue: 'Доход', income: 'Доход',
  materials: 'Материалы', personnel: 'Персонал',
  rent: 'Аренда', insurance: 'Страховка',
  software: 'ПО', expense: 'Расход', tax: 'Налог', other: 'Прочее',
};

const TYPE_COLORS = {
  revenue: '#68D391', income: '#68D391',
  materials: '#F6AD55', personnel: '#4FD1C5',
  rent: '#60A5FA', insurance: '#A78BFA',
  software: '#F472B6', expense: '#FC8181',
  tax: '#FBBF24', other: '#6B7280',
};

const pill = (active, color = '#00E5FF') => ({
  padding: '6px 14px', borderRadius: '20px', border: 'none',
  cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600',
  background: active ? color : '#1E2530',
  color: active ? '#0B0F17' : '#6B7280',
  transition: 'all 0.2s', whiteSpace: 'nowrap',
});

function AmountCell({ amount, category }) {
  const isIncome = ['revenue', 'income'].includes(category);
  const isTax    = category === 'tax';
  const color = isIncome ? '#68D391' : isTax ? '#FBBF24' : '#FC8181';
  const sign  = isIncome ? '+' : '−';
  return (
    <span style={{ color, fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>
      {sign}{Number(amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
    </span>
  );
}

function CategoryBadge({ category }) {
  const color = TYPE_COLORS[category] || '#6B7280';
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600',
      background: `${color}20`, color, whiteSpace: 'nowrap',
    }}>
      {CAT_LABELS[category] || category}
    </span>
  );
}

export default function Transactions() {
  const [period,  setPeriod]  = useState('month');
  const [type,    setType]    = useState('all');
  const [data,    setData]    = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const { download, loading: exportLoading } = useExport();

  const fetchData = () => {
    setLoading(true);
    api.get(`/dashboard/transactions?period=${period}&type=${type}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [period, type]); // eslint-disable-line

  const toggleRecurring = async (id, current) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, is_recurring: !current } : i),
    }));
    try {
      await api.patch(`/dashboard/transactions/${id}/recurring?is_recurring=${!current}`);
    } catch {
      setData(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === id ? { ...i, is_recurring: current } : i),
      }));
    }
  };

  const totalIncome  = data.items.filter(i => ['revenue','income'].includes(i.category)).reduce((s,i) => s + i.amount, 0);
  const totalExpense = data.items.filter(i => !['revenue','income'].includes(i.category)).reduce((s,i) => s + i.amount, 0);

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#0B0F17', minHeight: '100%', boxSizing: 'border-box' }}>

      {/* Фильтры */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Object.entries(PERIODS).map(([k, v]) => (
            <button key={k} style={pill(period === k)} onClick={() => setPeriod(k)}>{v}</button>
          ))}
        </div>
        <div style={{ width: '1px', height: '24px', background: '#1E2530', margin: '0 4px' }} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Object.entries(TYPES).map(([k, v]) => (
            <button key={k} style={pill(type === k, k === 'income' ? '#68D391' : k === 'expense' ? '#FC8181' : k === 'tax' ? '#FBBF24' : '#00E5FF')} onClick={() => setType(k)}>{v}</button>
          ))}
        </div>
        <button
          onClick={() => download({ period, type: type === 'all' ? 'all' : type === 'tax' ? 'expense' : type })}
          disabled={exportLoading}
          style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #1E2530', color: '#9CA3AF', padding: '6px 14px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ActionIcons.Download /> {exportLoading ? '...' : 'CSV'}
        </button>
      </div>

      {/* Сводка */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Доходы',  val: totalIncome,             color: '#68D391' },
          { label: 'Расходы', val: totalExpense,             color: '#FC8181' },
          { label: 'Итого',   val: totalIncome - totalExpense, color: totalIncome >= totalExpense ? '#68D391' : '#FC8181' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '16px', padding: '1rem 1.25rem' }}>
            <div style={{ color: '#6B7280', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
            <div style={{ color, fontSize: '1.3rem', fontWeight: '800', fontVariantNumeric: 'tabular-nums' }}>
              {val >= 0 ? '+' : '−'}{Math.abs(val).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </div>
          </div>
        ))}
      </div>

      {/* Подсказка */}
      <div style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)', borderRadius: '12px', padding: '0.75rem 1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: '#00E5FF', fontSize: '1rem' }}>💡</span>
        <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>
          Отметьте платежи которые повторяются каждый месяц (аренда, зарплата, подписки) — и дашборд будет показывать прогноз расходов на следующий месяц.
        </span>
      </div>

      {/* Таблица */}
      <div style={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '16px', overflow: 'hidden' }}>
        {/* Заголовок таблицы */}
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 140px 100px 130px', gap: '1rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid #1E2530', color: '#4A5568', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>Дата</span>
          <span>Поставщик</span>
          <span>Категория</span>
          <span style={{ textAlign: 'center' }}>
            Ежемесячно
            <span title="Платёж повторяется каждый месяц" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.6 }}>ℹ</span>
          </span>
          <span style={{ textAlign: 'right' }}>Сумма</span>
        </div>

        {loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#4A5568', fontSize: '0.85rem' }}>загрузка...</div>
        )}

        {!loading && data.items.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#4A5568', fontSize: '0.85rem' }}>
            Нет транзакций за выбранный период
          </div>
        )}

        {!loading && data.items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'grid', gridTemplateColumns: '110px 1fr 140px 100px 130px',
              gap: '1rem', padding: '0.85rem 1.25rem',
              borderBottom: idx < data.items.length - 1 ? '1px solid #1E2530' : 'none',
              alignItems: 'center', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>{item.date}</span>
            <span style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.vendor}
            </span>
            <CategoryBadge category={item.category} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => toggleRecurring(item.id, item.is_recurring)}
                title={item.is_recurring ? 'Нажмите чтобы отключить' : 'Нажмите чтобы отметить как ежемесячный'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: item.is_recurring ? 'rgba(0,229,255,0.1)' : 'transparent',
                  border: `1px solid ${item.is_recurring ? 'rgba(0,229,255,0.35)' : '#2D3748'}`,
                  borderRadius: '20px', cursor: 'pointer', padding: '4px 12px',
                  color: item.is_recurring ? '#00E5FF' : '#4A5568',
                  fontSize: '0.75rem', fontWeight: '600', transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '0.65rem' }}>{item.is_recurring ? '●' : '○'}</span>
                {item.is_recurring ? 'Да' : 'Нет'}
              </button>
            </div>
            <div style={{ textAlign: 'right' }}>
              <AmountCell amount={item.amount} category={item.category} />
            </div>
          </div>
        ))}
      </div>

      {data.total > 0 && (
        <div style={{ textAlign: 'center', color: '#4A5568', fontSize: '0.75rem', marginTop: '1rem' }}>
          {data.total} операци{data.total === 1 ? 'я' : data.total < 5 ? 'и' : 'й'}
        </div>
      )}
    </div>
  );
}
