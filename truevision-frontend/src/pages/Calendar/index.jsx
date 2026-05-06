import React, { useState, useEffect } from 'react';
import api from '../../api/client';

const DAYS   = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

const CAT_COLORS = {
  revenue: '#68D391', income: '#68D391',
  materials: '#F6AD55', personnel: '#4FD1C5',
  rent: '#60A5FA', insurance: '#A78BFA',
  software: '#F472B6', expense: '#FC8181',
  tax: '#FBBF24', other: '#6B7280',
};

function fmt(n) {
  return Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const offset   = (firstDay + 6) % 7;               // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function Calendar() {
  const now = new Date();
  const [year,     setYear]     = useState(now.getFullYear());
  const [month,    setMonth]    = useState(now.getMonth());
  const [events,   setEvents]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/dashboard/transactions?period=all&type=all')
      .then(r => setEvents(r.data.items.filter(i => i.is_recurring)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(null);
  };

  // Map: day → events on that day (by day-of-month from original date)
  const dayMap = {};
  events.forEach(ev => {
    const d = parseInt((ev.date || '').split('.')[0], 10);
    if (d >= 1 && d <= 31) {
      if (!dayMap[d]) dayMap[d] = [];
      dayMap[d].push(ev);
    }
  });

  const cells = buildCalendar(year, month);
  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const monthIncome  = events.filter(e => ['revenue','income'].includes(e.category)).reduce((s,e) => s + e.amount, 0);
  const monthExpense = events.filter(e => !['revenue','income'].includes(e.category)).reduce((s,e) => s + e.amount, 0);

  const selectedEvents = selected ? (dayMap[selected] || []) : [];

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#0B0F17', minHeight: '100%', boxSizing: 'border-box' }}>

      {/* Шапка: навигация + сводка */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={prevMonth} style={navBtn}>‹</button>
          <span style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '700', minWidth: '160px', textAlign: 'center' }}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} style={navBtn}>›</button>
        </div>
        <div className="cal-summary">
          {[
            { label: 'Доходы/мес',  val: monthIncome,  color: '#68D391' },
            { label: 'Расходы/мес', val: monthExpense, color: '#FC8181' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '12px', padding: '8px 16px', minWidth: '130px' }}>
              <div style={{ color: '#6B7280', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ color, fontSize: '1rem', fontWeight: '800', marginTop: '2px' }}>{fmt(val)} €</div>
            </div>
          ))}
        </div>
      </div>

      {/* Карточка ВЫШЕ календаря */}
      {selected && selectedEvents.length > 0 ? (
        <div style={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '16px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ color: '#6B7280', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {selected} {MONTHS[month]}
            </div>
            <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>
              Итого расход: <span style={{ color: '#FC8181', fontWeight: '700' }}>
                −{fmt(selectedEvents.filter(e => !['revenue','income'].includes(e.category)).reduce((s,e) => s + e.amount, 0))} €
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {selectedEvents.map(ev => (
              <div key={ev.id} style={{
                background: '#0B0F17', border: '1px solid #1E2530', borderRadius: '12px',
                padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div>
                  <div style={{ color: '#E2E8F0', fontSize: '0.82rem', fontWeight: '600' }}>{ev.vendor || '—'}</div>
                  <span style={{
                    padding: '2px 8px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '600',
                    background: `${CAT_COLORS[ev.category] || '#6B7280'}20`,
                    color: CAT_COLORS[ev.category] || '#6B7280',
                  }}>{ev.category}</span>
                </div>
                <div style={{
                  color: ['revenue','income'].includes(ev.category) ? '#68D391' : '#FC8181',
                  fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap', marginLeft: 'auto',
                }}>
                  {['revenue','income'].includes(ev.category) ? '+' : '−'}{fmt(ev.amount)} €
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '16px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ color: '#4A5568', fontSize: '0.8rem', textAlign: 'center', lineHeight: '1.6' }}>
            {loading ? 'Загрузка...' : events.length === 0
              ? 'Нет повторяющихся платежей. Отметьте платежи в «Транзакциях» — они появятся на календаре.'
              : 'Нажмите на день с точкой, чтобы увидеть платежи'}
          </div>
        </div>
      )}

      {/* Сетка календаря — полная ширина */}
      <div style={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #1E2530' }}>
          {DAYS.map(d => (
            <div key={d} style={{ padding: '10px 0', textAlign: 'center', color: '#4A5568', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, i) => {
            const hasEvents  = day && dayMap[day]?.length > 0;
            const isToday    = isCurrentMonth && day === today;
            const isSelected = day === selected;
            const dots       = day ? (dayMap[day] || []) : [];

            return (
              <div
                key={i}
                className="cal-cell"
                onClick={() => day && setSelected(isSelected ? null : day)}
                style={{
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid #1E2530' : 'none',
                  borderBottom: i < cells.length - 7 ? '1px solid #1E2530' : 'none',
                  background: isSelected ? 'rgba(0,229,255,0.07)' : 'transparent',
                  cursor: hasEvents ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (hasEvents) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(0,229,255,0.07)' : 'transparent'; }}
              >
                {day && (
                  <>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isToday ? '#00E5FF' : 'transparent',
                      color: isToday ? '#0B0F17' : '#E2E8F0',
                      fontSize: '0.82rem', fontWeight: isToday ? '800' : '500',
                    }}>
                      {day}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
                      {dots.slice(0, 3).map((ev, j) => (
                        <div key={j} style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: CAT_COLORS[ev.category] || '#6B7280', flexShrink: 0,
                        }} />
                      ))}
                      {dots.length > 3 && (
                        <span style={{ color: '#4A5568', fontSize: '0.6rem', lineHeight: '6px' }}>+{dots.length - 3}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Легенда под календарем */}
      {events.length > 0 && (
        <div style={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '16px', padding: '1rem', marginTop: '1rem' }}>
          <div style={{ color: '#6B7280', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Повторяющиеся платежи
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {events.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: CAT_COLORS[ev.category] || '#6B7280', flexShrink: 0 }} />
                <span style={{ color: '#9CA3AF', fontSize: '0.78rem' }}>{ev.vendor || ev.category}</span>
                <span style={{ color: '#E2E8F0', fontSize: '0.78rem', fontWeight: '700' }}>{fmt(ev.amount)} €</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const navBtn = {
  background: '#151B28',
  border: '1px solid #1E2530',
  borderRadius: '8px',
  color: '#E2E8F0',
  width: '32px', height: '32px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', fontSize: '1.1rem', fontWeight: '700',
  transition: 'background 0.15s',
};
