import React, { useState } from 'react';
import { ChevronDown, Cpu, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

const SEVERITY_COLORS = {
  high:   { bg: 'rgba(255,71,87,0.15)', border: 'rgba(255,71,87,0.4)', text: 'var(--red)' },
  medium: { bg: 'rgba(255,160,65,0.15)', border: 'rgba(255,160,65,0.4)', text: 'var(--orange)' },
  low:    { bg: 'rgba(255,211,42,0.1)', border: 'rgba(255,211,42,0.3)', text: 'var(--yellow)' },
};

const TYPE_LABELS = {
  direct_copy: 'Direct Copy',
  paraphrase:  'Paraphrase',
  structural:  'Structural',
  ai_generated:'AI-Generated',
};

function Section({ title, content, icon: Icon, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!content || content === 'Analysis not available.') return null;

  return (
    <div style={reportStyles.section}>
      <button
        style={reportStyles.sectionHeader}
        onClick={() => setOpen((o) => !o)}
      >
        <div style={reportStyles.sectionTitle}>
          {Icon && <Icon size={14} style={{ color: 'var(--accent)' }} />}
          {title}
        </div>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }}
        />
      </button>
      {open && (
        <div style={reportStyles.sectionBody}>
          {content}
        </div>
      )}
    </div>
  );
}

export default function AIReport({ analysis }) {
  if (!analysis) return null;

  const {
    plagiarismPercentage, riskLevel, summary,
    directMatches, paraphrasingDetected, structuralSimilarity,
    aiGeneratedPatterns, highlightedSections, conclusion,
  } = analysis;

  const RiskIcon = riskLevel === 'Low' ? CheckCircle
    : riskLevel === 'Critical' ? XCircle : AlertTriangle;

  return (
    <div style={reportStyles.root}>
      {/* ── Header ──────────────────────────────────── */}
      <div style={reportStyles.header}>
        <Cpu size={16} style={{ color: 'var(--accent)' }} />
        <span style={reportStyles.headerTitle}>AI Analysis Report</span>
        <span style={reportStyles.headerBadge}>claude-sonnet-4</span>
      </div>

      {/* ── Summary banner ──────────────────────────── */}
      {summary && (
        <div style={reportStyles.summary}>
          <Info size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: '2px' }} />
          <p style={reportStyles.summaryText}>{summary}</p>
        </div>
      )}

      {/* ── Accordion sections ───────────────────────── */}
      <div style={reportStyles.accordion}>
        <Section
          title="Direct Matches"
          content={directMatches}
          icon={AlertTriangle}
          defaultOpen
        />
        <Section
          title="Paraphrasing Detected"
          content={paraphrasingDetected}
          icon={AlertTriangle}
        />
        <Section
          title="Structural Similarity"
          content={structuralSimilarity}
          icon={Info}
        />
        <Section
          title="AI-Generated Content Patterns"
          content={aiGeneratedPatterns}
          icon={Cpu}
        />
      </div>

      {/* ── Highlighted sections ─────────────────────── */}
      {highlightedSections && highlightedSections.length > 0 && (
        <div style={reportStyles.highlights}>
          <p style={reportStyles.highlightHeader}>Flagged Text Sections</p>
          <div style={reportStyles.highlightList}>
            {highlightedSections.map((section, i) => {
              const colors = SEVERITY_COLORS[section.severity] || SEVERITY_COLORS.low;
              return (
                <div key={i} style={{
                  ...reportStyles.highlightItem,
                  background: colors.bg,
                  borderColor: colors.border,
                }}>
                  <div style={reportStyles.highlightMeta}>
                    <span style={{ ...reportStyles.typeTag, color: colors.text }}>
                      {TYPE_LABELS[section.type] || section.type}
                    </span>
                    <span style={{ ...reportStyles.severityTag, color: colors.text }}>
                      {section.severity?.toUpperCase()}
                    </span>
                  </div>
                  <p style={reportStyles.highlightText}>"{section.text}"</p>
                  {section.reason && (
                    <p style={reportStyles.highlightReason}>{section.reason}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Conclusion ───────────────────────────────── */}
      {conclusion && (
        <div style={reportStyles.conclusion}>
          <div style={reportStyles.conclusionHeader}>
            <RiskIcon size={16} />
            Final Conclusion
          </div>
          <p style={reportStyles.conclusionText}>{conclusion}</p>
        </div>
      )}
    </div>
  );
}

const reportStyles = {
  root: {
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '8px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border)',
  },
  headerTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: '0.95rem', color: 'var(--text-primary)',
  },
  headerBadge: {
    marginLeft: 'auto',
    fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
    padding: '2px 8px', borderRadius: '4px',
    background: 'var(--accent-dim)', color: 'var(--accent)',
    border: '1px solid rgba(163,255,71,0.2)',
  },
  summary: {
    display: 'flex', gap: '10px',
    padding: '14px',
    background: 'var(--bg-base)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
  },
  summaryText: {
    fontSize: '0.875rem', lineHeight: 1.7,
    color: 'var(--text-secondary)',
  },
  accordion: {
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  section: {
    background: 'var(--bg-base)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'transparent', border: 'none',
    cursor: 'pointer', width: '100%',
  },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontFamily: 'var(--font-display)', fontWeight: 600,
    fontSize: '0.85rem', color: 'var(--text-primary)',
  },
  sectionBody: {
    padding: '0 16px 16px',
    fontSize: '0.85rem', lineHeight: 1.75,
    color: 'var(--text-secondary)',
    borderTop: '1px solid var(--border)',
    paddingTop: '12px',
  },
  highlights: { display: 'flex', flexDirection: 'column', gap: '10px' },
  highlightHeader: {
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  highlightList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  highlightItem: {
    padding: '12px', borderRadius: 'var(--radius-md)',
    border: '1px solid', display: 'flex', flexDirection: 'column', gap: '6px',
  },
  highlightMeta: { display: 'flex', gap: '8px', alignItems: 'center' },
  typeTag: {
    fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
    fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  severityTag: {
    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
    padding: '1px 6px', borderRadius: '3px',
    background: 'rgba(255,255,255,0.05)',
  },
  highlightText: {
    fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
    color: 'var(--text-primary)', fontStyle: 'italic',
    lineHeight: 1.6,
  },
  highlightReason: {
    fontSize: '0.78rem', color: 'var(--text-muted)',
  },
  conclusion: {
    padding: '16px',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-strong)',
  },
  conclusionHeader: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: '0.85rem', color: 'var(--text-primary)',
    marginBottom: '10px',
  },
  conclusionText: {
    fontSize: '0.875rem', lineHeight: 1.75,
    color: 'var(--text-secondary)',
  },
};
