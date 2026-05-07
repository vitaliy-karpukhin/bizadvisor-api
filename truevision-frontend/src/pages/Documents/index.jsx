import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { s, STATUS_LABELS, FIELD_LABELS, PAYMENT_COLORS, PAYMENT_LABELS, formatSize } from './styles';
import { ActionIcons, UIIcons } from '../../components/Icons.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import Toast from '../../components/Toast.jsx';
import Skeleton from '../../components/Skeleton.jsx';

// ─── Компонент строки в списке ───────────────────────────────────────────────

function DocCard({ doc, onView, onDelete }) {
  const paymentColor = PAYMENT_COLORS[doc.payment_status] || '#4A5568';
  return (
    <div style={s.card}>
      <div style={s.fileIcon}>
        <ActionIcons.File size={18} />
      </div>

      {/* Имя + мета */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.fileName} title={doc.filename}>{doc.filename}</div>
        <div style={s.fileMeta}>
          {formatSize(doc.file_size) && <span>{formatSize(doc.file_size)}</span>}
          {doc.created_at && <span style={{ color: '#2D3748' }}>·</span>}
          {doc.created_at && <span>{new Date(doc.created_at).toLocaleDateString('ru-RU')}</span>}
          <span style={{ color: '#2D3748' }}>·</span>
          <span style={s.badge(doc.status)}>{STATUS_LABELS[doc.status] || doc.status}</span>
          {doc.status === 'analyzed' && doc.payment_status && (
            <span style={{
              padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '600',
              background: `${paymentColor}20`, color: paymentColor, whiteSpace: 'nowrap',
            }}>
              {PAYMENT_LABELS[doc.payment_status] || doc.payment_status}
            </span>
          )}
        </div>
      </div>

      {/* Кнопки */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button style={s.btn('secondary', false)} onClick={() => onView(doc)}>Просмотр</button>
        <button
          style={s.btn('destructive', false)}
          onClick={() => onDelete(doc)}
          title="Удалить"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Детальный экран ─────────────────────────────────────────────────────────

const HIGHLIGHT_KEYS = new Set(['amount', 'category', 'vendor']);
const WIDE_KEYS      = new Set(['iban', 'bic', 'empfaenger', 'rechnung_nr']);

const PS_CONFIG = {
  pending: { label: 'Ожидает оплаты', color: '#F6AD55' },
  paid:    { label: 'Оплачен',        color: '#68D391' },
  overdue: { label: 'Просрочен',      color: '#FC8181' },
};

function DocDetail({ doc, onBack, onAnalyzed }) {
  const [viewerUrl,     setViewerUrl]     = useState(null);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [viewerOpen,    setViewerOpen]    = useState(false);
  const [analyzing,     setAnalyzing]     = useState(false);
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
      setToast('Ошибка анализа: ' + (e.response?.data?.detail || e.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePaymentStatus = async (newStatus) => {
    try {
      await api.patch(`/dashboard/documents/${doc.id}/payment-status?payment_status=${newStatus}`);
      const updated = { ...currentDoc, payment_status: newStatus };
      setCurrentDoc(updated);
      onAnalyzed(updated);
    } catch (e) {
      setToast('Ошибка: ' + (e.response?.data?.detail || e.message));
    }
  };

  const result = currentDoc.extraction_result;
  const allEntries = result && typeof result === 'object'
    ? Object.entries(result).filter(([k, v]) => k !== 'text' && v != null && v !== '' && String(v).trim() !== '')
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
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <button style={s.detailBack} onClick={onBack}>
        <UIIcons.ChevronLeft /> Все документы
      </button>

      {/* ── Просмотр файла (коллапс) ── */}
      <div style={s.viewerOuter}>
        <div
          style={s.viewerHeader}
          onClick={() => setViewerOpen(o => !o)}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={s.viewerHeaderTitle}>Просмотр файла</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {viewerUrl && (
              <a
                href={viewerUrl}
                download={doc.filename}
                style={s.downloadLink}
                onClick={e => e.stopPropagation()}
              >
                ↓ Скачать
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
              <div style={{ padding: '3rem', textAlign: 'center', color: '#4A5568' }}>Загрузка...</div>
            )}
            {!viewerLoading && !viewerUrl && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#4A5568' }}>Не удалось загрузить файл</div>
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
                Просмотр недоступен для этого типа файла.
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
          <span style={s.badge(currentDoc.status)}>{STATUS_LABELS[currentDoc.status] || currentDoc.status}</span>
        </div>

        {/* Метрики */}
        {isAnalyzed && highlightEntries.length > 0 && (
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
            <div style={s.detailSectionLabel}>Детали</div>
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
              Статус оплаты
            </span>
            {Object.entries(PS_CONFIG).map(([key, { label, color }]) => (
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
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Кнопка анализа */}
        {!isAnalyzed && (
          <button style={s.analyzeBtn(analyzing)} onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? 'Анализируется...' : currentDoc.status === 'processing_failed' ? 'Повторить анализ' : 'Анализировать документ'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Главный компонент ───────────────────────────────────────────────────────

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [confirmDoc, setConfirmDoc] = useState(null); // { id, events_count }
  const [deleteEvents, setDeleteEvents] = useState(false);
  const [toast, setToast] = useState(null);
  const inputRef = useRef();

  const fetchDocs = () => {
    api.get('/documents')
      .then(r => setDocs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };


  useEffect(() => { fetchDocs(); }, []);

  const [dupWarning, setDupWarning] = useState(null); // { filename, existingId }

  const uploadFile = async (file) => {
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Поддерживаются только PDF, JPG, PNG');
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
      setToast('Ошибка загрузки: ' + (e.response?.data?.detail || e.message));
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
      setToast('Ошибка удаления');
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
      />
    );
  }

  // Список документов
  return (
    <div style={s.page}>
      {confirmDoc && (
        <ConfirmModal
          title="Удалить документ?"
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
                  Удалить связанные транзакции
                </div>
                <div style={{ color: '#4A5568', fontSize: '0.72rem', marginTop: '2px' }}>
                  {confirmDoc.events_count} операци{confirmDoc.events_count === 1 ? 'я' : confirmDoc.events_count < 5 ? 'и' : 'й'} будут удалены
                </div>
              </div>
            </label>
          )}
        </ConfirmModal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <span style={{ color: '#4A5568', fontSize: '0.8rem' }}>
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
          {uploading ? 'Загружается...' : 'Перетащите файл или нажмите для выбора'}
        </div>
        <div style={{ color: '#4A5568', fontSize: '0.75rem' }}>PDF, JPG, PNG — счета, договоры, акты</div>
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
              ⚠ Документ уже загружен:
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
              Открыть существующий
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
        <div style={s.empty}>Нет документов. Загрузите первый счёт или договор.</div>
      )}
      {!loading && docs.map(doc => (
        <DocCard
          key={doc.id}
          doc={doc}
          onView={setSelectedDoc}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
