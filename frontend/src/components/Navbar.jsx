import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ScanSearch, History, Zap, Menu, X } from 'lucide-react';

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: '60px',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    flexShrink: 0,
    minWidth: 0,
  },
  logoIcon: {
    width: '28px',
    height: '28px',
    background: 'var(--accent)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    flexShrink: 0,
  },
  logoSpan: {
    color: 'var(--accent)',
  },
  links: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  badge: {
    fontSize: '0.65rem',
    fontFamily: 'var(--font-mono)',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid rgba(59,110,143,0.2)',
    marginLeft: '8px',
  },
};

function NavLink({ to, children, icon: Icon }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontFamily: 'var(--font-body)',
        fontSize: '0.875rem',
        fontWeight: 400,
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        background: isActive ? 'var(--accent-dim)' : 'transparent',
        border: isActive ? '1px solid rgba(59,110,143,0.2)' : '1px solid transparent',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children, icon: Icon, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`navbar-mobile-link${isActive ? ' active' : ''}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav style={styles.nav} className="navbar">
        <Link to="/" style={styles.logo}>
          <div style={styles.logoIcon}>
            <Zap size={14} strokeWidth={2.5} />
          </div>
          Plagia<span style={styles.logoSpan}>Scope</span>
          <span style={styles.badge} className="navbar-logo-badge">AI</span>
        </Link>

        {/* Desktop nav links — hidden on small screens in favor of the hamburger menu */}
        <div style={styles.links} className="navbar-links-desktop">
          <NavLink to="/" icon={ScanSearch}>Check</NavLink>
          <NavLink to="/history" icon={History}>History</NavLink>
        </div>

        {/* Hamburger toggle — only shown on small screens */}
        <button
          type="button"
          className="navbar-hamburger"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile dropdown panel with every nav item still reachable */}
      <div className={`navbar-mobile-panel${open ? ' open' : ''}`}>
        <MobileNavLink to="/" icon={ScanSearch} onClick={() => setOpen(false)}>
          Check
        </MobileNavLink>
        <MobileNavLink to="/history" icon={History} onClick={() => setOpen(false)}>
          History
        </MobileNavLink>
      </div>
    </>
  );
}
