import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Plug, FileText, BarChart3, Target,
  Activity, ShieldAlert, User, LogOut, ChevronRight,
  Zap, Menu, X, ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './AppShell.module.css';

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',     group: 'main' },
  { to: '/appliances', icon: Plug,            label: 'Appliances',    group: 'main' },
  { to: '/bills',      icon: FileText,        label: 'Bills',         group: 'main' },
  { to: '/analysis',   icon: BarChart3,       label: 'Analysis',      group: 'insights' },
  { to: '/plans',      icon: Target,          label: 'Budget Plans',  group: 'insights' },
  { to: '/live',       icon: Activity,        label: 'Live Meter',    group: 'monitor' },
  { to: '/safety',     icon: ShieldAlert,     label: 'Safety',        group: 'monitor' },
];

export default function AppShell({ children }) {
  const { user, accounts, selectedAccount, setSelectedAccount, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const location = useLocation();

  const currentAcct = accounts.find(a =>
    (a.account_number || a) === selectedAccount
  );

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}><Zap size={18} /></div>
          {!collapsed && <span className={styles.logoText}>EnergyIQ</span>}
        </div>

        {/* Account selector */}
        {!collapsed && (
          <div className={styles.acctSelector} onClick={() => setAcctOpen(!acctOpen)}>
            <div className={styles.acctInfo}>
              <span className={styles.acctLabel}>Account</span>
              <span className={styles.acctNum}>{selectedAccount || '—'}</span>
            </div>
            <ChevronDown size={14} className={acctOpen ? styles.chevronOpen : ''} style={{ transition: '0.2s', color: 'var(--text-muted)' }} />
            {acctOpen && (
              <div className={styles.acctDropdown}>
                {accounts.map(a => {
                  const num = a.account_number || a;
                  return (
                    <div
                      key={num}
                      className={`${styles.acctItem} ${num === selectedAccount ? styles.acctItemActive : ''}`}
                      onClick={(e) => { e.stopPropagation(); setSelectedAccount(a); setAcctOpen(false); }}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Nav groups */}
        {['main', 'insights', 'monitor'].map(group => (
          <div key={group} className={styles.navGroup}>
            {!collapsed && (
              <span className={styles.navGroupLabel}>
                {{ main: 'MANAGEMENT', insights: 'INSIGHTS', monitor: 'MONITOR' }[group]}
              </span>
            )}
            {NAV.filter(n => n.group === group).map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={16} className={styles.navIcon} />
                {!collapsed && <span className={styles.navLabel}>{label}</span>}
                {!collapsed && location.pathname === to && (
                  <ChevronRight size={12} className={styles.navChevron} />
                )}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Bottom */}
        <div className={styles.sidebarBottom}>
          <NavLink to="/profile" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
            <User size={16} className={styles.navIcon} />
            {!collapsed && <span className={styles.navLabel}>Profile</span>}
          </NavLink>
          <button className={styles.navItem} onClick={logout}>
            <LogOut size={16} className={styles.navIcon} style={{ color: 'var(--red)' }} />
            {!collapsed && <span className={styles.navLabel} style={{ color: 'var(--red)' }}>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={14} /> : <X size={14} />}
        </button>
      </aside>

      {/* Main area */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <h1 className={styles.pageTitle}>
              {NAV.find(n => n.to === location.pathname)?.label || 'Profile'}
            </h1>
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot} />
              <span className={styles.liveText}>LIVE</span>
            </div>
            <div className={styles.userBadge}>
              <div className={styles.userAvatar}>
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <span className={styles.userName}>{user?.name || user?.email || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
