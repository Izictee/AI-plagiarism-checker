import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, Type, File } from 'lucide-react';

const MAX_CHARS = 50000;

export default function UploadForm({ onSubmit, isLoading }) {
  const [mode, setMode] = useState('text'); // 'text' | 'file'
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateAndSetFile = (f) => {
    setError('');
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!allowed.includes(f.type)) {
      setError('Only PDF, DOCX, and TXT files are accepted.');
      return;
    }
    const maxMB = 10;
    if (f.size > maxMB * 1024 * 1024) {
      setError(`File exceeds ${maxMB}MB limit.`);
      return;
    }
    setFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'text') {
      if (wordCount < 20) {
        setError('Please enter at least 20 words.');
        return;
      }
      onSubmit({ mode: 'text', title, text });
    } else {
      if (!file) {
        setError('Please select a file to upload.');
        return;
      }
      onSubmit({ mode: 'file', title, file });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyles.root}>
      {/* ── Title field ───────────────────────────────── */}
      <div style={formStyles.field}>
        <label style={formStyles.label}>Submission Title</label>
        <input
          type="text"
          placeholder="e.g. Literature Review Draft 1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={formStyles.input}
          maxLength={200}
        />
      </div>

      {/* ── Mode toggle ───────────────────────────────── */}
      <div style={formStyles.modeToggle}>
        <button
          type="button"
          onClick={() => { setMode('text'); clearFile(); setError(''); }}
          style={{
            ...formStyles.modeBtn,
            ...(mode === 'text' ? formStyles.modeBtnActive : {}),
          }}
        >
          <Type size={14} />
          Paste Text
        </button>
        <button
          type="button"
          onClick={() => { setMode('file'); setText(''); setError(''); }}
          style={{
            ...formStyles.modeBtn,
            ...(mode === 'file' ? formStyles.modeBtnActive : {}),
          }}
        >
          <Upload size={14} />
          Upload File
        </button>
      </div>

      {/* ── Text mode ─────────────────────────────────── */}
      {mode === 'text' && (
        <div style={formStyles.field}>
          <div style={formStyles.labelRow}>
            <label style={formStyles.label}>Document Text</label>
            <span style={formStyles.counter}>
              {wordCount.toLocaleString()} words · {text.length.toLocaleString()} chars
            </span>
          </div>
          <textarea
            placeholder="Paste or type your document text here. Minimum 20 words required."
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            style={formStyles.textarea}
            rows={12}
          />
        </div>
      )}

      {/* ── File mode ─────────────────────────────────── */}
      {mode === 'file' && (
        <div style={formStyles.field}>
          <label style={formStyles.label}>Upload Document</label>
          <div
            style={{
              ...formStyles.dropZone,
              ...(dragOver ? formStyles.dropZoneActive : {}),
              ...(file ? formStyles.dropZoneHasFile : {}),
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            {file ? (
              <div style={formStyles.filePreview}>
                <FileText size={32} style={{ color: 'var(--accent)' }} />
                <div>
                  <p style={formStyles.fileName}>{file.name}</p>
                  <p style={formStyles.fileSize}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  style={formStyles.clearBtn}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={formStyles.dropPrompt}>
                <div style={formStyles.uploadIcon}>
                  <Upload size={24} strokeWidth={1.5} />
                </div>
                <p style={formStyles.dropTitle}>Drop your file here</p>
                <p style={formStyles.dropSubtitle}>or click to browse</p>
                <div style={formStyles.fileTypes}>
                  {['PDF', 'DOCX', 'TXT'].map((t) => (
                    <span key={t} style={formStyles.fileTag}>{t}</span>
                  ))}
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => e.target.files[0] && validateAndSetFile(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}

      {/* ── Error message ─────────────────────────────── */}
      {error && (
        <div style={formStyles.error}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* ── Submit button ─────────────────────────────── */}
      <button
        type="submit"
        disabled={isLoading}
        style={{
          ...formStyles.submitBtn,
          ...(isLoading ? formStyles.submitBtnLoading : {}),
        }}
      >
        {isLoading ? (
          <>
            <LoadingDots />
            Analysing…
          </>
        ) : (
          <>
            <File size={16} />
            Run Plagiarism Check
          </>
        )}
      </button>
    </form>
  );
}

function LoadingDots() {
  return (
    <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'var(--bg-base)',
            animation: 'pulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </span>
  );
}

const formStyles = {
  root: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: {
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  counter: {
    fontSize: '0.72rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
  },
  input: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.7,
    width: '100%',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s',
    minHeight: '240px',
  },
  modeToggle: {
    display: 'flex',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-md)',
    padding: '4px',
    border: '1px solid var(--border)',
    gap: '4px',
  },
  modeBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modeBtnActive: {
    background: 'var(--bg-surface)',
    color: 'var(--accent)',
    border: '1px solid rgba(163,255,71,0.25)',
  },
  dropZone: {
    border: '2px dashed var(--border-strong)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px 24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneActive: {
    borderColor: 'var(--accent)',
    background: 'var(--accent-dim)',
  },
  dropZoneHasFile: {
    cursor: 'default',
    borderStyle: 'solid',
    borderColor: 'rgba(163,255,71,0.3)',
    background: 'rgba(163,255,71,0.04)',
  },
  dropPrompt: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  uploadIcon: {
    width: '52px', height: '52px',
    background: 'var(--bg-elevated)',
    borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)',
    marginBottom: '4px',
  },
  dropTitle: { color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.95rem' },
  dropSubtitle: { color: 'var(--text-muted)', fontSize: '0.82rem' },
  fileTypes: { display: 'flex', gap: '6px', marginTop: '8px' },
  fileTag: {
    fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
    padding: '2px 8px', borderRadius: '4px',
    background: 'var(--bg-elevated)', color: 'var(--text-muted)',
    border: '1px solid var(--border)',
  },
  filePreview: {
    display: 'flex', alignItems: 'center', gap: '16px', width: '100%',
  },
  fileName: { color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem' },
  fileSize: { color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' },
  clearBtn: {
    marginLeft: 'auto', padding: '6px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
    borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer',
  },
  error: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 16px',
    background: 'rgba(255,71,87,0.1)',
    border: '1px solid rgba(255,71,87,0.3)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--red)', fontSize: '0.85rem',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '14px 28px',
    background: 'var(--accent)',
    color: '#0a0b0d',
    border: 'none', borderRadius: 'var(--radius-md)',
    fontSize: '0.95rem', fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 0 0 0 var(--accent-glow)',
  },
  submitBtnLoading: {
    opacity: 0.7, cursor: 'not-allowed',
    background: 'rgba(163,255,71,0.5)',
  },
};
