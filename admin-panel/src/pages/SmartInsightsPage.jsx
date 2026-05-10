import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, AlertTriangle, CheckCircle, Search, Lightbulb, BarChart2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import { Card, SectionHeader, Btn, Badge, TabBar, PageLoader, ErrorBanner, ProgressBar } from '../components/UI';

export default function SmartInsightsPage() {
  const { selectedAccount } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('spike');

  const loadInsights = async () => {
    if (!selectedAccount) return;
    setLoading(true); setError('');
    try {
      const res = await apiClient.get(`/api/v1/smart/insights-summary/${selectedAccount}`);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load smart insights.');
    }
    setLoading(false);
  };

  useEffect(() => { loadInsights(); }, [selectedAccount]);

  if (loading) return <PageLoader />;

  const tabs = [
    { id: 'spike', label: 'Spike Alert', icon: Zap },
    { id: 'tariff', label: 'Tariff Watch', icon: AlertTriangle },
    { id: 'efficiency', label: 'Efficiency Score', icon: BarChart2 },
  ];

  const spikeData = data?.spike_prediction;
  const tariffData = data?.tariff_warning;
  const effData = data?.efficiency_score;

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="mb-6 overflow-x-auto">
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>
      {error && <ErrorBanner message={error} onRetry={loadInsights} />}

      {/* ── SPIKE ALERT ────────────────────────────────────────── */}
      {tab === 'spike' && (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {spikeData ? (
            <>
              <Card glow={spikeData.spike_risk === 'high'}>
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#1E293B] pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Next Month Forecast</h2>
                    <p className="text-sm text-[#64748B]">Based on {spikeData.bills_used} months of history</p>
                  </div>
                  <Badge color={spikeData.spike_risk === 'high' ? 'red' : spikeData.spike_risk === 'medium' ? 'yellow' : 'green'} className="px-4 py-1.5 text-sm">
                    {spikeData.spike_risk.toUpperCase()} RISK
                  </Badge>
                </div>
                
                <div className="flex items-center gap-6 my-6">
                  <div className={`text-6xl font-black ${spikeData.spike_risk === 'high' ? 'text-red-400' : spikeData.spike_risk === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {Math.round(spikeData.spike_probability * 100)}<span className="text-3xl">%</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-[#64748B] tracking-wider uppercase mb-2">Spike Probability</div>
                    <ProgressBar 
                      pct={spikeData.spike_probability * 100} 
                      color={spikeData.spike_risk === 'high' ? '#F87171' : spikeData.spike_risk === 'medium' ? '#FACC15' : '#4ADE80'} 
                      height="h-3"
                    />
                  </div>
                </div>
                <p className="text-[#94A3B8] leading-relaxed">{spikeData.message}</p>
              </Card>

              {spikeData.predicted_kwh_range && (
                <Card>
                  <SectionHeader title="Predicted Usage Range" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#0A0D14] p-5 rounded-xl border border-[#1E293B]">
                      <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Low Estimate</div>
                      <div className="text-3xl font-bold text-white mb-1">{spikeData.predicted_kwh_range[0]} <span className="text-lg text-[#64748B]">kWh</span></div>
                      <div className="text-sm text-green-400 font-mono">Rs. {spikeData.predicted_bill_range?.[0]?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div className="bg-[#0A0D14] p-5 rounded-xl border border-[#1E293B]">
                      <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">High Estimate</div>
                      <div className={`text-3xl font-bold mb-1 ${spikeData.spike_risk === 'high' ? 'text-red-400' : 'text-white'}`}>
                        {spikeData.predicted_kwh_range[1]} <span className="text-lg text-[#64748B]">kWh</span>
                      </div>
                      <div className="text-sm text-red-400 font-mono">Rs. {spikeData.predicted_bill_range?.[1]?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>
                </Card>
              )}

              {spikeData.factors?.length > 0 && (
                <Card>
                  <SectionHeader title="Why this prediction?" />
                  <ul className="pl-5 text-[#94A3B8] flex flex-col gap-3 list-disc marker:text-[#00E5FF]">
                    {spikeData.factors.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </Card>
              )}
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-20 text-center text-[#64748B]">
              <Zap size={48} className="opacity-30 mb-4" />
              <p>No spike prediction data available. Add more bills.</p>
            </Card>
          )}
        </div>
      )}

      {/* ── TARIFF WATCH ───────────────────────────────────────── */}
      {tab === 'tariff' && (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {tariffData?.status !== 'no_data' && tariffData ? (
            <>
              <div className={`p-5 rounded-2xl flex flex-col sm:flex-row gap-4 sm:items-center border ${
                  tariffData.warning?.status === 'danger' ? 'bg-red-500/10 border-red-500' : 
                  tariffData.warning?.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500' : 
                  'bg-green-500/10 border-green-500'
                }`}>
                <div className="text-4xl">{tariffData.warning?.emoji}</div>
                <div>
                  <h3 className={`font-bold text-lg mb-1 ${
                    tariffData.warning?.status === 'danger' ? 'text-red-400' : 
                    tariffData.warning?.status === 'warning' ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    {tariffData.warning?.title}
                  </h3>
                  <p className="text-white text-sm leading-relaxed">{tariffData.warning?.message}</p>
                </div>
              </div>

              <Card>
                <SectionHeader title="Billing Period Progress" subtitle={`Day ${tariffData.days_elapsed} of ${tariffData.total_billing_days} (${tariffData.days_remaining} days left)`} />
                <ProgressBar pct={tariffData.period_progress_pct} color="#00E5FF" height="h-3" />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="bg-[#0A0D14] p-5 rounded-xl border border-[#1E293B] text-center">
                    <div className="text-[10px] font-bold text-[#64748B] tracking-widest uppercase mb-2">KWH SO FAR</div>
                    <div className="text-3xl font-bold text-white">{tariffData.kwh_so_far}</div>
                  </div>
                  <div className="bg-[#0A0D14] p-5 rounded-xl border border-[#1E293B] text-center">
                    <div className="text-[10px] font-bold text-[#64748B] tracking-widest uppercase mb-2">KWH/DAY RATE</div>
                    <div className="text-3xl font-bold text-white">{tariffData.daily_rate_kwh}</div>
                  </div>
                  <div className="bg-[#0A0D14] p-5 rounded-xl border border-[#1E293B] text-center">
                    <div className="text-[10px] font-bold text-[#64748B] tracking-widest uppercase mb-2">PROJECTED TOTAL</div>
                    <div className={`text-3xl font-bold ${tariffData.projected_kwh > 60 ? 'text-red-400' : 'text-green-400'}`}>{tariffData.projected_kwh}</div>
                  </div>
                </div>
              </Card>

              {tariffData.warning?.extra_cost_rs > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500 p-4 rounded-xl flex items-center gap-3 text-yellow-400 font-bold">
                  <AlertTriangle size={20} />
                  Crossing boundary adds Rs. {tariffData.warning.extra_cost_rs.toLocaleString()} to your bill!
                </div>
              )}
            </>
          ) : (
             <Card className="flex flex-col items-center justify-center py-20 text-center text-[#64748B]">
               <AlertTriangle size={48} className="opacity-30 mb-4" />
               <p>No recent meter readings to calculate tariff watch.</p>
             </Card>
          )}
        </div>
      )}

      {/* ── EFFICIENCY SCORE ───────────────────────────────────── */}
      {tab === 'efficiency' && (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {effData ? (
            <>
              <Card className="text-center">
                <SectionHeader title="Your Efficiency Score" />
                <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center rounded-full border-[12px]" style={{ borderColor: effData.grade_color }}>
                  <div>
                    <div className="text-6xl font-black" style={{ color: effData.grade_color }}>{Math.round(effData.score)}</div>
                    <div className="text-sm font-bold text-[#64748B] mt-1">/ 100</div>
                  </div>
                </div>
                <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold tracking-wide border" style={{ backgroundColor: effData.grade_color + '20', color: effData.grade_color, borderColor: effData.grade_color + '40' }}>
                  Grade {effData.grade} · {effData.grade_label}
                </div>
                <p className="mt-5 text-[#94A3B8] leading-relaxed max-w-lg mx-auto">{effData.comparison_message}</p>
              </Card>

              <Card>
                <SectionHeader title="Actual vs Expected" />
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                  <div className="flex-1 sm:pr-6 sm:border-r border-[#1E293B]">
                    <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Actual Usage</div>
                    <div className={`text-3xl font-bold mb-3 ${effData.actual_kwh > effData.expected_kwh ? 'text-red-400' : 'text-green-400'}`}>{effData.actual_kwh} <span className="text-lg text-[#64748B]">kWh</span></div>
                    <ProgressBar pct={(effData.actual_kwh / (Math.max(effData.actual_kwh, effData.expected_kwh) * 1.1)) * 100} color={effData.actual_kwh > effData.expected_kwh ? '#F87171' : '#4ADE80'} height="h-2" />
                  </div>
                  <div className="flex-1 sm:pl-6">
                    <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Expected Baseline</div>
                    <div className="text-3xl font-bold text-[#94A3B8] mb-3">{effData.expected_kwh} <span className="text-lg text-[#64748B]">kWh</span></div>
                    <ProgressBar pct={(effData.expected_kwh / (Math.max(effData.actual_kwh, effData.expected_kwh) * 1.1)) * 100} color="#64748B" height="h-2" />
                  </div>
                </div>
                
                <div className={`p-5 rounded-xl text-center border mt-4 ${effData.saving_kwh >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className={`text-xl font-bold mb-1 ${effData.saving_kwh >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {effData.saving_kwh >= 0 ? '✅' : '⚠️'} {Math.abs(effData.saving_kwh).toFixed(0)} kWh {effData.saving_kwh >= 0 ? 'below' : 'above'} expected
                  </div>
                  <div className={`text-sm ${effData.saving_kwh >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ≈ Rs. {Math.abs(effData.saving_rs).toLocaleString(undefined, { maximumFractionDigits: 0 })}/month {effData.saving_kwh >= 0 ? 'saved' : 'extra'}
                  </div>
                </div>
              </Card>
              
              {effData.improvement_tips?.length > 0 && (
                <Card>
                  <SectionHeader title="How to improve" />
                  <ul className="pl-5 text-[#94A3B8] flex flex-col gap-3 list-disc marker:text-[#00E5FF]">
                    {effData.improvement_tips.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </Card>
              )}
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-20 text-center text-[#64748B]">
              <BarChart2 size={48} className="opacity-30 mb-4" />
              <p>No efficiency data available. Complete your profile and add bills.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
