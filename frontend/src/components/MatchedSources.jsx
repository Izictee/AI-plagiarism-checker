import React from 'react';
import { GitBranch, Brain, BarChart3, Calendar } from 'lucide-react';

const pct = (v) => `${Math.round((v || 0) * 100)}%`;

function ScoreBar({ value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1, height: '4px',
        background: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{
          width: pct(value), height: '100%',
          background: color, borderRadius: '2px',
          transition: 'width 0.8s var(--ease-out)',
        }} />
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
        color: 'var(--text-secondary)', minWidth: '34px', textAlign: 'right',
      }}>
        {pct(value)}
      </span>
    </div>
  );
}

export default function MatchedSources({ matches }) {
  if (!matches || matches.length === 0) {
    return (
      <div style={sourceStyles.empty}>
        <p>No similar documents found in the database.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
          This is the first submission, or no matches exceeded the threshold.
        </p>
      </div>
    );
  }

  return (
    <div style={sourceStyles.root}>
      {matches.map((match, i) => {
        const combined = match.combinedScore || 0;
        let borderColor = 'var(--border)';
        if (combined > 0.7) borderColor = 'rgba(239,68,68,0.4)';
        else if (combined > 0.4) borderColor = 'rgba(249,115,22,0.4)';
        else if (combined > 0.2) borderColor = 'rgba(245,158,11,0.3)';

        return (
          <div key={match.submissionId || i} style={{ ...sourceStyles.card, borderColor }}>
            {/* Header */}
            <div style={sourceStyles.cardHeader}>
              <div style={sourceStyles.rank}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <p style={sourceStyles.cardTitle}>
                  {match.title || 'Untitled Submission'}
                </p>
                {match.submissionId && (
                  <p style={sourceStyles.cardId}>
                    ID: {String(match.submissionId).slice(-8).toUpperCase()}
                  </p>
                )}
              </div>
              <div style={{
                ...sourceStyles.combinedBadge,
                color: combined > 0.7 ? 'var(--red)' : combined > 0.4 ? 'var(--orange)' : combined > 0.2 ? 'var(--yellow)' : 'var(--green)',
              }}>
                {Math.round(combined * 100)}%
              </div>
            </div>

            {/* Score breakdown */}
            <div style={sourceStyles.scores}>
              <div style={sourceStyles.scoreRow}>
                <div style={sourceStyles.scoreLabel}>
                  <GitBranch size={11} />
                  TF-IDF
                </div>
                <ScoreBar value={match.tfidfScore} color="rgba(99,102,241,0.8)" />
              </div>
              <div style={sourceStyles.scoreRow}>
                <div style={sourceStyles.scoreLabel}>
                  <Brain size={11} />
                  Semantic
                </div>
                <ScoreBar value={match.embeddingScore} color="rgba(59,110,143,0.75)" />
              </div>
              <div style={sourceStyles.scoreRow}>
                <div style={sourceStyles.scoreLabel}>
                  <BarChart3 size={11} />
                  Combined
                </div>
                <ScoreBar
                  value={combined}
                  color={combined > 0.7 ? 'var(--red)' : combined > 0.4 ? 'var(--orange)' : 'var(--yellow)'}
                />
              </div>
            </div>

            {/* Excerpt */}
            {match.excerpt && (
              <p style={sourceStyles.excerpt}>
                "{match.excerpt.slice(0, 180)}{match.excerpt.length > 180 ? '…' : ''}"
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

const sourceStyles = {
  root: { display: 'flex', flexDirection: 'column', gap: '12px' },
  empty: {
    padding: '24px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  card: {
    background: 'var(--bg-elevated)',
    border: '1px solid',
    borderRadius: 'var(--radius-lg)',
    padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '12px',
    transition: 'border-color 0.2s',
  },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  rank: {
    width: '24px', height: '24px',
    background: 'var(--bg-hover)',
    border: '1px solid var(--border-strong)',
    borderRadius: '6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
    color: 'var(--text-muted)', flexShrink: 0,
  },
  cardTitle: {
    fontSize: '0.9rem', fontWeight: 500,
    color: 'var(--text-primary)', lineHeight: 1.3,
  },
  cardId: {
    fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
    color: 'var(--text-muted)', marginTop: '2px',
  },
  combinedBadge: {
    fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: '1.1rem', flexShrink: 0,
  },
  scores: { display: 'flex', flexDirection: 'column', gap: '8px' },
  scoreRow: {
    display: 'grid', gridTemplateColumns: '80px 1fr',
    alignItems: 'center', gap: '12px',
  },
  scoreLabel: {
    display: 'flex', alignItems: 'center', gap: '4px',
    fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  excerpt: {
    fontSize: '0.8rem', fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)', lineHeight: 1.6,
    padding: '10px',
    background: 'var(--bg-hover)',
    borderRadius: '6px',
    borderLeft: '3px solid var(--border-strong)',
    fontStyle: 'italic',
  },
};
