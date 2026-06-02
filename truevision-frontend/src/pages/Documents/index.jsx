import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { s, STATUS_LABELS, FIELD_LABELS, PAYMENT_COLORS, PAYMENT_LABELS, formatSize } from './styles';
import { ActionIcons, UIIcons } from '../../components/Icons.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import Toast from '../../components/Toast.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { useT } from '../../locales/i18n.js';

// ─── Компонент строки в списке ───────────────────────────────────────────────

function DocCard({ doc, onView, onDelete }) {
  const t = useT();
  const [hovered, setHovered] = React.useState(false);
  const paymentColor = PAYMENT_COLORS[doc.payment_status] || '#4A5568';
  return (
    <div
      style={{ ...s.card, cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s', background: hovered ? '#1a2133' : '#151B28', border: `1px solid ${hovered ? 'rgba(0,229,255,0.4)' : 'rgb(0,229,255)'}` }}
      onClick={() => onView(doc)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={s.fileIcon}>
        <ActionIcons.File size={18} />
      </div>

      {/* Имя + мета */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.fileName} title={doc.filename}>{doc.filename}</div>
        <div style={s.fileMeta}>
          {formatSize(doc.file_size) && <span>{formatSize(doc.file_size)}</span>}
          {doc.created_at && <span style={{ color: '#2D3748' }}>·</span>}
          {doc.created_at && <span>{new Date(doc.created_at).toLocaleDateString('de-DE')}</span>}
          <span style={{ color: '#2D3748' }}>·</span>
          <span style={s.badge(doc.status)}>{t[`doc_status_${doc.status}`] || STATUS_LABELS[doc.status] || doc.status}</span>
          {doc.status === 'analyzed' && (doc.doc_type || doc.extraction_result?.doc_type) === 'haushaltsbudget' && (
            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '600', background: 'rgba(0,229,255,0.1)', color: '#00E5FF', whiteSpace: 'nowrap' }}>
              📊 Бюджет
            </span>
          )}
          {doc.status === 'analyzed' && doc.payment_status && (doc.doc_type || doc.extraction_result?.doc_type) !== 'haushaltsbudget' && (
            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '600', background: `${paymentColor}20`, color: paymentColor, whiteSpace: 'nowrap' }}>
              {t[`doc_pay_${doc.payment_status}`] || PAYMENT_LABELS[doc.payment_status] || doc.payment_status}
            </span>
          )}
        </div>
      </div>

      {/* Удалить */}
      <button
        style={s.btn('destructive', false)}
        onClick={e => { e.stopPropagation(); onDelete(doc); }}
        title={t.delete}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Детальный экран ─────────────────────────────────────────────────────────

const HIGHLIGHT_KEYS = new Set(['amount', 'category', 'vendor']);
const WIDE_KEYS      = new Set(['iban', 'bic', 'empfaenger', 'rechnung_nr']);
const HIDDEN_KEYS    = new Set(['doc_type', 'events_count', 'document_type']);

const PS_CONFIG = {
  pending: { color: '#F6AD55' },
  paid:    { color: '#68D391' },
  overdue: { color: '#FC8181' },
};

function DocDetail({ doc, onBack, onAnalyzed, imported, setImported }) {
  const t = useT();
  const [viewerUrl,     setViewerUrl]     = useState(null);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [viewerOpen,    setViewerOpen]    = useState(false);
  const [analyzing,       setAnalyzing]       = useState(false);
  const [importing,       setImporting]       = useState(false);
  const [importSuccess,   setImportSuccess]   = useState(false);
  const [currentDoc,    setCurrentDoc]    = useState(doc);
  const [toast,         setToast]         = useState(null);

  const ext     = doc.filename.split('.').pop().toLowerCase();
  const isPdf   = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

  useEffect(() => {
    let alive = true;
    api.get(`/documents/${doc.id}`, { responseType: 'blob' })
      .then(r => { if (alive) setViewerUrl(URL.createObjectURL(r.data)); })
      .catch(() => {})
      .finally(() => { if (alive) setViewerLoading(false); });
    return () => { alive = false; if (viewerUrl) URL.revokeObjectURL(viewerUrl); };
  }, [doc.id]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const r = await api.post(`/documents/${doc.id}/analyze`);
      const updated = { ...currentDoc, status: 'analyzed', extraction_result: r.data.result };
      setCurrentDoc(updated);
      onAnalyzed(updated);
    } catch (e) {
      setToast({ message: 'Ошибка анализа: ' + (e.response?.data?.detail || e.message) });
    } finally {
      setAnalyzing(false);
    }
  };

  const BUDGET_KEYWORDS = ['ausgaben', 'budget', 'haushalts'];
  const isBudgetDoc = BUDGET_KEYWORDS.some(kw =>
    doc.filename.toLowerCase().includes(kw)
  );

  const handleImportBudget = async () => {
    setImporting(true);
    let prevBudget = null;
    try { prevBudget = (await api.get('/budget')).data; } catch {}
    try {
      await api.post(`/budget/import/${currentDoc.id}`);
      setImported(true);
      setImportSuccess(true);
      setToast({
        message: 'Данные импортированы в бюджет',
        type: 'success',
        onUndo: prevBudget
          ? async () => { try { await api.put('/budget', prevBudget); setImportSuccess(false); } catch {} }
          : undefined,
      });
    } catch (e) {
      setToast({ message: 'Ошибка импорта: ' + (e.response?.data?.detail || e.message) });
    } finally {
      setImporting(false);
    }
  };

  const handleImportTransactions = async () => {
    setImporting(true);
    try {
      const r = await api.post(`/documents/${currentDoc.id}/analyze`);
      const updated = { ...currentDoc, status: 'analyzed', extraction_result: r.data.result };
      setCurrentDoc(updated);
      onAnalyzed(updated);
      const count = r.data.result?.events_count ?? 0;
      setImported(true);
      setToast({ message: `Импортировано транзакций: ${count}`, type: 'success' });
    } catch (e) {
      setToast({ message: 'Ошибка импорта: ' + (e.response?.data?.detail || e.message) });
    } finally {
      setImporting(false);
    }
  };

  const handlePaymentStatus = async (newStatus) => {
    try {
      await api.patch(`/dashboard/documents/${doc.id}/payment-status?payment_status=${newStatus}`);
      const updated = { ...currentDoc, payment_status: newStatus };
      setCurrentDoc(updated);
      onAnalyzed(updated);
    } catch (e) {
      setToast({ message: 'Ошибка: ' + (e.response?.data?.detail || e.message) });
    }
  };

  const result = currentDoc.extraction_result;
  const allEntries = result && typeof result === 'object'
    ? Object.entries(result).filter(([k, v]) => !HIDDEN_KEYS.has(k) && k !== 'text' && v != null && v !== '' && String(v).trim() !== '')
    : [];

  const highlightEntries = allEntries.filter(([k]) => HIGHLIGHT_KEYS.has(k));
  const detailEntries    = allEntries.filter(([k]) => !HIGHLIGHT_KEYS.has(k));
  const isAnalyzed       = currentDoc.status === 'analyzed';
  const ps               = currentDoc.payment_status || 'pending';
  const dateStr          = currentDoc.created_at ? new Date(currentDoc.created_at).toLocaleDateString('ru-RU') : '—';

  const fmtVal = (k, v) => k === 'amount' || k === 'netto' || k === 'mwst'
    ? `${Number(v).toLocaleString('de-DE')} €`
    : String(v);

  const metricColor = { amount: '#68D391', category: '#F6AD55', vendor: '#E2E8F0' };

  return (
    <div style={s.page}>
      {toast && <Toast message={toast.message} type={toast.type} onUndo={toast.onUndo} onClose={() => setToast(null)} />}
      <button style={s.detailBack} onClick={onBack}>
        <UIIcons.ChevronLeft /> {t.doc_allDocs}
      </button>

      {/* ── Просмотр файла (коллапс) ── */}
      <div style={s.viewerOuter}>
        <div
          style={s.viewerHeader}
          onClick={() => setViewerOpen(o => !o)}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={s.viewerHeaderTitle}>{t.doc_view}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {viewerUrl && (
              <a
                href={viewerUrl}
                download={doc.filename}
                style={s.downloadLink}
                onClick={e => e.stopPropagation()}
              >
                {t.doc_download}
              </a>
            )}
            <span style={{ color: '#4A5568', fontSize: '1.1rem', lineHeight: 1, transition: 'transform 0.2s', display: 'block', transform: viewerOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▾
            </span>
          </div>
        </div>

        {viewerOpen && (
          <>
            {viewerLoading && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#4A5568' }}>{t.loading}</div>
            )}
            {!viewerLoading && !viewerUrl && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#4A5568' }}>{t.doc_loadError}</div>
            )}
            {!viewerLoading && viewerUrl && isPdf && (
              <iframe src={viewerUrl} title={doc.filename} style={{ width: '100%', height: '70vh', border: 'none', display: 'block' }} />
            )}
            {!viewerLoading && viewerUrl && isImage && (
              <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', background: '#0B0F17' }}>
                <img src={viewerUrl} alt={doc.filename} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} />
              </div>
            )}
            {!viewerLoading && viewerUrl && !isPdf && !isImage && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#4A5568', fontSize: '0.85rem' }}>
                {t.doc_noPreview}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Главная карточка ── */}
      <div style={s.infoCard}>

        {/* Hero */}
        <div style={s.cardHero}>
          <div style={s.cardHeroIcon}><ActionIcons.File size={22} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.cardTitle}>{currentDoc.filename}</div>
            <div style={s.cardMeta}>{formatSize(currentDoc.file_size)} · {dateStr}</div>
          </div>
          <span style={s.badge(currentDoc.status)}>{t[`doc_status_${currentDoc.status}`] || STATUS_LABELS[currentDoc.status] || currentDoc.status}</span>
        </div>

        {/* Баннер для бюджет-документов */}
        {isAnalyzed && currentDoc.extraction_result?.doc_type === 'haushaltsbudget' && (
          <div style={{
            margin: '0.75rem 1.5rem 0',
            background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)',
            borderRadius: '12px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>📊</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#E2E8F0', fontSize: '0.82rem', fontWeight: '600', marginBottom: '2px' }}>
                Документ распознан как план бюджета
              </div>
              <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                Данные автоматически импортированы в Планировщик бюджета. Транзакции не созданы.
              </div>
            </div>
            <a
              href="/finances?tab=budget"
              style={{
                background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)',
                borderRadius: '8px', padding: '6px 12px', color: '#00E5FF',
                fontSize: '0.75rem', fontWeight: '600', textDecoration: 'none',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              Открыть бюджет →
            </a>
          </div>
        )}

        {/* Метрики */}
        {isAnalyzed && highlightEntries.length > 0 && currentDoc.extraction_result?.doc_type !== 'haushaltsbudget' && (
          <div style={s.metricsRow}>
            {highlightEntries.map(([k, v]) => (
              <div key={k} style={s.metricBox}>
                <div style={s.metricLabel}>{FIELD_LABELS[k] || k}</div>
                <div style={{ color: metricColor[k] || '#E2E8F0', fontSize: '1rem', fontWeight: '800', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtVal(k, v)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Детали */}
        {isAnalyzed && detailEntries.length > 0 && (
          <div style={s.detailBody}>
            <div style={s.detailSectionLabel}>{t.doc_details}</div>
            <div style={s.detailFieldsGrid}>
              {detailEntries.map(([k, v]) => (
                <div key={k} style={{ ...s.detailFieldItem, ...(WIDE_KEYS.has(k) ? { gridColumn: 'span 2' } : {}) }}>
                  <span style={s.detailFieldKey}>{FIELD_LABELS[k] || k}</span>
                  <span style={{ ...s.detailFieldVal, color: ['iban','bic','rechnung_nr'].includes(k) ? '#00E5FF' : '#CBD5E0' }}>
                    {fmtVal(k, v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Статус оплаты */}
        {isAnalyzed && (
          <div style={s.paymentSection}>
            <span style={{ color: '#4A5568', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>
              {t.doc_paymentStatus}
            </span>
            {Object.entries(PS_CONFIG).map(([key, { color }]) => (
              <button
                key={key}
                onClick={() => handlePaymentStatus(key)}
                style={{
                  padding: '5px 14px', borderRadius: '20px', border: 'none',
                  cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600',
                  background: ps === key ? `${color}22` : 'rgba(255,255,255,0.04)',
                  color: ps === key ? color : '#6B7280',
                  outline: ps === key ? `1px solid ${color}55` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {t[`doc_pay_${key}`] || key}
              </button>
            ))}
          </div>
        )}

        {/* Кнопка анализа */}
        {!isAnalyzed && (
          <button style={s.analyzeBtn(analyzing)} onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? t.doc_analyzing : currentDoc.status === 'processing_failed' ? t.doc_reanalyze : t.doc_analyze}
          </button>
        )}

        {/* Импорт — бюджет или транзакции в зависимости от типа документа */}
        {isAnalyzed && isPdf && isBudgetDoc && (!imported || importSuccess) && (
          <button
            onClick={importSuccess ? undefined : handleImportBudget}
            disabled={importing || importSuccess}
            style={{
              display: 'block',
              width: 'calc(100% - 40px)',
              margin: '0 20px 18px',
              padding: '11px',
              background: importSuccess
                ? 'rgba(104,211,145,0.15)'
                : importing ? '#1E2530'
                : 'linear-gradient(90deg, #00C8A0 0%, #0070C8 100%)',
              color: importSuccess ? '#68D391' : importing ? '#4A5568' : '#0B0F17',
              border: importSuccess ? '1px solid rgba(104,211,145,0.3)' : 'none',
              borderRadius: '12px',
              fontWeight: '800', fontSize: '0.9rem',
              cursor: importing || importSuccess ? 'default' : 'pointer',
              transition: 'all 0.3s',
            }}
          >
            {importing ? '⏳ Импортируется...' : importSuccess ? '✅ Импортировано в бюджет' : '📥 Импортировать в бюджет'}
          </button>
        )}
        {isAnalyzed && isPdf && !isBudgetDoc && !imported && (
          <button
            onClick={handleImportTransactions}
            disabled={importing}
            style={{
              display: 'block',
              width: 'calc(100% - 40px)',
              margin: '0 20px 18px',
              padding: '11px',
              background: importing ? '#1E2530' : 'linear-gradient(90deg, #7C3AED 0%, #2563EB 100%)',
              color: importing ? '#4A5568' : '#fff',
              border: 'none', borderRadius: '12px',
              fontWeight: '800', fontSize: '0.9rem',
              cursor: importing ? 'not-allowed' : 'pointer',
              opacity: importing ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {importing ? '⏳ Импортируется...' : '📊 Импортировать в транзакции'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Главный компонент ───────────────────────────────────────────────────────

export default function Documents() {
  const t = useT();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [confirmDoc, setConfirmDoc] = useState(null); // { id, events_count }
  const [deleteEvents, setDeleteEvents] = useState(false);
  const [toast, setToast] = useState(null);
  const [docSearch, setDocSearch] = useState('');
  const [importedDocIds, setImportedDocIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('tv_imported_docs') || '[]')); } catch { return new Set(); }
  });
  const inputRef = useRef();

  const fetchDocs = () => {
    api.get('/documents')
      .then(r => setDocs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };


  useEffect(() => { fetchDocs(); }, []);

  const [showAllDocs, setShowAllDocs] = useState(false);
  const [dupWarning, setDupWarning] = useState(null); // { filename, existingId }

  const uploadFile = async (file) => {
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert(t.doc_onlyFormats);
      return;
    }
    setUploading(true);
    setDupWarning(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.duplicate) {
        setDupWarning({ filename: res.data.filename, existingId: res.data.existing_id });
      } else {
        fetchDocs();
      }
    } catch (e) {
      setToast({ message: 'Ошибка загрузки: ' + (e.response?.data?.detail || e.message) });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (doc) => {
    setConfirmDoc({ id: doc.id, events_count: doc.events_count || 0 });
    setDeleteEvents(false);
  };

  const confirmDelete = async () => {
    const { id } = confirmDoc;
    setConfirmDoc(null);
    try {
      await api.delete(`/documents/${id}?delete_events=${deleteEvents}`);
      setDocs(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch {
      setToast({ message: 'Ошибка удаления' });
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  // Если открыт детальный экран
  if (selectedDoc) {
    return (
      <DocDetail
        doc={selectedDoc}
        onBack={() => setSelectedDoc(null)}
        onAnalyzed={(updated) => {
          setSelectedDoc(updated);
          setDocs(prev => prev.map(d => d.id === updated.id ? updated : d));
        }}
        imported={importedDocIds.has(selectedDoc.id)}
        setImported={() => setImportedDocIds(prev => {
          const next = new Set([...prev, selectedDoc.id]);
          localStorage.setItem('tv_imported_docs', JSON.stringify([...next]));
          return next;
        })}
      />
    );
  }

  // Список документов
  return (
    <div style={s.page}>
      {confirmDoc && (
        <ConfirmModal
          title={t.doc_deleteConfirm}
          message="Это действие нельзя отменить."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDoc(null)}
        >
          {confirmDoc.events_count > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 12px', background: '#0B0F17', borderRadius: '10px', border: '1px solid #2D3748' }}>
              <input
                type="checkbox"
                checked={deleteEvents}
                onChange={e => setDeleteEvents(e.target.checked)}
                style={{ accentColor: '#FC8181', width: '15px', height: '15px' }}
              />
              <div>
                <div style={{ color: '#E2E8F0', fontSize: '0.82rem', fontWeight: '600' }}>
                  {t.doc_deleteWithEvents}
                </div>
                <div style={{ color: '#4A5568', fontSize: '0.72rem', marginTop: '2px' }}>
                  {confirmDoc.events_count} операци{confirmDoc.events_count === 1 ? 'я' : confirmDoc.events_count < 5 ? 'и' : 'й'} будут удалены
                </div>
              </div>
            </label>
          )}
        </ConfirmModal>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onUndo={toast.onUndo} onClose={() => setToast(null)} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4A5568', fontSize: '0.85rem', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={docSearch}
            onChange={e => setDocSearch(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', background: '#151B28', border: '1px solid #1E2530', borderRadius: '10px', color: '#E2E8F0', fontSize: '0.82rem', padding: '8px 12px 8px 34px', outline: 'none' }}
          />
        </div>
        <span style={{ color: '#4A5568', fontSize: '0.8rem', flexShrink: 0 }}>
          {docs.length} файл{docs.length === 1 ? '' : docs.length < 5 ? 'а' : 'ов'}
        </span>
      </div>

      <div
        style={s.uploadZone(drag || uploading)}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        <div style={{ color: '#4A5568', marginBottom: '0.75rem' }}>
          <ActionIcons.Upload />
        </div>
        <div style={{ color: '#CBD5E0', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
          {uploading ? t.doc_uploading : t.doc_uploadDrop}
        </div>
        <div style={{ color: '#4A5568', fontSize: '0.75rem' }}>{t.doc_uploadHint}</div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={(e) => uploadFile(e.target.files[0])}
        />
      </div>

      {/* Предупреждение о дубликате */}
      {dupWarning && (
        <div style={{
          background: 'rgba(246,173,85,0.08)', border: '1px solid rgba(246,173,85,0.3)',
          borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <div>
            <span style={{ color: '#F6AD55', fontWeight: '600', fontSize: '0.85rem' }}>
              {t.doc_duplicate}
            </span>
            <span style={{ color: '#CBD5E0', fontSize: '0.85rem', marginLeft: '8px' }}>
              «{dupWarning.filename}»
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => { setDupWarning(null); setSelectedDoc(docs.find(d => d.id === dupWarning.existingId) || null); }}
              style={{ background: '#1E2530', border: 'none', color: '#CBD5E0', padding: '6px 14px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}
            >
              {t.doc_openExisting}
            </button>
            <button
              onClick={() => setDupWarning(null)}
              style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {loading && Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ background: '#151B28', border: '1px solid #1E2530', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Skeleton width="36px" height="36px" radius="10px" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Skeleton width="45%" height="13px" style={{ marginBottom: '8px' }} />
            <Skeleton width="30%" height="10px" />
          </div>
          <Skeleton width="70px" height="28px" radius="8px" />
          <Skeleton width="28px" height="28px" radius="8px" />
        </div>
      ))}
      {!loading && docs.length === 0 && (
        <div style={s.empty}>{t.doc_noDocuments}</div>
      )}
      {!loading && docs.length > 0 && (() => {
        const filtered = docSearch
          ? docs.filter(d => d.filename.toLowerCase().includes(docSearch.toLowerCase()))
          : docs;
        if (filtered.length === 0)
          return <div style={s.empty}>Ничего не найдено по «{docSearch}»</div>;
        const visible = showAllDocs ? filtered : filtered.slice(0, 4);
        const hidden = filtered.length - 4;
        return (
          <>
            {visible.map(doc => (
              <DocCard key={doc.id} doc={doc} onView={setSelectedDoc} onDelete={handleDelete} />
            ))}
            {!showAllDocs && hidden > 0 && (
              <button
                onClick={() => setShowAllDocs(true)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #1E2530', borderRadius: '14px', padding: '12px', color: '#6B7280', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}
              >
                ▾ Показать ещё {hidden} {hidden === 1 ? 'документ' : hidden < 5 ? 'документа' : 'документов'}
              </button>
            )}
            {showAllDocs && filtered.length > 4 && (
              <button
                onClick={() => setShowAllDocs(false)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid #1E2530', borderRadius: '14px', padding: '12px', color: '#6B7280', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}
              >
                ▴ Свернуть
              </button>
            )}
          </>
        );
      })()}
    </div>
  );
}
