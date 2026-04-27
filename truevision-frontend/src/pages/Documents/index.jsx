import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { s, STATUS_LABELS, FIELD_LABELS, PAYMENT_COLORS, PAYMENT_LABELS, formatSize } from './styles';
import { ActionIcons, UIIcons } from '../../components/Icons.jsx';

// ─── Компонент строки в списке ───────────────────────────────────────────────

function DocCard({ doc, onView, onDelete }) {
  return (
    <div style={s.card}>
      <div style={s.fileIcon}>
        <ActionIcons.File size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.fileName} title={doc.filename}>{doc.filename}</div>
        <div style={s.fileMeta}>
          {formatSize(doc.file_size)}{doc.file_size ? ' · ' : ''}
          {doc.created_at ? new Date(doc.created_at).toLocaleDateString('ru-RU') : ''}
        </div>
      </div>
      <span style={s.badge(doc.status)}>{STATUS_LABELS[doc.status] || doc.status}</span>
      {doc.status === 'analyzed' && doc.payment_status && (
        <span style={{
          padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600',
          background: `${PAYMENT_COLORS[doc.payment_status] || '#4A5568'}20`,
          color: PAYMENT_COLORS[doc.payment_status] || '#4A5568',
          whiteSpace: 'nowrap',
        }}>
          {PAYMENT_LABELS[doc.payment_status] || doc.payment_status}
        </span>
      )}
      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
        <button style={s.btn('secondary', false)} onClick={() => onView(doc)}>
          Просмотр
        </button>
        <button style={s.btn('destructive', false)} onClick={() => onDelete(doc.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}

// ─── Детальный экран ─────────────────────────────────────────────────────────

function DocDetail({ doc, onBack, onAnalyzed }) {
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(doc);

  const ext = doc.filename.split('.').pop().toLowerCase();
  const isPdf   = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

  useEffect(() => {
    let alive = true;
    api.get(`/documents/${doc.id}`, { responseType: 'blob' })
      .then(r => { if (alive) setViewerUrl(URL.createObjectURL(r.data)); })
      .catch(() => {})
      .finally(() => { if (alive) setViewerLoading(false); });
    return () => {
      alive = false;
      if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    };
  }, [doc.id]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const r = await api.post(`/documents/${doc.id}/analyze`);
      const updated = { ...currentDoc, status: 'analyzed', extraction_result: r.data.result };
      setCurrentDoc(updated);
      onAnalyzed(updated);
    } catch (e) {
      alert('Ошибка анализа: ' + (e.response?.data?.detail || e.message));
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
      alert('Ошибка: ' + (e.response?.data?.detail || e.message));
    }
  };

  const result = currentDoc.extraction_result;
  const resultEntries = result && typeof result === 'object'
    ? Object.entries(result).filter(([k, v]) => k !== 'text' && v != null && v !== '' && String(v).trim() !== '')
    : [];

  const isAnalyzed = currentDoc.status === 'analyzed';

  return (
    <div style={s.page}>
      {/* Назад */}
      <button style={s.detailBack} onClick={onBack}>
        <UIIcons.ChevronLeft />
        Все документы
      </button>

      {/* Заголовок */}
      <div style={s.detailHeader}>
        <h2 style={s.detailTitle}>{currentDoc.filename}</h2>
        <span style={s.badge(currentDoc.status)}>{STATUS_LABELS[currentDoc.status] || currentDoc.status}</span>
      </div>

      {/* Сетка: данные слева, файл справа */}
      <div className="detail-grid" style={s.detailGrid}>

        {/* ── Левая колонка: данные ── */}
        <div style={s.infoCard}>
          <div style={s.infoSection}>
            <div style={s.infoLabel}>Файл</div>
            {[
              ['Имя',    currentDoc.filename],
              ['Размер', formatSize(currentDoc.file_size)],
              ['Дата',   currentDoc.created_at ? new Date(currentDoc.created_at).toLocaleDateString('ru-RU') : '—'],
              ['Статус', STATUS_LABELS[currentDoc.status] || currentDoc.status],
            ].map(([k, v]) => (
              <div key={k} style={s.infoRow}>
                <span style={s.infoKey}>{k}</span>
                <span style={s.infoVal}>{v}</span>
              </div>
            ))}
          </div>

          {isAnalyzed && resultEntries.length > 0 && (
            <div style={s.infoSection}>
              <div style={s.infoLabel}>Извлечённые данные</div>
              {resultEntries.map(([k, v]) => (
                <div key={k} style={s.infoRow}>
                  <span style={s.infoKey}>{FIELD_LABELS[k] || k}</span>
                  <span style={{ ...s.infoVal, color: '#00E5FF' }}>
                    {k === 'amount' ? `${Number(v).toLocaleString('de-DE')} €` : String(v)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Статус оплаты */}
          {isAnalyzed && (() => {
            const ps = currentDoc.payment_status || 'pending';
            const psConfig = {
              pending: { label: 'Ожидает оплаты', color: '#F6AD55' },
              paid:    { label: 'Оплачен',        color: '#68D391' },
              overdue: { label: 'Просрочен',       color: '#FC8181' },
            };
            const cfg = psConfig[ps] || psConfig.pending;
            return (
              <div style={s.infoSection}>
                <div style={s.infoLabel}>Статус оплаты</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(psConfig).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      onClick={() => handlePaymentStatus(key)}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', border: 'none',
                        cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600',
                        background: ps === key ? `${color}25` : '#1E2530',
                        color: ps === key ? color : '#6B7280',
                        outline: ps === key ? `1px solid ${color}60` : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {!isAnalyzed && (
            <button
              style={{ ...s.btn('primary', analyzing), width: '100%', marginTop: '0.5rem', padding: '10px' }}
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? 'Анализируется...' : 'Анализировать документ'}
            </button>
          )}

          {currentDoc.status === 'processing_failed' && (
            <button
              style={{ ...s.btn('warning', analyzing), width: '100%', marginTop: '0.5rem', padding: '10px' }}
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? 'Анализируется...' : 'Повторить анализ'}
            </button>
          )}
        </div>

        {/* ── Правая колонка: просмотр файла ── */}
        <div style={s.viewerCard}>
          <div style={s.viewerBar}>
            <span style={s.viewerBarTitle}>Просмотр файла</span>
            {viewerUrl && !isPdf && !isImage && (
              <a href={viewerUrl} download={doc.filename} style={{ color: '#00E5FF', fontSize: '0.78rem' }}>
                Скачать
              </a>
            )}
          </div>

          {viewerLoading && (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#4A5568' }}>Загрузка...</div>
          )}

          {!viewerLoading && !viewerUrl && (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#4A5568' }}>Не удалось загрузить файл</div>
          )}

          {!viewerLoading && viewerUrl && isPdf && (
            <iframe
              src={viewerUrl}
              title={doc.filename}
              style={{ width: '100%', height: '680px', border: 'none', display: 'block' }}
            />
          )}

          {!viewerLoading && viewerUrl && isImage && (
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', background: '#0B0F17' }}>
              <img
                src={viewerUrl}
                alt={doc.filename}
                style={{ maxWidth: '100%', maxHeight: '640px', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
          )}

          {!viewerLoading && viewerUrl && !isPdf && !isImage && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#4A5568', fontSize: '0.85rem' }}>
              Просмотр недоступен для этого типа файла.
            </div>
          )}
        </div>
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
  const inputRef = useRef();

  const fetchDocs = () => {
    api.get('/documents/')
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
      alert('Ошибка загрузки: ' + (e.response?.data?.detail || e.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить документ?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocs(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch {
      alert('Ошибка удаления');
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

      {loading && <div style={s.empty}>загрузка...</div>}
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
