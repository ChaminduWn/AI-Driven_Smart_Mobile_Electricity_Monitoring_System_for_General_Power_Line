import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, TrendingUp, TrendingDown, DollarSign, Activity,
  Plug, FileText, Target, ShieldAlert, ArrowRight, RefreshCw, Sun
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
    <div className="bg-[#131520] border border-[#1E293B] rounded-xl p-3 text-xs shadow-lg">
      <p className="text-[#64748B] mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
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
    { label: 'Add Bill',         icon: FileText,    to: '/d/analysis', color: 'var(--accent)' },
    { label: 'Live Meter',       icon: Activity,    to: '/d/monitoring',color: 'var(--green)' },
    { label: 'NILM Report',      icon: Zap,         to: '/d/nilm',     color: 'var(--purple)' },
    { label: 'Solar Sizing',     icon: Sun,         to: '/d/solar',    color: 'var(--yellow)' },
    { label: 'Safety',           icon: ShieldAlert, to: '/d/safety',   color: 'var(--red)' },
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
    <div className="animate-[fadeIn_0.3s_ease]">
      {/* Welcome strip */}
      <div className="bg-gradient-to-br from-[#0A0D14] to-[#131520] border border-[#1E293B] rounded-[24px] p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-[radial-gradient(circle,rgba(0,229,255,0.15)_0%,transparent_70%)] rounded-full" />
        <div className="relative z-10">
          <p className="text-[#64748B] text-xs mb-1 uppercase tracking-wider font-bold">Welcome back</p>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
            {user?.name || user?.email?.split('@')[0] || 'User'} ⚡
          </h2>
          <p className="text-[#94A3B8] text-sm mt-1">
            Account <span className="font-mono text-[#00E5FF] font-bold">{selectedAccount}</span>
          </p>
        </div>
        <Btn icon={<RefreshCw size={14} />} variant="secondary" size="sm" onClick={() => window.location.reload()} className="relative z-10 w-fit">
          Refresh
        </Btn>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Appliance power chart */}
        <Card className="lg:col-span-2">
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
          <div className="flex flex-col gap-2">
            {quickActions.map(({ label, icon: Icon, to, color }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex items-center gap-3 p-3 bg-[#0A0D14] border border-[#1E293B] rounded-xl text-white cursor-pointer transition-all duration-200 text-sm font-bold text-left group hover:bg-[#131520]"
                style={{ '--hover-color': color }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                  style={{ background: `${color}15` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <span>{label}</span>
                <ArrowRight size={14} className="ml-auto text-[#64748B] group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
