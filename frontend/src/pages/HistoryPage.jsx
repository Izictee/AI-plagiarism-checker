import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ExternalLink, RefreshCw, FileText, BarChart3 } from 'lucide-react';
import { getSubmissions, getStats, deleteSubmission } from '../utils/api.js';

const RISK_COLORS = {
  Low: '#22C55E',
  Moderate: '#F59E0B',
  High: '#F97316',
  Critical: '#EF4444',
};

function StatCard({ label, value, color }) {
  return (
    <div style={histStyles.statCard}>
      <p style={{ ...histStyles.statValue, color: color || 'var(--text-primary)' }}>{value}</p>
      <p style={histStyles.statLabel}>{label}</p>
    </div>
  );
}

export default function HistoryPage() {
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const [subRes, statsRes] = await Promise.all([
        getSubmissions(p, 10),
        getStats(),
      ]);
      setSubmissions(subRes.data);
      setPagination(subRes.pagination);
      setStats(statsRes.stats);
      setPage(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this submission permanently?')) return;
    setDeleting(id);
    try {
      await deleteSubmission(id);
      setSubmissions((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={histStyles.root} className="page-root page-root-top">
      {/* ── Header ──────────────────────────────────── */}
      <div style={histStyles.pageHeader} className="history-page-header">
        <div>
          <h1 style={histStyles.pageTitle} className="history-page-title">Submission History</h1>
          <p style={histStyles.pageSub}>All documents checked against the plagiarism database</p>
        </div>
        <button onClick={() => load(page)} style={histStyles.refreshBtn} className="refresh-btn" disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────── */}
      {stats && (
        <div style={histStyles.statsGrid} className="history-stats-grid">
          <StatCard label="Total Submissions" value={stats.totalSubmissions} />
          <StatCard label="Low Risk" value={stats.riskDistribution.Low} color="var(--risk-low)" />
          <StatCard label="Moderate Risk" value={stats.riskDistribution.Moderate} color="var(--risk-moderate)" />
          <StatCard label="High Risk" value={stats.riskDistribution.High} color="var(--risk-high)" />
          <StatCard label="Critical" value={stats.riskDistribution.Critical} color="var(--risk-critical)" />
        </div>
      )}

      {/* ── Error ───────────────────────────────────── */}
      {error && (
        <div style={histStyles.errorBanner}>⚠ {error}</div>
      )}

      {/* ── Table ───────────────────────────────────── */}
      {loading && submissions.length === 0 ? (
        <div style={histStyles.loadingState}>
          <div style={histStyles.spinner} />
          <p style={histStyles.loadingText}>Loading submissions…</p>
        </div>
      ) : submissions.length === 0 ? (
        <div style={histStyles.emptyState}>
          <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No submissions yet.</p>
          <Link to="/" style={histStyles.ctaLink}>Run your first check →</Link>
        </div>
      ) : (
        <>
          <div style={histStyles.tableWrapper}>
            <div style={histStyles.tableScroll}>
            <table style={histStyles.table}>
              <thead>
                <tr>
                  {['Title', 'Source', 'Words', 'Risk Level', 'Plagiarism %', 'Date', 'Actions'].map((h) => (
                    <th key={h} style={histStyles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => {
                  const pct = s.analysis?.plagiarismPercentage ?? '—';
                  const risk = s.analysis?.riskLevel || '—';
                  const color = RISK_COLORS[risk] || 'var(--text-muted)';
                  return (
                    <tr key={s._id} style={histStyles.tr}>
                      <td style={histStyles.td}>
                        <p style={histStyles.tdTitle}>{s.title || 'Untitled'}</p>
                        <p style={histStyles.tdId}>{String(s._id).slice(-8).toUpperCase()}</p>
                      </td>
                      <td style={histStyles.td}>
                        <span style={histStyles.sourceBadge}>{s.source?.toUpperCase()}</span>
                      </td>
                      <td style={{ ...histStyles.td, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {s.wordCount?.toLocaleString() || '—'}
                      </td>
                      <td style={histStyles.td}>
                        <span style={{ ...histStyles.riskBadge, color, borderColor: color + '40', background: color + '12' }}>
                          {risk}
                        </span>
                      </td>
                      <td style={histStyles.td}>
                        <span style={{ ...histStyles.pctValue, color }}>
                          {typeof pct === 'number' ? `${pct}%` : pct}
                        </span>
                      </td>
                      <td style={{ ...histStyles.td, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td style={histStyles.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link to={`/results/${s._id}`} style={histStyles.viewBtn} title="View">
                            <ExternalLink size={13} />
                          </Link>
                          <button
                            onClick={() => handleDelete(s._id)}
                            style={histStyles.deleteBtn}
                            disabled={deleting === s._id}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div style={histStyles.pagination}>
              <button
                style={histStyles.pageBtn}
                onClick={() => load(page - 1)}
                disabled={page <= 1}
              >
                ← Prev
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Page {page} of {pagination.pages}
              </span>
              <button
                style={histStyles.pageBtn}
                onClick={() => load(page + 1)}
                disabled={page >= pagination.pages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const histStyles = {
  root: {
    maxWidth: '1100px', margin: '0 auto',
    padding: '90px 24px 60px',
    display: 'flex', flexDirection: 'column', gap: '28px',
  },
  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  pageTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: '1.8rem', color: 'var(--text-primary)',
  },
  pageSub: { color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)', fontSize: '0.85rem',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px',
  },
  statCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px', textAlign: 'center',
  },
  statValue: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8rem',
  },
  statLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
    color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase',
  },
  errorBanner: {
    padding: '14px 16px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--red)', fontSize: '0.875rem',
  },
  tableWrapper: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    overflow: 'hidden',
  },
  tableScroll: {
    width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch',
  },
  table: {
    width: '100%', minWidth: '760px', borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
    textAlign: 'left',
    background: 'var(--bg-elevated)',
    borderBottom: '1px solid var(--border)',
  },
  tr: {
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.15s',
  },
  td: {
    padding: '14px 16px', verticalAlign: 'middle',
    color: 'var(--text-primary)', fontSize: '0.875rem',
  },
  tdTitle: { fontWeight: 500, fontSize: '0.875rem' },
  tdId: {
    fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
    color: 'var(--text-muted)', marginTop: '2px',
  },
  sourceBadge: {
    fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
    padding: '2px 8px', borderRadius: '4px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
  },
  riskBadge: {
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
    padding: '3px 8px', borderRadius: '4px', border: '1px solid',
    fontWeight: 500,
  },
  pctValue: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
  },
  viewBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '6px',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(59,110,143,0.2)',
    borderRadius: '6px',
    color: 'var(--accent)', cursor: 'pointer',
  },
  deleteBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '6px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '6px',
    color: 'var(--red)', cursor: 'pointer',
  },
  loadingState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '80px', gap: '16px',
  },
  spinner: {
    width: '32px', height: '32px', borderRadius: '50%',
    border: '2px solid var(--border-strong)',
    borderTopColor: 'var(--accent)',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)',
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '80px', background: 'var(--bg-surface)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
  },
  ctaLink: {
    marginTop: '12px', color: 'var(--accent)', textDecoration: 'none',
    fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
  },
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
    flexWrap: 'wrap',
  },
  pageBtn: {
    padding: '8px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)', fontSize: '0.85rem',
    cursor: 'pointer',
  },
};
