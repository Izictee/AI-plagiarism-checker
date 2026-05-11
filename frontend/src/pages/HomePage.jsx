import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Shield, Brain, GitMerge } from 'lucide-react';
import UploadForm from '../components/UploadForm.jsx';
import { submitText, submitFile } from '../utils/api.js';

const FEATURES = [
  {
    icon: GitMerge, title: 'TF-IDF + Cosine',
    desc: 'Statistical lexical similarity across all stored documents.',
  },
  {
    icon: Brain, title: 'OpenAI Embeddings',
    desc: 'Semantic similarity that catches paraphrasing and idea theft.',
  },
  {
    icon: Shield, title: 'Claude AI Analysis',
    desc: 'Detailed structured report with evidence-based verdict.',
  },
  {
    icon: Zap, title: 'Real-time Results',
    desc: 'Instant multi-source comparison and percentage scoring.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);

  const handleSubmit = async ({ mode, title, text, file }) => {
    setIsLoading(true);
    setError('');
    setProgress('Uploading…');

    try {
      let result;

      if (mode === 'text') {
        setProgress('Processing text…');
        result = await submitText(title, text);
      } else {
        result = await submitFile(title, file, (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(`Uploading… ${pct}%`);
          }
        });
      }

      setProgress('Running AI analysis…');

      // Store result in sessionStorage for the results page
      sessionStorage.setItem(`result_${result.submissionId}`, JSON.stringify(result));
      navigate(`/results/${result.submissionId}`);

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  return (
    <div style={homeStyles.root}>
      {/* ── Hero ───────────────────────────────────── */}
      <div style={homeStyles.hero}>
        <div style={homeStyles.heroLabel}>
          <span style={homeStyles.heroLabelDot} />
          AI-Powered Academic Integrity System
        </div>

        <h1 style={homeStyles.heroTitle}>
          Detect Plagiarism<br />
          <span style={{ color: 'var(--accent)' }}>With Precision</span>
        </h1>

        <p style={homeStyles.heroSub}>
          Multi-algorithm detection using TF-IDF, semantic embeddings, and
          Claude AI analysis for comprehensive academic integrity checking.
        </p>

        {/* Features row */}
        <div style={homeStyles.features}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={homeStyles.feature}>
              <div style={homeStyles.featureIcon}>
                <Icon size={14} />
              </div>
              <div>
                <p style={homeStyles.featureTitle}>{title}</p>
                <p style={homeStyles.featureDesc}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main card ──────────────────────────────── */}
      <div style={homeStyles.card}>
        <div style={homeStyles.cardHeader}>
          <h2 style={homeStyles.cardTitle}>Submit Document</h2>
          <p style={homeStyles.cardSub}>
            Paste your text or upload a PDF / DOCX file
          </p>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div style={homeStyles.loadingBanner}>
            <div style={homeStyles.loadingSpinner} />
            <div>
              <p style={homeStyles.loadingTitle}>{progress || 'Analysing…'}</p>
              <p style={homeStyles.loadingSub}>
                This may take 15–30 seconds while the AI processes your submission.
              </p>
            </div>
          </div>
        )}

        <UploadForm onSubmit={handleSubmit} isLoading={isLoading} />

        {/* Global error */}
        {error && (
          <div style={homeStyles.errorBanner}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* ── Bottom disclaimer ─────────────────────── */}
      <p style={homeStyles.disclaimer}>
        Submissions are stored in the database and used for future comparisons.
        All data is handled securely.
      </p>
    </div>
  );
}

const homeStyles = {
  root: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '100px 24px 60px',
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  hero: {
    display: 'flex', flexDirection: 'column', gap: '20px',
    alignItems: 'center', textAlign: 'center',
  },
  heroLabel: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
    color: 'var(--text-muted)', letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  heroLabelDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: 'var(--accent)',
    boxShadow: '0 0 8px var(--accent-glow)',
  },
  heroTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 800,
    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
    lineHeight: 1.1, letterSpacing: '-0.03em',
    color: 'var(--text-primary)',
  },
  heroSub: {
    fontSize: '1rem', color: 'var(--text-secondary)',
    maxWidth: '560px', lineHeight: 1.7,
  },
  features: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px', marginTop: '8px', textAlign: 'left',
    width: '100%', maxWidth: '700px',
  },
  feature: {
    display: 'flex', gap: '12px', alignItems: 'flex-start',
    padding: '14px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
  },
  featureIcon: {
    width: '28px', height: '28px',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(163,255,71,0.2)',
    borderRadius: '7px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--accent)', flexShrink: 0,
  },
  featureTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 600,
    fontSize: '0.85rem', color: 'var(--text-primary)',
  },
  featureDesc: {
    fontSize: '0.78rem', color: 'var(--text-muted)',
    lineHeight: 1.5, marginTop: '2px',
  },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '32px',
    display: 'flex', flexDirection: 'column', gap: '24px',
  },
  cardHeader: { display: 'flex', flexDirection: 'column', gap: '4px' },
  cardTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem',
    color: 'var(--text-primary)',
  },
  cardSub: { fontSize: '0.875rem', color: 'var(--text-secondary)' },
  loadingBanner: {
    display: 'flex', alignItems: 'flex-start', gap: '16px',
    padding: '16px',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(163,255,71,0.25)',
    borderRadius: 'var(--radius-md)',
  },
  loadingSpinner: {
    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
    border: '2px solid rgba(163,255,71,0.3)',
    borderTopColor: 'var(--accent)',
    animation: 'spin 0.8s linear infinite',
  },
  loadingTitle: {
    fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
    color: 'var(--accent)', fontWeight: 500,
  },
  loadingSub: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' },
  errorBanner: {
    padding: '14px 16px',
    background: 'rgba(255,71,87,0.1)',
    border: '1px solid rgba(255,71,87,0.3)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--red)', fontSize: '0.875rem',
  },
  disclaimer: {
    textAlign: 'center', fontSize: '0.75rem',
    color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
  },
};
