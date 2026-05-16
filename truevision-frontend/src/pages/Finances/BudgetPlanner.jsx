import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/client';
import { useT } from '../../locales/i18n.js';
import { useLang } from '../../context/LangContext.jsx';

const COLORS = ['#4FD1C5', '#68D391', '#F6AD55', '#B794F4', '#60A5FA', '#F472B6'];

// Заменяет лейблы дефолтных категорий/статей на текущий язык.
// Пользовательские категории (id не в дефолтах) остаются нетронутыми.
function localizeBudget(budget, t) {
  const catMap = {};
  t.bud_defaultCategories.forEach(cat => {
    catMap[cat.id] = { label: cat.label, items: {} };
    cat.items.forEach(item => { catMap[cat.id].items[item.id] = item.label; });
  });
  return {
    ...budget,
    categories: budget.categories.map(cat => {
      const def = catMap[cat.id];
      if (!def) return cat;
      return {
        ...cat,
        label: def.label,
        items: cat.items.map(item => {
          const defLabel = def.items[item.id];
          return defLabel ? { ...item, label: defLabel } : item;
        }),
      };
    }),
  };
}

function fmt(n) {
  return Number(n || 0).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function CategoryCard({ cat, index, onChange, onDelete, onAddItem, onDeleteItem, t }) {
  const color = cat.color || COLORS[index % COLORS.length];
  const total = cat.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return (
    <div style={{
      background: '#151B28',
      borderRadius: '20px',
      border: `1px solid #1E2530`,
      borderTop: `3px solid ${color}`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Заголовок категории */}
      <div style={{
        padding: '1rem 1.2rem 0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid #1E2530',
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: color, flexShrink: 0,
        }} />
        <input
          value={cat.label}
          onChange={e => onChange({ ...cat, label: e.target.value })}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontSize: '0.95rem', fontWeight: '700',
          }}
          placeholder={t.bud_catPlaceholder}
        />
        <span style={{ color, fontWeight: '800', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
          {fmt(total)} €
        </span>
        <button
          onClick={onDelete}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#374151', fontSize: '1rem', lineHeight: 1, padding: '2px 4px',
          }}
          title="Удалить категорию"
        >×</button>
      </div>

      {/* Список статей */}
      <div style={{ padding: '0.5rem 1.2rem' }}>
        {cat.items.map((item) => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '7px 0',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: `${color}66`, flexShrink: 0,
            }} />
            <input
              value={item.label}
              onChange={e => onChange({
                ...cat,
                items: cat.items.map(i => i.id === item.id ? { ...i, label: e.target.value } : i),
              })}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#CBD5E0', fontSize: '0.85rem',
              }}
              placeholder={t.bud_itemPlaceholder}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                min="0"
                value={item.amount || ''}
                onChange={e => onChange({
                  ...cat,
                  items: cat.items.map(i => i.id === item.id
                    ? { ...i, amount: parseFloat(e.target.value) || 0 }
                    : i
                  ),
                })}
                style={{
                  width: '90px', background: '#0B0F17',
                  border: '1px solid #1E2530', borderRadius: '8px',
                  color: '#fff', fontSize: '0.85rem', fontWeight: '600',
                  padding: '5px 8px', outline: 'none', textAlign: 'right',
                }}
                placeholder="0"
              />
              <span style={{ color: '#4A5568', fontSize: '0.8rem' }}>€</span>
            </div>
            <button
              onClick={() => onDeleteItem(item.id)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#374151', fontSize: '0.9rem', lineHeight: 1, padding: '2px',
              }}
            >×</button>
          </div>
        ))}
      </div>

      {/* Кнопка добавить */}
      <button
        onClick={onAddItem}
        style={{
          margin: '0.5rem 1.2rem 0.9rem',
          background: 'transparent',
          border: `1px dashed ${color}44`,
          borderRadius: '10px',
          color: color,
          fontSize: '0.78rem',
          fontWeight: '600',
          padding: '6px 12px',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {t.bud_addItem}
      </button>
    </div>
  );
}

export default function BudgetPlanner({ monthlyIncome }) {
  const t = useT();
  const { lang } = useLang();
  const [budget, setBudget] = useState(null);
  const rawBudget = useRef(null); // сырые данные из БД (без локализации)
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);

  // Загрузка один раз
  useEffect(() => {
    api.get('/budget')
      .then(r => {
        const data = r.data;
        const withCats = data.categories?.length
          ? data
          : { ...data, categories: t.bud_defaultCategories };
        rawBudget.current = withCats;
        setBudget(localizeBudget(withCats, t));
      })
      .catch(console.error);
  }, []);

  // Повторная локализация при смене языка
  useEffect(() => {
    if (rawBudget.current) {
      setBudget(prev => prev ? localizeBudget(prev, t) : prev);
    }
  }, [lang]);

  const autosave = useCallback((next) => {
    clearTimeout(saveTimer.current);
    setSaved(false);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await api.put('/budget', next);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    }, 1200);
  }, []);

  const update = useCallback((next) => {
    setBudget(next);
    autosave(next);
  }, [autosave]);

  const updateCategory = (idx, cat) => {
    const cats = budget.categories.map((c, i) => i === idx ? cat : c);
    update({ ...budget, categories: cats });
  };

  const deleteCategory = (idx) => {
    update({ ...budget, categories: budget.categories.filter((_, i) => i !== idx) });
  };

  const addCategory = () => {
    const newCat = {
      id: uid(),
      label: t.bud_newCategory,
      color: COLORS[budget.categories.length % COLORS.length],
      items: [],
    };
    update({ ...budget, categories: [...budget.categories, newCat] });
  };

  if (!budget) {
    return <div style={{ color: '#4A5568', textAlign: 'center', paddingTop: '3rem', fontSize: '0.9rem' }}>{t.bud_loading}</div>;
  }

  const totalExpenses = budget.categories.reduce(
    (s, cat) => s + cat.items.reduce((ss, i) => ss + (Number(i.amount) || 0), 0),
    0
  );
  const income = monthlyIncome || budget.income || 0;
  const surplus = income - totalExpenses;
  const surplusColor = surplus >= 0 ? '#68D391' : '#FC8181';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Строка "доход + статус сохранения" */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#151B28', border: '1px solid #1E2530',
          borderRadius: '14px', padding: '10px 16px',
        }}>
          <span style={{ color: '#6B7280', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
            {t.bud_monthlyIncome}
          </span>
          <input
            type="number"
            min="0"
            value={budget.income || ''}
            onChange={e => update({ ...budget, income: parseFloat(e.target.value) || 0 })}
            style={{
              width: '110px', background: '#0B0F17',
              border: '1px solid #1E2530', borderRadius: '8px',
              color: '#fff', fontSize: '0.9rem', fontWeight: '700',
              padding: '5px 10px', outline: 'none', textAlign: 'right',
            }}
            placeholder="0"
          />
          <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>€</span>
        </div>

        {/* Сводка */}
        <div style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1,
        }}>
          {[
            { label: t.bud_expenses, val: totalExpenses, color: '#FC8181' },
            { label: t.bud_remainder, val: surplus, color: surplusColor },
          ].map(({ label, val, color }) => (
            <div key={label} style={{
              background: '#151B28', border: '1px solid #1E2530',
              borderRadius: '14px', padding: '10px 20px',
              display: 'flex', flexDirection: 'column', gap: '2px',
            }}>
              <span style={{ color: '#6B7280', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </span>
              <span style={{ color, fontWeight: '800', fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums' }}>
                {surplus < 0 && label === 'Остаток' ? '−' : ''}{fmt(Math.abs(val))} €
              </span>
            </div>
          ))}
        </div>

        {/* Статус сохранения */}
        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: saved ? '#68D391' : '#4A5568' }}>
          {saving ? t.saving : saved ? t.saved : ''}
        </div>
      </div>

      {/* Прогресс-бар расходов */}
      {income > 0 && (
        <div style={{
          background: '#151B28', borderRadius: '12px',
          border: '1px solid #1E2530', padding: '12px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: '600' }}>
              {t.bud_used}
            </span>
            <span style={{ color: surplus >= 0 ? '#68D391' : '#FC8181', fontSize: '0.75rem', fontWeight: '700' }}>
              {Math.min(Math.round((totalExpenses / income) * 100), 999)}%
            </span>
          </div>
          <div style={{ height: '6px', background: '#1E2530', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min((totalExpenses / income) * 100, 100)}%`,
              background: surplus >= 0
                ? 'linear-gradient(90deg, #4FD1C5, #68D391)'
                : 'linear-gradient(90deg, #F6AD55, #FC8181)',
              borderRadius: '10px',
              transition: 'width 0.4s ease',
            }} />
          </div>
          {/* Мини-полоски по категориям */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
            {budget.categories.map((cat, i) => {
              const catTotal = cat.items.reduce((s, item) => s + (Number(item.amount) || 0), 0);
              const pct = income > 0 ? Math.round((catTotal / income) * 100) : 0;
              if (catTotal === 0) return null;
              return (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color || COLORS[i % COLORS.length] }} />
                  <span style={{ color: '#6B7280', fontSize: '0.7rem' }}>{cat.label}: {pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Сетка категорий */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
      }}>
        {budget.categories.map((cat, idx) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            index={idx}
            t={t}
            onChange={(updated) => updateCategory(idx, updated)}
            onDelete={() => deleteCategory(idx)}
            onAddItem={() => updateCategory(idx, { ...cat, items: [...cat.items, { id: uid(), label: '', amount: 0 }] })}
            onDeleteItem={(itemId) => updateCategory(idx, { ...cat, items: cat.items.filter(i => i.id !== itemId) })}
          />
        ))}

        {/* Кнопка добавить категорию */}
        <button
          onClick={addCategory}
          style={{
            background: 'transparent',
            border: '1px dashed #1E2530',
            borderRadius: '20px',
            color: '#4A5568',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '120px',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#00E5FF44'; e.currentTarget.style.color = '#00E5FF'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E2530'; e.currentTarget.style.color = '#4A5568'; }}
        >
          <span style={{ fontSize: '1.2rem' }}>+</span>
          {t.bud_addCategory}
        </button>
      </div>
    </div>
  );
}
