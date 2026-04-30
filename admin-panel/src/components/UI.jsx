import React from 'react';
import { Loader2 } from 'lucide-react';

/* ── Card ─────────────────────────────────────────────────────────────────── */
export function Card({ children, className = '', style = {}, glow = false, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        boxShadow: glow ? 'var(--shadow-glow)' : 'var(--shadow-card)',
        transition: 'border-color 0.2s, transform 0.15s',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/* ── Section header ───────────────────────────────────────────────────────── */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18, fontWeight: 700,
          color: 'var(--text-primary)', margin: 0
        }}>{title}</h2>
        {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Button ───────────────────────────────────────────────────────────────── */
export function Btn({
  children, onClick, variant = 'primary', size = 'md',
  disabled = false, loading = false, icon, style = {}
}) {
  const variants = {
    primary: { background: 'var(--accent)', color: '#000', border: 'none' },
    secondary: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
    danger: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(255,77,109,0.3)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' },
    success: { background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(34,212,138,0.3)' },
  };
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12, borderRadius: 'var(--radius-sm)' },
    md: { padding: '9px 18px', fontSize: 13, borderRadius: 'var(--radius-md)' },
    lg: { padding: '12px 24px', fontSize: 15, borderRadius: 'var(--radius-md)' },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: 'var(--font-body)', fontWeight: 600, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
        ...variants[variant], ...sizes[size], ...style,
      }}
    >
      {loading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : icon}
      {children}
    </button>
  );
}

/* ── Badge ────────────────────────────────────────────────────────────────── */
export function Badge({ children, color = 'accent' }) {
  const colors = {
    accent: { bg: 'var(--accent-dim)', text: 'var(--accent)', border: 'var(--accent-mid)' },
    green:  { bg: 'var(--green-dim)',  text: 'var(--green)',  border: 'rgba(34,212,138,0.2)' },
    yellow: { bg: 'var(--yellow-dim)', text: 'var(--yellow)', border: 'rgba(255,215,0,0.2)' },
    red:    { bg: 'var(--red-dim)',    text: 'var(--red)',    border: 'rgba(255,77,109,0.2)' },
    orange: { bg: 'var(--orange-dim)', text: 'var(--orange)', border: 'rgba(255,140,66,0.2)' },
    purple: { bg: 'var(--purple-dim)', text: 'var(--purple)', border: 'rgba(155,89,246,0.2)' },
  };
  const c = colors[color] || colors.accent;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {children}
    </span>
  );
}

/* ── Stat Card ────────────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, icon: Icon, color = 'accent', glow = false }) {
  const colors = {
    accent: { text: 'var(--accent)', bg: 'var(--accent-dim)', glow: 'var(--accent-glow)' },
    green:  { text: 'var(--green)',  bg: 'var(--green-dim)',  glow: 'rgba(34,212,138,0.4)' },
    yellow: { text: 'var(--yellow)', bg: 'var(--yellow-dim)', glow: 'rgba(255,215,0,0.4)' },
    red:    { text: 'var(--red)',    bg: 'var(--red-dim)',    glow: 'rgba(255,77,109,0.4)' },
    purple: { text: 'var(--purple)', bg: 'var(--purple-dim)', glow: 'rgba(155,89,246,0.4)' },
    orange: { text: 'var(--orange)', bg: 'var(--orange-dim)', glow: 'rgba(255,140,66,0.4)' },
  };
  const c = colors[color] || colors.accent;

  return (
    <Card style={{
      boxShadow: glow ? `0 0 24px ${c.glow}` : 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 32, height: 32, background: c.bg, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} style={{ color: c.text }} />
          </div>
        )}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700,
        color: c.text, lineHeight: 1.1,
      }}>
        {value}
      </div>
      {sub && <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
export function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{
        fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
        color: 'var(--text-secondary)', marginBottom: 8,
      }}>{title}</h3>
      {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 320 }}>{subtitle}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

/* ── Loader ───────────────────────────────────────────────────────────────── */
export function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '2px solid var(--border-default)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
        LOADING...
      </span>
    </div>
  );
}

/* ── Error Banner ─────────────────────────────────────────────────────────── */
export function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      background: 'var(--red-dim)', border: '1px solid rgba(255,77,109,0.3)',
      borderRadius: 'var(--radius-md)', padding: '12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 16,
    }}>
      <span style={{ color: 'var(--red)', fontSize: 13 }}>⚠ {message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: 'none', border: 'none', color: 'var(--red)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline',
        }}>Retry</button>
      )}
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)', padding: 28, width, maxWidth: '95vw',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
            color: 'var(--text-primary)',
          }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            color: 'var(--text-muted)', borderRadius: 6, width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Form field ───────────────────────────────────────────────────────────── */
export function Field({ label, children, error, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{
          display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1,
          color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6,
        }}>{label}</label>
      )}
      {children}
      {error && <p style={{ color: 'var(--red)', fontSize: 11, marginTop: 4 }}>{error}</p>}
      {hint && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

/* ── Mini progress bar ────────────────────────────────────────────────────── */
export function ProgressBar({ pct, color = 'var(--accent)', height = 6 }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div style={{
      height, background: 'var(--bg-base)', borderRadius: height,
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        height: '100%', width: `${clamped}%`, background: color,
        borderRadius: height, transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

/* ── Tab bar ──────────────────────────────────────────────────────────────── */
export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
      padding: 4, gap: 2,
    }}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, padding: '7px 12px',
              background: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? '#000' : 'var(--text-muted)',
              border: 'none', borderRadius: 6,
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {Icon && <Icon size={13} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
