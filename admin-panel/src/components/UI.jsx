import React from 'react';
import { Loader2 } from 'lucide-react';

/* ── Card ─────────────────────────────────────────────────────────────────── */
export function Card({ children, className = '', glow = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#131520] border border-[#1E293B] rounded-2xl p-6 ${
        glow ? 'shadow-[0_0_20px_rgba(0,229,255,0.15)]' : 'shadow-lg shadow-black/20'
      } transition-all duration-300 hover:border-[#333B53] ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Section header ───────────────────────────────────────────────────────── */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
      <div>
        <h2 className="text-xl font-bold text-white m-0 tracking-tight">{title}</h2>
        {subtitle && <p className="text-[#94A3B8] text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ── Button ───────────────────────────────────────────────────────────────── */
export function Btn({
  children, onClick, variant = 'primary', size = 'md',
  disabled = false, loading = false, icon, className = '', type = 'button'
}) {
  const variants = {
    primary: 'bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black border-none shadow-[0_0_10px_rgba(0,229,255,0.3)]',
    secondary: 'bg-[#1A1E2D] hover:bg-[#1E293B] text-white border border-[#333B53]',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30',
    ghost: 'bg-transparent hover:bg-[#1A1E2D] text-[#94A3B8] hover:text-white border border-[#333B53]',
    success: 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 
        ${variants[variant]} ${sizes[size]} 
        ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'} ${className}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

/* ── Badge ────────────────────────────────────────────────────────────────── */
export function Badge({ children, color = 'accent', className = '' }) {
  const colors = {
    accent: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30',
    green:  'bg-green-500/10 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red:    'bg-red-500/10 text-red-400 border-red-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide border ${colors[color] || colors.accent} ${className}`}>
      {children}
    </span>
  );
}

/* ── Stat Card ────────────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, icon: Icon, color = 'accent', glow = false }) {
  const colors = {
    accent: { text: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10', glow: 'shadow-[0_0_24px_rgba(0,229,255,0.2)]' },
    green:  { text: 'text-green-400', bg: 'bg-green-500/10', glow: 'shadow-[0_0_24px_rgba(74,222,128,0.2)]' },
    yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', glow: 'shadow-[0_0_24px_rgba(250,204,21,0.2)]' },
    red:    { text: 'text-red-400', bg: 'bg-red-500/10', glow: 'shadow-[0_0_24px_rgba(248,113,113,0.2)]' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'shadow-[0_0_24px_rgba(168,85,247,0.2)]' },
    orange: { text: 'text-orange-400', bg: 'bg-orange-500/10', glow: 'shadow-[0_0_24px_rgba(249,115,22,0.2)]' },
  };
  const c = colors[color] || colors.accent;

  return (
    <Card className={`relative overflow-hidden ${glow ? c.glow : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-bold tracking-wider text-[#94A3B8] uppercase">{label}</span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
            <Icon size={20} className={c.text} />
          </div>
        )}
      </div>
      <div className={`font-mono text-3xl font-bold ${c.text} truncate`}>{value}</div>
      {sub && <div className="text-[#64748B] text-xs mt-2 truncate">{sub}</div>}
    </Card>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
export function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center border-2 border-dashed border-[#1E293B] rounded-2xl bg-[#0A0D14]/50">
      <div className="text-5xl mb-5 filter drop-shadow-lg">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      {subtitle && <p className="text-[#94A3B8] text-sm max-w-sm mb-6 leading-relaxed">{subtitle}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

/* ── Loader ───────────────────────────────────────────────────────────────── */
export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-[#1E293B] border-t-[#00E5FF] animate-spin" />
      <span className="text-[#64748B] text-xs font-mono tracking-widest">LOADING DATA...</span>
    </div>
  );
}

/* ── Error Banner ─────────────────────────────────────────────────────────── */
export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <span className="text-lg">⚠</span>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-red-400 text-xs font-bold hover:underline whitespace-nowrap">
          TRY AGAIN
        </button>
      )}
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 opacity-100 transition-opacity duration-300"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className={`bg-[#131520] border border-[#1E293B] rounded-2xl p-6 md:p-8 w-full ${width} max-h-[90vh] overflow-y-auto shadow-2xl animate-[fadeIn_0.2s_ease-out]`}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1E293B]">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg bg-[#1A1E2D] border border-[#333B53] text-[#94A3B8] hover:text-white hover:bg-[#1E293B] flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

/* ── Form field ───────────────────────────────────────────────────────────── */
export function Field({ label, children, error, hint, className = '' }) {
  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <label className="block text-[11px] font-bold tracking-widest text-[#64748B] uppercase mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && (child.type === 'input' || child.type === 'select' || child.type === 'textarea')) {
            return React.cloneElement(child, {
              className: `w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all ${child.props.className || ''}`
            });
          }
          return child;
        })}
      </div>
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
      {hint && <p className="text-[#64748B] text-xs mt-1.5">{hint}</p>}
    </div>
  );
}

/* ── Mini progress bar ────────────────────────────────────────────────────── */
export function ProgressBar({ pct, color = 'bg-[#00E5FF]', height = 'h-2' }) {
  const clamped = Math.min(100, Math.max(0, pct || 0));
  return (
    <div className={`w-full bg-[#1E293B] rounded-full overflow-hidden ${height}`}>
      <div 
        className={`${height} ${color.includes('var(') ? '' : color} rounded-full transition-all duration-700 ease-out`} 
        style={{ width: `${clamped}%`, backgroundColor: color.includes('var(') ? color : undefined }} 
      />
    </div>
  );
}

/* ── Tab bar ──────────────────────────────────────────────────────────────── */
export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex p-1.5 bg-[#131520] border border-[#1E293B] rounded-xl overflow-x-auto hide-scrollbar">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap min-w-[120px]
              ${isActive 
                ? 'bg-[#00E5FF] text-black shadow-[0_2px_10px_rgba(0,229,255,0.2)]' 
                : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1E2D]'
              }`}
          >
            {Icon && <Icon size={16} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
