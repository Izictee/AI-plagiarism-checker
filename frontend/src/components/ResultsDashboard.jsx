import React from 'react';
import PlagiarismMeter from './PlagiarismMeter.jsx';
import MatchedSources from './MatchedSources.jsx';
import AIReport from './AIReport.jsx';
import { FileText, Clock, Hash, Database } from 'lucide-react';

function MetaCard({ icon: Icon, label, value }) {
  return (
    <div style={dashStyles.metaCard} className="results-meta-card">
      <Icon size={14} style={{ color: 'var(--accent)' }} />
      <div>
        <p style={dashStyles.metaLabel}>{label}</p>
        <p style={dashStyles.metaValue}>{value}</p>
      </div>
    </div>
  );
}

function Panel({ title, children, badge }) {
  return (
    <div style={dashStyles.panel}>
      <div style={dashStyles.panelHeader} className="panel-header">
        <h3 style={dashStyles.panelTitle}>{title}</h3>
        {badge && <span style={dashStyles.panelBadge}>{badge}</span>}
      </div>
      <div style={dashStyles.panelBody} className="panel-body">{children}</div>
    </div>
  );
}

export default function ResultsDashboard({ result }) {
  const {
    title, wordCount, source, createdAt,
    analysis, topMatches, submissionId,
  } = result;

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div style={dashStyles.root} className="animate-fade-up">
      {/* ── Header ──────────────────────────────────── */}
      <div style={dashStyles.header} className="results-dashboard-header">
        <div style={dashStyles.titleRow}>
          <div style={dashStyles.titleIcon}>
            <FileText size={18} />
          </div>
          <div>
            <h2 style={dashStyles.title} className="results-title">{title || 'Analysis Complete'}</h2>
            <p style={dashStyles.subId}>
              ID: {String(submissionId).slice(-12).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Metadata pills */}
        <div style={dashStyles.metaRow} className="results-meta-row">
          <MetaCard icon={Clock} label="Analysed" value={dateStr} />
          <MetaCard icon={Hash} label="Word Count" value={wordCount?.toLocaleString() || '—'} />
          <MetaCard icon={FileText} label="Source" value={source?.toUpperCase() || 'TEXT'} />
          <MetaCard icon={Database} label="Matched Against" value={`${topMatches?.length || 0} sources`} />
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────── */}
      <div style={dashStyles.grid} className="results-grid">
        {/* Left column */}
        <div style={dashStyles.leftCol}>
          {/* Plagiarism meter */}
          <Panel title="Plagiarism Score" badge={analysis?.riskLevel}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
              <PlagiarismMeter
                percentage={analysis?.plagiarismPercentage || 0}
                riskLevel={analysis?.riskLevel || 'Low'}
              />
            </div>
          </Panel>

          {/* Matched sources */}
          <Panel
            title="Matched Sources"
            badge={topMatches?.length > 0 ? `TOP ${topMatches.length}` : 'NONE'}
          >
            <MatchedSources matches={topMatches} />
          </Panel>
        </div>

        {/* Right column — AI report */}
        <div style={dashStyles.rightCol}>
          <Panel title="AI-Powered Analysis" badge="CLAUDE">
            <AIReport analysis={analysis} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

const dashStyles = {
  root: {
    display: 'flex', flexDirection: 'column', gap: '24px',
    animation: 'fade-up 0.5s var(--ease-out) both',
  },
  header: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: '20px',
  },
  titleRow: { display: 'flex', alignItems: 'center', gap: '16px' },
  titleIcon: {
    width: '44px', height: '44px',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(59,110,143,0.25)',
    borderRadius: 'var(--radius-md)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--accent)',
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: '1.3rem',
    color: 'var(--text-primary)',
  },
  subId: {
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
    color: 'var(--text-muted)', marginTop: '2px',
  },
  metaRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  metaCard: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    flex: '1', minWidth: '140px',
  },
  metaLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.66rem',
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
  },
  metaValue: {
    fontSize: '0.85rem', color: 'var(--text-primary)',
    fontWeight: 500, marginTop: '2px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '360px 1fr',
    gap: '20px',
    alignItems: 'start',
  },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  panel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
  },
  panelTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: '0.95rem', color: 'var(--text-primary)',
  },
  panelBadge: {
    fontFamily: 'var(--font-mono)', fontSize: '0.66rem',
    padding: '3px 8px', borderRadius: '4px',
    background: 'var(--accent-dim)', color: 'var(--accent)',
    border: '1px solid rgba(59,110,143,0.2)',
  },
  panelBody: { padding: '20px' },
};
