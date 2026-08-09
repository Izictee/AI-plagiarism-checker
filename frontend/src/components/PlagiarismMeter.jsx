import React, { useEffect, useState } from 'react';

const RISK_COLORS = {
  Low:      '#22C55E',
  Moderate: '#F59E0B',
  High:     '#F97316',
  Critical: '#EF4444',
};

const RISK_LABELS = {
  Low:      'Original Work',
  Moderate: 'Review Recommended',
  High:     'Significant Plagiarism',
  Critical: 'Severe Violation',
};

export default function PlagiarismMeter({ percentage, riskLevel }) {
  const [animated, setAnimated] = useState(0);
  const color = RISK_COLORS[riskLevel] || 'var(--text-secondary)';

  // Animate the number counting up
  useEffect(() => {
    const target = Math.round(percentage);
    let current = 0;
    const step = target / 50;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setAnimated(Math.round(current));
      if (current >= target) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [percentage]);

  // SVG arc for circular gauge
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={meterStyles.root}>
      {/* ── Circular gauge ─────────────────────────── */}
      <div style={meterStyles.gaugeWrapper}>
        <svg width="200" height="200" style={meterStyles.svg}>
          {/* Background track */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth="10"
          />
          {/* Animated progress arc */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 100 100)"
            style={{
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
          {/* Glow overlay for the high-percentage section */}
          {percentage > 50 && (
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeOpacity="0.2"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 100 100)"
            />
          )}
        </svg>

        {/* Center text */}
        <div style={meterStyles.centerText}>
          <span style={{ ...meterStyles.percentage, color }}>
            {animated}
            <span style={meterStyles.pct}>%</span>
          </span>
          <span style={meterStyles.label}>plagiarism</span>
        </div>
      </div>

      {/* ── Risk level badge ───────────────────────── */}
      <div style={{ ...meterStyles.badge, borderColor: color + '40', background: color + '12' }}>
        <div style={{ ...meterStyles.dot, background: color }} />
        <span style={{ ...meterStyles.badgeText, color }}>
          {riskLevel} Risk
        </span>
        <span style={meterStyles.badgeLabel}>
          — {RISK_LABELS[riskLevel]}
        </span>
      </div>

      {/* ── Linear progress bar ────────────────────── */}
      <div style={meterStyles.progressTrack}>
        <div
          style={{
            ...meterStyles.progressFill,
            width: `${percentage}%`,
            background: color,
          }}
        />
        <div style={meterStyles.progressMarkers}>
          {[0, 20, 40, 70, 100].map((mark) => (
            <div key={mark} style={{ ...meterStyles.marker, left: `${mark}%` }}>
              <div style={meterStyles.markerLine} />
              <span style={meterStyles.markerLabel}>{mark}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const meterStyles = {
  root: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
  },
  gaugeWrapper: {
    position: 'relative', width: '200px', height: '200px',
  },
  svg: { position: 'absolute', top: 0, left: 0 },
  centerText: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  percentage: {
    fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: '3rem', lineHeight: 1,
  },
  pct: { fontSize: '1.5rem', fontWeight: 600 },
  label: {
    fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
    color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.1em',
  },
  badge: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 16px',
    borderRadius: '40px', border: '1px solid',
  },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  badgeText: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem',
  },
  badgeLabel: {
    color: 'var(--text-secondary)', fontSize: '0.85rem',
  },
  progressTrack: {
    width: '100%', height: '6px',
    background: 'var(--bg-elevated)',
    borderRadius: '3px',
    position: 'relative',
  },
  progressFill: {
    height: '100%', borderRadius: '3px',
    transition: 'width 1.5s cubic-bezier(0.16,1,0.3,1)',
  },
  progressMarkers: { position: 'relative', height: '20px', marginTop: '4px' },
  marker: { position: 'absolute', transform: 'translateX(-50%)' },
  markerLine: {
    width: '1px', height: '4px', background: 'var(--border-strong)', margin: '0 auto',
  },
  markerLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
    color: 'var(--text-muted)', whiteSpace: 'nowrap',
  },
};
