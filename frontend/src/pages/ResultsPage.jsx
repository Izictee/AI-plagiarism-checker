import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getSubmission } from '../utils/api.js';
import ResultsDashboard from '../components/ResultsDashboard.jsx';

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResult = async () => {
      setLoading(true);
      setError('');

      // First check sessionStorage (fast path from fresh submission)
      const cached = sessionStorage.getItem(`result_${id}`);
      if (cached) {
        try {
          setResult(JSON.parse(cached));
          setLoading(false);
          return;
        } catch {
          // ignore parse error, fall through to API
        }
      }

      // Fall back to API fetch
      try {
        const data = await getSubmission(id);
        setResult(data.data);
      } catch (err) {
        setError(err.message || 'Failed to load submission.');
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [id]);

  if (loading) {
    return (
      <div style={pageStyles.centred}>
        <div style={pageStyles.spinner} />
        <p style={pageStyles.loadingText}>Loading analysis…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyles.centred}>
        <p style={pageStyles.errorText}>⚠ {error}</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button onClick={() => window.location.reload()} style={pageStyles.retryBtn}>
            <RefreshCw size={14} /> Retry
          </button>
          <Link to="/" style={pageStyles.homeLink}>
            <ArrowLeft size={14} /> New Check
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyles.root} className="page-root page-root-top">
      {/* Top nav */}
      <div style={pageStyles.topBar} className="results-top-bar">
        <Link to="/" style={pageStyles.backLink}>
          <ArrowLeft size={14} />
          New Check
        </Link>
        <Link to="/history" style={pageStyles.historyLink}>
          View All Submissions →
        </Link>
      </div>

      {result && <ResultsDashboard result={result} />}
    </div>
  );
}

const pageStyles = {
  root: {
    maxWidth: '1200px', margin: '0 auto',
    padding: '80px 24px 60px',
    display: 'flex', flexDirection: 'column', gap: '24px',
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  backLink: {
    display: 'flex', alignItems: 'center', gap: '6px',
    color: 'var(--text-secondary)', textDecoration: 'none',
    fontSize: '0.875rem', fontFamily: 'var(--font-body)',
    padding: '6px 12px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    transition: 'color 0.2s',
  },
  historyLink: {
    fontSize: '0.8rem', fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)', textDecoration: 'none',
  },
  centred: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '80vh', gap: '16px',
  },
  spinner: {
    width: '36px', height: '36px', borderRadius: '50%',
    border: '2px solid var(--border-strong)',
    borderTopColor: 'var(--accent)',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  errorText: { color: 'var(--red)', fontSize: '0.95rem' },
  retryBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)', fontSize: '0.875rem',
    cursor: 'pointer',
  },
  homeLink: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(59,110,143,0.25)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--accent)', fontSize: '0.875rem',
    textDecoration: 'none',
  },
};
