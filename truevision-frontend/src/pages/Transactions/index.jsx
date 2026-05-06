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

const isIncomeCat = c => ['revenue', 'income'].includes(c);

function pill(active, color = '#00E5FF') {
  return {
    padding: '6px 16px', borderRadius: '20px', border: 'none',
    cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600',
    background: active ? color : '#1E2530',
    color: active ? '#0B0F17' : '#6B7280',
    transition: 'all 0.2s', whiteSpace: 'nowrap',
  };
}

function fmt(n) {
  return Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AmountCell({ amount, category }) {
  const income = isIncomeCat(category);
  const tax    = category === 'tax';
  const color  = income ? '#68D391' : tax ? '#FBBF24' : '#FC8181';
  return (
    <span style={{ color, fontWeight: '700', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      {income ? '+' : '−'}{fmt(amount)} €
    </span>
  );
}

function CategoryBadge({ category }) {
  const color = TYPE_COLORS[category] || '#6B7280';
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600',
      background: `${color}22`, color, whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {CAT_LABELS[category] || category}
    </span>
  );
}

function VendorCell({ vendor }) {
  const name = vendor || '—';
  const letter = name !== '—' ? name[0].toUpperCase() : '?';
  const colors = ['#60A5FA','#68D391','#F472B6','#F6AD55','#A78BFA','#4FD1C5'];
  const color  = colors[(letter.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
      {name !== '—' && (
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
          background: `${color}22`, color, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700',
        }}>
          {letter}
        </div>
      )}
      <span style={{
        color: name === '—' ? '#4A5568' : '#E2E8F0',
        fontSize: '0.85rem', fontWeight: '500',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {name}
      </span>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const sign = value >= 0 ? '+' : '−';
  return (
    <div style={{
      background: '#151B28', border: '1px solid #1E2530', borderRadius: '16px',
      padding: '1rem 1.25rem', minWidth: 0,
    }}>
      <div style={{
        color: '#6B7280', fontSize: '0.68rem', fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px',
      }}>
        {label}
      </div>
      <div style={{
        color, fontSize: '1.25rem', fontWeight: '800',
        fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {sign}{fmt(Math.abs(value))} €
      </div>
    </div>
  );
}

const ALL_CATEGORIES = [
  { value: 'income',    label: 'Доход' },
  { value: 'revenue',   label: 'Выручка' },
  { value: 'expense',   label: 'Расход' },
  { value: 'materials', label: 'Материалы' },
  { value: 'personnel', label: 'Персонал' },
  { value: 'rent',      label: 'Аренда' },
  { value: 'insurance', label: 'Страховка' },
  { value: 'software',  label: 'ПО' },
  { value: 'tax',       label: 'Налог' },
  { value: 'other',     label: 'Прочее' },
];

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#0B0F17', border: '1px solid #2D3748', borderRadius: '10px',
  color: '#E2E8F0', fontSize: '0.85rem', padding: '9px 12px', outline: 'none',
};

function AddTransactionModal({ onClose, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    vendor: '', amount: '', category: 'expense', event_date: today, is_recurring: false,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vendor.trim()) { setError('Укажите поставщика'); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError('Укажите сумму'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/dashboard/transactions', {
        vendor: form.vendor.trim(),
        amount: Number(form.amount),
        category: form.category,
        event_date: form.event_date,
        is_recurring: form.is_recurring,
      });
      onSaved();
      onClose();
    } catch {
      setError('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: '#151B28', border: '1px solid #1E2530', borderRadius: '20px',
        padding: '1.75rem', width: '100%', maxWidth: '420px',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#E2E8F0', fontSize: '1rem', fontWeight: '700' }}>Новая транзакция</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4A5568', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Поставщик / Описание</label>
            <input style={inputStyle} placeholder="Например: Аренда офиса" value={form.vendor} onChange={e => set('vendor', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Сумма (€)</label>
              <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
            <div>
              <label style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Дата</label>
              <input style={inputStyle} type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Категория</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => set('category', e.target.value)}>
              {ALL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 12px', background: '#0B0F17', borderRadius: '10px', border: '1px solid #2D3748' }}>
            <input type="checkbox" checked={form.is_recurring} onChange={e => set('is_recurring', e.target.checked)} style={{ accentColor: '#00E5FF', width: '16px', height: '16px' }} />
            <div>
              <div style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: '600' }}>Повторяется ежемесячно</div>
              <div style={{ color: '#4A5568', fontSize: '0.72rem' }}>Будет учитываться в прогнозе и календаре</div>
            </div>
          </label>

          {error && <div style={{ color: '#FC8181', fontSize: '0.8rem', textAlign: 'center' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #2D3748', borderRadius: '10px', color: '#6B7280', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>Отмена</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', background: '#00E5FF', border: 'none', borderRadius: '10px', color: '#0B0F17', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transactions() {
  const [period,    setPeriod]    = useState('month');
  const [data,      setData]      = useState({ total: 0, items: [] });
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { download, loading: exportLoading } = useExport();

  const loadData = () => {
    setLoading(true);
    api.get(`/dashboard/transactions?period=${period}&type=all`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [period]);

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

  const filteredItems = data.items.filter(item => {
    if (search && !item.vendor?.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'all' && item.category !== category) return false;
    if (minAmount !== '' && item.amount < Number(minAmount)) return false;
    if (maxAmount !== '' && item.amount > Number(maxAmount)) return false;
    return true;
  });

  const hasActiveFilters = search || category !== 'all' || minAmount !== '' || maxAmount !== '';
  const resetFilters = () => { setSearch(''); setCategory('all'); setMinAmount(''); setMaxAmount(''); };

  const totalIncome  = filteredItems.filter(i => isIncomeCat(i.category)).reduce((s, i) => s + i.amount, 0);
  const totalExpense = filteredItems.filter(i => !isIncomeCat(i.category)).reduce((s, i) => s + i.amount, 0);
  const totalNet     = totalIncome - totalExpense;

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#0B0F17', minHeight: '100%', boxSizing: 'border-box' }}>

      {showModal && <AddTransactionModal onClose={() => setShowModal(false)} onSaved={loadData} />}

      {/* Фильтры */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Object.entries(PERIODS).map(([k, v]) => (
            <button key={k} style={pill(period === k)} onClick={() => setPeriod(k)}>{v}</button>
          ))}
        </div>
        <div style={{ width: '1px', height: '24px', background: '#1E2530', margin: '0 4px', flexShrink: 0 }} />
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              appearance: 'none', WebkitAppearance: 'none',
              background: '#1E2530', border: '1px solid #2D3748', borderRadius: '20px',
              color: category === 'all' ? '#6B7280' : '#E2E8F0',
              fontSize: '0.78rem', fontWeight: '600', padding: '6px 32px 6px 14px',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="all">Все категории</option>
            {ALL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <svg style={{ position: 'absolute', right: '11px', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: '#00E5FF', border: 'none', borderRadius: '10px',
              color: '#0B0F17', padding: '6px 14px', fontSize: '0.78rem',
              fontWeight: '700', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
            }}
          >
            + Добавить
          </button>
          <button
            onClick={() => download({ period, type: 'all' })}
            disabled={exportLoading}
            style={{
              background: 'transparent', border: '1px solid #1E2530',
              color: '#9CA3AF', padding: '6px 14px', borderRadius: '10px',
              fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
            }}
          >
            <ActionIcons.Download /> {exportLoading ? '...' : 'CSV'}
          </button>
        </div>
      </div>

      {/* Поиск и доп. фильтры */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '180px' }}>
          <span style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: '#4A5568', fontSize: '0.85rem', pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            placeholder="Поиск по поставщику..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#151B28', border: '1px solid #1E2530', borderRadius: '10px',
              color: '#E2E8F0', fontSize: '0.82rem', padding: '7px 12px 7px 34px',
              outline: 'none',
            }}
          />
        </div>

<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="number"
            placeholder="от €"
            value={minAmount}
            onChange={e => setMinAmount(e.target.value)}
            style={{
              width: '80px', background: '#151B28', border: '1px solid #1E2530',
              borderRadius: '10px', color: '#E2E8F0', fontSize: '0.82rem',
              padding: '7px 10px', outline: 'none',
            }}
          />
          <span style={{ color: '#4A5568', fontSize: '0.8rem' }}>—</span>
          <input
            type="number"
            placeholder="до €"
            value={maxAmount}
            onChange={e => setMaxAmount(e.target.value)}
            style={{
              width: '80px', background: '#151B28', border: '1px solid #1E2530',
              borderRadius: '10px', color: '#E2E8F0', fontSize: '0.82rem',
              padding: '7px 10px', outline: 'none',
            }}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            style={{
              background: 'transparent', border: '1px solid #2D3748', borderRadius: '10px',
              color: '#6B7280', fontSize: '0.78rem', fontWeight: '600',
              padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            ✕ Сбросить
          </button>
        )}
      </div>

      {/* Сводка */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.25rem' }}>
        <SummaryCard label="Доходы"  value={totalIncome}  color="#68D391" />
        <SummaryCard label="Расходы" value={-totalExpense} color="#FC8181" />
        <SummaryCard label="Итого"   value={totalNet}     color={totalNet >= 0 ? '#68D391' : '#FC8181'} />
      </div>

      {/* Подсказка */}
      <div style={{
        background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.08)',
        borderRadius: '12px', padding: '0.7rem 1rem', marginBottom: '1rem',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
      }}>
        <span style={{ color: '#00E5FF', fontSize: '0.9rem', flexShrink: 0, marginTop: '1px' }}>💡</span>
        <span style={{ color: '#6B7280', fontSize: '0.78rem', lineHeight: '1.5' }}>
          Отметьте платежи которые повторяются каждый месяц (аренда, зарплата, подписки) —
          дашборд будет показывать прогноз расходов на следующий месяц.
        </span>
      </div>

      {/* Таблица */}
      <div style={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '16px', overflow: 'hidden' }}>
        {/* Шапка */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '100px 1fr 130px 110px 140px',
          gap: '12px', padding: '0.7rem 1.25rem',
          borderBottom: '1px solid #1E2530',
          color: '#4A5568', fontSize: '0.68rem', fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          overflowX: 'auto',
        }}>
          <span>Дата</span>
          <span>Поставщик</span>
          <span>Категория</span>
          <span style={{ textAlign: 'center' }}>
            Ежемесячно
            <span title="Платёж повторяется каждый месяц" style={{ marginLeft: '4px', cursor: 'help', opacity: 0.5 }}>ℹ</span>
          </span>
          <span style={{ textAlign: 'right' }}>Сумма</span>
        </div>

        {/* Состояния */}
        {loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#4A5568', fontSize: '0.85rem' }}>
            Загрузка...
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ color: '#4A5568', fontSize: '2rem', marginBottom: '12px' }}>📭</div>
            <div style={{ color: '#4A5568', fontSize: '0.85rem' }}>
              {hasActiveFilters ? 'Нет транзакций по заданным фильтрам' : 'Нет транзакций за выбранный период'}
            </div>
          </div>
        )}

        {/* Строки */}
        {!loading && filteredItems.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 130px 110px 140px',
              gap: '12px', padding: '0.85rem 1.25rem',
              borderBottom: idx < filteredItems.length - 1 ? '1px solid #1E2530' : 'none',
              alignItems: 'center', transition: 'background 0.15s',
              overflowX: 'auto',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ color: '#6B7280', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              {item.date}
            </span>

            <VendorCell vendor={item.vendor} />

            <CategoryBadge category={item.category} />

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => toggleRecurring(item.id, item.is_recurring)}
                title={item.is_recurring ? 'Отключить' : 'Отметить как ежемесячный'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: item.is_recurring ? 'rgba(0,229,255,0.1)' : 'transparent',
                  border: `1px solid ${item.is_recurring ? 'rgba(0,229,255,0.3)' : '#2D3748'}`,
                  borderRadius: '20px', cursor: 'pointer', padding: '4px 12px',
                  color: item.is_recurring ? '#00E5FF' : '#4A5568',
                  fontSize: '0.75rem', fontWeight: '600', transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '0.6rem' }}>{item.is_recurring ? '●' : '○'}</span>
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
          {hasActiveFilters
            ? `${filteredItems.length} из ${data.total} операци${data.total === 1 ? 'и' : data.total < 5 ? 'й' : 'й'}`
            : `${data.total} операци${data.total === 1 ? 'я' : data.total < 5 ? 'и' : 'й'}`
          }
        </div>
      )}
    </div>
  );
}
