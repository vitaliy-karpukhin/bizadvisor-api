import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export function exportTransactionsPDF({ items, totalIncome, totalExpense, totalNet, period }) {
  const now = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const periodLabel = PERIOD_LABELS[period] || period;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const accent = [0, 229, 255];
  const dark = [11, 15, 23];

  // Header bar
  doc.setFillColor(...accent);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...dark);
  doc.text('TrueVision', 12, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Сгенерировано: ${now}`, pageW - 12, 12, { align: 'right' });

  // Title
  doc.setTextColor(30, 37, 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Отчёт по транзакциям', 12, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Период: ${periodLabel}  ·  Транзакций: ${items.length}`, 12, 37);

  // Summary boxes
  const boxY = 43;
  const boxH = 16;
  const boxW = (pageW - 24 - 8) / 3;
  const summaries = [
    { label: 'Доходы', value: fmt(totalIncome), color: [56, 161, 105] },
    { label: 'Расходы', value: fmt(totalExpense), color: [229, 62, 62] },
    { label: 'Баланс', value: fmt(totalNet), color: totalNet >= 0 ? [56, 161, 105] : [229, 62, 62] },
  ];
  summaries.forEach((s, i) => {
    const x = 12 + i * (boxW + 4);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, boxY, boxW, boxH, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.text(s.label.toUpperCase(), x + boxW / 2, boxY + 5.5, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...s.color);
    doc.text(s.value, x + boxW / 2, boxY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  // Table
  autoTable(doc, {
    startY: boxY + boxH + 6,
    head: [['Дата', 'Поставщик', 'Категория', 'Сумма']],
    body: items.map(item => [
      item.date || '—',
      item.vendor || '—',
      CAT_LABELS[item.category] || item.category || '—',
      fmt(item.amount),
    ]),
    headStyles: {
      fillColor: accent,
      textColor: dark,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [30, 37, 48] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 3: { halign: 'right' } },
    margin: { left: 12, right: 12 },
  });

  // Footer
  const finalY = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(7);
  doc.setTextColor(187, 187, 187);
  doc.text(`TrueVision · Финансовый отчёт · ${now}`, pageW / 2, finalY, { align: 'center' });

  doc.save(`transactions_${period}_${now.replace(/\./g, '-')}.pdf`);
}
