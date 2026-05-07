import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PERIOD_LABELS = { week: 'Неделя', month: 'Месяц', year: 'Год', all: 'Всё время' };

const CAT_LABELS = {
  revenue: 'Доход', income: 'Доход',
  materials: 'Материалы', personnel: 'Персонал',
  rent: 'Аренда', insurance: 'Страховка',
  software: 'ПО', expense: 'Расход', tax: 'Налог', other: 'Прочее',
};

function fmt(n) {
  return Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export async function exportTransactionsPDF({ items, totalIncome, totalExpense, totalNet, period }) {
  const now = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const periodLabel = PERIOD_LABELS[period] || period;

  const rows = items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#F8FAFC'};">
      <td style="padding:9px 12px;font-size:12px;color:#1E2530;border-bottom:1px solid #E6EAF0">${item.date || '—'}</td>
      <td style="padding:9px 12px;font-size:12px;color:#1E2530;border-bottom:1px solid #E6EAF0">${item.vendor || '—'}</td>
      <td style="padding:9px 12px;font-size:12px;color:#555;border-bottom:1px solid #E6EAF0">${CAT_LABELS[item.category] || item.category || '—'}</td>
      <td style="padding:9px 12px;font-size:12px;color:#1E2530;text-align:right;border-bottom:1px solid #E6EAF0">${fmt(item.amount)}</td>
    </tr>
  `).join('');

  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;left:-9999px;top:0;width:794px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;';
  el.innerHTML = `
    <div style="width:794px;background:#fff;font-family:Arial,Helvetica,sans-serif;">
      <div style="background:#00E5FF;padding:14px 32px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:bold;font-size:17px;color:#0B0F17">TrueVision</span>
        <span style="font-size:11px;color:#0B0F17">Сгенерировано: ${now}</span>
      </div>
      <div style="padding:28px 32px 32px;">
        <h1 style="font-size:22px;color:#1E2530;margin:0 0 6px;font-weight:700">Отчёт по транзакциям</h1>
        <p style="color:#888;font-size:12px;margin:0 0 24px">Период: ${periodLabel} · Транзакций: ${items.length}</p>
        <div style="display:flex;gap:14px;margin-bottom:28px;">
          <div style="flex:1;background:#F5F7FA;border-radius:8px;padding:14px 16px;text-align:center;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px">Доходы</div>
            <div style="font-size:15px;font-weight:700;color:#38A169">${fmt(totalIncome)}</div>
          </div>
          <div style="flex:1;background:#F5F7FA;border-radius:8px;padding:14px 16px;text-align:center;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px">Расходы</div>
            <div style="font-size:15px;font-weight:700;color:#E53E3E">${fmt(totalExpense)}</div>
          </div>
          <div style="flex:1;background:#F5F7FA;border-radius:8px;padding:14px 16px;text-align:center;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px">Баланс</div>
            <div style="font-size:15px;font-weight:700;color:${totalNet >= 0 ? '#38A169' : '#E53E3E'}">${fmt(totalNet)}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#00E5FF;">
              <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#0B0F17;text-transform:uppercase">Дата</th>
              <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#0B0F17;text-transform:uppercase">Поставщик</th>
              <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#0B0F17;text-transform:uppercase">Категория</th>
              <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;color:#0B0F17;text-transform:uppercase">Сумма</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:24px;text-align:center;color:#bbb;font-size:10px;">
          TrueVision · Финансовый отчёт · ${now}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(el);

  try {
    const canvas = await html2canvas(el.firstElementChild, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pageW = 210;
    const pageH = 297;
    const imgW = pageW;
    const imgH = (canvas.height * pageW) / canvas.width;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    let y = 0;
    while (y < imgH) {
      if (y > 0) doc.addPage();
      doc.addImage(imgData, 'PNG', 0, -y, imgW, imgH);
      y += pageH;
    }

    doc.save(`transactions_${period}_${now.replace(/\./g, '-')}.pdf`);
  } finally {
    document.body.removeChild(el);
  }
}
