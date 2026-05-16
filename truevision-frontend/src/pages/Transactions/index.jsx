import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Skeleton from '../../components/Skeleton.jsx';
import api, { cachedGet } from '../../api/client';
import { useExport } from '../../hooks/useExport';
import { ActionIcons } from '../../components/Icons.jsx';
import { exportTransactionsPDF } from '../../utils/exportPDF';
import { useT } from '../../locales/i18n.js';

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
  const t = useT();
  const color = TYPE_COLORS[category] || '#6B7280';
  const label = t[`cat_${category}`] || category;
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600', background: `${color}22`, color, whiteSpace: 'nowrap', display: 'inline-block' }}>
      {label}
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

const CAT_KEYS = ['income','revenue','expense','materials','personnel','rent','insurance','software','tax','other'];

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#0B0F17', border: '1px solid #2D3748', borderRadius: '10px',
  color: '#E2E8F0', fontSize: '0.85rem', padding: '9px 12px', outline: 'none',
};

function AddTransactionModal({ onClose, onSaved }) {
  const t = useT();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    vendor: '', amount: '', category: 'expense', event_date: today, is_recurring: false,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vendor.trim()) { setError(t.tr_vendorRequired); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError(t.tr_amountRequired); return; }
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
      setError(t.error);
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
          <h3 style={{ margin: 0, color: '#E2E8F0', fontSize: '1rem', fontWeight: '700' }}>{t.tr_modalTitle}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4A5568', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.tr_vendorLabel}</label>
            <input style={inputStyle} placeholder={t.tr_vendorPlaceholder} value={form.vendor} onChange={e => set('vendor', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.tr_amountLabel}</label>
              <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
            <div>
              <label style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.tr_dateLabel}</label>
              <input style={inputStyle} type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.tr_categoryLabel}</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => set('category', e.target.value)}>
              {CAT_KEYS.map(k => <option key={k} value={k}>{t[`cat_${k}`] || k}</option>)}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 12px', background: '#0B0F17', borderRadius: '10px', border: '1px solid #2D3748' }}>
            <input type="checkbox" checked={form.is_recurring} onChange={e => set('is_recurring', e.target.checked)} style={{ accentColor: '#00E5FF', width: '16px', height: '16px' }} />
            <div>
              <div style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: '600' }}>{t.tr_recurringLabel}</div>
              <div style={{ color: '#4A5568', fontSize: '0.72rem' }}>{t.tr_recurringSub}</div>
            </div>
          </label>

          {error && <div style={{ color: '#FC8181', fontSize: '0.8rem', textAlign: 'center' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #2D3748', borderRadius: '10px', color: '#6B7280', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>{t.cancel}</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', background: '#00E5FF', border: 'none', borderRadius: '10px', color: '#0B0F17', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? t.tr_savingBtn : t.tr_saveBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transactions() {
  const t = useT();
  const PERIODS = { week: t.week, month: t.month, year: t.year, all: t.allTime };
  const [searchParams] = useSearchParams();
  const [period,    setPeriod]    = useState('month');
  const [data,      setData]      = useState({ total: 0, items: [] });
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState(searchParams.get('category') || 'all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { download, loading: exportLoading } = useExport();

  const loadData = () => {
    setLoading(true);
    cachedGet(`/dashboard/transactions?period=${period}&type=all`)
      .then(data => setData(data))
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
    if (category !== 'all' && (category === 'income' ? !isIncomeCat(item.category) : item.category !== category)) return false;
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
            <option value="all">{t.tr_allCategories}</option>
            {CAT_KEYS.map(k => <option key={k} value={k}>{t[`cat_${k}`] || k}</option>)}
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
            {t.tr_addBtn}
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
          <button
            onClick={() => exportTransactionsPDF({ items: filteredItems, totalIncome, totalExpense, totalNet, period })}
            style={{
              background: 'transparent', border: '1px solid #1E2530',
              color: '#9CA3AF', padding: '6px 14px', borderRadius: '10px',
              fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
            }}
          >
            <ActionIcons.Download /> PDF
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
            placeholder={t.tr_searchPlaceholder}
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
            placeholder={t.tr_from}
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
            placeholder={t.tr_to}
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
            {t.tr_resetFilters}
          </button>
        )}
      </div>

      {/* Сводка */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.25rem' }}>
        <SummaryCard label={t.tr_totalIncome}   value={totalIncome}   color="#68D391" />
        <SummaryCard label={t.tr_totalExpenses} value={-totalExpense}  color="#FC8181" />
        <SummaryCard label={t.tr_totalNet}      value={totalNet}       color={totalNet >= 0 ? '#68D391' : '#FC8181'} />
      </div>

      {/* Подсказка */}
      <div style={{
        background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.08)',
        borderRadius: '12px', padding: '0.7rem 1rem', marginBottom: '1rem',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
      }}>
        <span style={{ color: '#00E5FF', fontSize: '0.9rem', flexShrink: 0, marginTop: '1px' }}>💡</span>
        <span style={{ color: '#6B7280', fontSize: '0.78rem', lineHeight: '1.5' }}>
          {t.tr_recurringHint}
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
          <span>{t.tr_colDate}</span>
          <span>{t.tr_colVendor}</span>
          <span>{t.tr_colCategory}</span>
          <span style={{ textAlign: 'center' }}>
            {t.tr_colRecurring}
            <span title={t.tr_recurringLabel} style={{ marginLeft: '4px', cursor: 'help', opacity: 0.5 }}>ℹ</span>
          </span>
          <span style={{ textAlign: 'right' }}>{t.tr_colAmount}</span>
        </div>

        {/* Состояния */}
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 130px 110px 140px', gap: '12px', padding: '0.85rem 1.25rem', borderBottom: '1px solid #1E2530', alignItems: 'center' }}>
            <Skeleton width="70px" height="12px" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Skeleton width="30px" height="30px" radius="50%" style={{ flexShrink: 0 }} />
              <Skeleton width="60%" height="12px" />
            </div>
            <Skeleton width="80px" height="22px" radius="20px" />
            <Skeleton width="50px" height="22px" radius="20px" style={{ margin: '0 auto' }} />
            <Skeleton width="90px" height="12px" style={{ marginLeft: 'auto' }} />
          </div>
        ))}

        {!loading && filteredItems.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ color: '#4A5568', fontSize: '2rem', marginBottom: '12px' }}>📭</div>
            <div style={{ color: '#4A5568', fontSize: '0.85rem' }}>
              {hasActiveFilters ? t.tr_noResults : t.tr_noPeriod}
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
                title={item.is_recurring ? t.tr_disableRecurring : t.tr_enableRecurring}
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
                {item.is_recurring ? t.tr_isRecurring : t.tr_notRecurring}
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
