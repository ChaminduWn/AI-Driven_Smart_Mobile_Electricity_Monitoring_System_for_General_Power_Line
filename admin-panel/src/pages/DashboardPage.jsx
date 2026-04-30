import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, TrendingUp, TrendingDown, DollarSign, Activity,
  Plug, FileText, Target, ShieldAlert, ArrowRight, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { billsAPI, appliancesAPI, analysisAPI } from '../services/api';
import { Card, StatCard, SectionHeader, Btn, PageLoader, EmptyState } from '../components/UI';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { selectedAccount, user } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedAccount) return;
    const load = async () => {
      setLoading(true);
      try {
        const [bRes, aRes] = await Promise.allSettled([
          billsAPI.getByAccount(selectedAccount),
          appliancesAPI.getByAccount(selectedAccount),
        ]);
        if (bRes.status === 'fulfilled') {
          const raw = bRes.value.data?.bills || bRes.value.data || [];
          setBills(Array.isArray(raw) ? raw : []);
        }
        if (aRes.status === 'fulfilled') {
          const raw = aRes.value.data?.appliances || aRes.value.data || [];
          setAppliances(Array.isArray(raw) ? raw : []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [selectedAccount]);

  const latestBill = bills[0] || null;
  const totalUnits = bills.slice(0, 3).reduce((s, b) => s + (b.units_consumed || b.units || 0), 0);
  const totalCost = bills.slice(0, 3).reduce((s, b) => s + (b.amount || b.total_amount || 0), 0);
  const activeAppliances = appliances.filter(a => a.is_active !== false).length;

  // Build chart data from bills (last 6)
  const chartData = [...bills].reverse().slice(0, 6).map((b, i) => ({
    month: b.billing_month || b.period || `Period ${i + 1}`,
    units: b.units_consumed || b.units || 0,
    cost: b.amount || b.total_amount || 0,
  }));

  // Appliance breakdown for bar chart
  const applianceData = appliances.slice(0, 6).map(a => ({
    name: (a.name || a.appliance_name || 'Device').slice(0, 10),
    watt: a.wattage || a.power_rating || 0,
  }));

  const quickActions = [
    { label: 'Add Bill',         icon: FileText,    to: '/bills',      color: 'var(--accent)' },
    { label: 'Live Meter',       icon: Activity,    to: '/live',       color: 'var(--green)' },
    { label: 'Budget Plans',     icon: Target,      to: '/plans',      color: 'var(--yellow)' },
    { label: 'Safety',           icon: ShieldAlert, to: '/safety',     color: 'var(--red)' },
  ];

  if (!selectedAccount) return (
    <EmptyState
      icon="⚡"
      title="No account selected"
      subtitle="Please select or add an electricity account to get started."
    />
  );

  if (loading) return <PageLoader />;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Welcome strip */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)', padding: '20px 24px',
        marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>Welcome back</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            {user?.name || user?.email?.split('@')[0] || 'User'} ⚡
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Account <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{selectedAccount}</span>
          </p>
        </div>
        <Btn icon={<RefreshCw size={14} />} variant="secondary" size="sm" onClick={() => window.location.reload()}>
          Refresh
        </Btn>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Latest Bill"
          value={latestBill ? `Rs. ${(latestBill.amount || latestBill.total_amount || 0).toLocaleString()}` : '—'}
          sub={latestBill ? `${latestBill.units_consumed || latestBill.units || 0} kWh` : 'No bills yet'}
          icon={DollarSign}
          color="accent"
          glow
        />
        <StatCard
          label="Units (3 months)"
          value={`${totalUnits.toLocaleString()} kWh`}
          sub={`Avg ${bills.length ? Math.round(totalUnits / Math.min(bills.length, 3)) : 0} kWh/month`}
          icon={Zap}
          color="yellow"
        />
        <StatCard
          label="Total Spend (3mo)"
          value={`Rs. ${totalCost.toLocaleString()}`}
          sub={`${bills.length} bill${bills.length !== 1 ? 's' : ''} on record`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Active Appliances"
          value={activeAppliances}
          sub={`${appliances.length} total registered`}
          icon={Plug}
          color="purple"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Usage trend */}
        <Card>
          <SectionHeader title="Consumption Trend" subtitle="Monthly kWh usage" />
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="unitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="units" name="Units (kWh)" stroke="#00D4FF" strokeWidth={2} fill="url(#unitGrad)" dot={{ fill: '#00D4FF', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="📊" title="No billing data" subtitle="Add bills to see trends" />
          )}
        </Card>

        {/* Cost trend */}
        <Card>
          <SectionHeader title="Cost Trend" subtitle="Monthly spend in Rs." />
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="cost" name="Cost (Rs.)" stroke="#22D48A" strokeWidth={2} dot={{ fill: '#22D48A', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="💰" title="No cost data" subtitle="Add bills to see spending" />
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Appliance power chart */}
        <Card>
          <SectionHeader
            title="Appliance Power Ratings"
            subtitle="Top registered appliances (Watt)"
            action={<Btn size="sm" variant="ghost" icon={<ArrowRight size={12} />} onClick={() => navigate('/appliances')}>Manage</Btn>}
          />
          {applianceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={applianceData} barSize={24}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="watt" name="Wattage (W)" fill="#9B59F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="🔌" title="No appliances" subtitle="Register your devices to see breakdown" />
          )}
        </Card>

        {/* Quick actions */}
        <Card>
          <SectionHeader title="Quick Actions" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickActions.map(({ label, icon: Icon, to, color }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                  textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <span>{label}</span>
                <ArrowRight size={12} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
