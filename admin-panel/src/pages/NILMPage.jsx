import React, { useState, useEffect } from 'react';
import { Bot, CheckCircle, AlertTriangle, Zap, Activity, Info, BarChart2 } from 'lucide-react';
import { nilmAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, SectionHeader, Btn, EmptyState, PageLoader, StatCard, ProgressBar } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

// Simple helper to match categories to neon theme colors
const getCategoryColor = (cat) => {
  const map = {
    'AC': 'var(--accent)',
    'Refrigerator': 'var(--blue)',
    'Washing Machine': 'var(--purple)',
    'TV': 'var(--green)',
    'Fan': 'var(--yellow)',
    'Light': 'var(--orange)',
    'Water Heater': 'var(--red)'
  };
  return map[cat] || 'var(--text-muted)';
};

export default function NILMPage() {
  const { selectedAccount } = useAuth();
  const [setup, setSetup] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!selectedAccount) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.allSettled([
      nilmAPI.verifySetup(selectedAccount),
      nilmAPI.getAccuracyReport(selectedAccount)
    ]).then(([sRes, aRes]) => {
      if (sRes.status === 'fulfilled') setSetup(sRes.value.data);
      if (aRes.status === 'fulfilled') setAccuracy(aRes.value.data);
      setLoading(false);
    });
  }, [selectedAccount]);

  const handleRunNILM = async () => {
    if (!selectedAccount) return;
    setRunning(true);
    try {
      const res = await nilmAPI.disaggregate(selectedAccount);
      if (res.data.success) {
        setBreakdown(res.data.data);
      } else {
        alert(res.data.message || 'NILM Disaggregation failed.');
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'An error occurred during disaggregation.');
    }
    setRunning(false);
  };

  if (loading) return <PageLoader />;

  if (!selectedAccount) {
    return <EmptyState icon="⚡" title="Account Required" subtitle="Select an account to view NILM insights." />;
  }

  // Formatting data for the chart
  const chartData = breakdown?.breakdown?.map(b => ({
    name: (b.appliance_name || b.appliance_id).substring(0, 10),
    kwh: b.estimated_kwh,
    pct: b.percentage,
    color: getCategoryColor(b.category)
  })) || [];

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      
      {/* Header */}
      <Card className="mb-5 border-[#00E5FF]/30 bg-[#00E5FF]/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white m-0 mb-1 flex items-center gap-2">
              <Zap className="text-[#00E5FF]" size={24} />
              NILM Disaggregation
            </h2>
            <p className="text-[#94A3B8] m-0 text-sm font-medium">AI-powered appliance breakdown</p>
          </div>
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="self-end sm:self-auto w-10 h-10 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
          >
            <Info size={24} />
          </button>
        </div>

        {showInfo && (
          <div className="mt-4 pt-4 border-t border-[#1E293B] animate-[fadeIn_0.3s_ease]">
            <h4 className="text-[#00E5FF] m-0 mb-2 text-sm font-bold">What is NILM?</h4>
            <p className="text-[#94A3B8] text-sm leading-relaxed m-0">
              Non-Intrusive Load Monitoring (NILM) uses advanced Bayesian Machine Learning to analyze your total household energy consumption and estimate exactly how much power each individual appliance uses, without requiring smart plugs for every device.
            </p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Setup Status */}
        {setup && (
          <Card className={`border-l-4 ${setup.is_ready ? 'border-l-green-400' : 'border-l-yellow-400'}`}>
            <SectionHeader title="Setup Status" />
            <div className="flex items-center gap-3 mb-3">
              {setup.is_ready ? (
                <CheckCircle size={32} className="text-green-400" />
              ) : (
                <AlertTriangle size={32} className="text-yellow-400" />
              )}
              <div>
                <div className="font-bold text-white">{setup.status_message}</div>
                <div className="text-[#64748B] text-xs mt-0.5 font-medium">
                  {setup.appliances_registered} appliances · {setup.bills_uploaded} bills
                </div>
              </div>
            </div>
            {setup.issues?.length > 0 && (
              <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                {setup.issues.map((issue, i) => (
                  <div key={i} className="text-yellow-400 text-xs mb-1 last:mb-0 font-medium flex items-start gap-1">
                    <span className="shrink-0">•</span> <span>{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Accuracy Report */}
        {accuracy?.estimated_accuracy && (
          <Card>
            <SectionHeader title="Estimated Accuracy" />
            <div className="flex items-center gap-5">
              <div className={`w-[70px] h-[70px] shrink-0 rounded-full border-[3px] flex flex-col items-center justify-center bg-[#0A0D14] ${accuracy.estimated_accuracy > 80 ? 'border-green-400' : 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]'}`}>
                <span className="text-lg font-black text-white">{accuracy.estimated_accuracy}%</span>
                <span className="text-[9px] text-[#64748B] uppercase tracking-widest font-bold">{accuracy.confidence_level}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1.5 p-2 bg-[#131520] rounded-lg border border-[#1E293B]/50">
                  <span className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Expected Range</span>
                  <span className="text-white text-xs font-mono font-bold">{accuracy.expected_range}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-[#131520] rounded-lg border border-[#1E293B]/50">
                  <span className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Method</span>
                  <span className="text-[#00E5FF] text-xs font-bold">Bayesian + ML</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="flex justify-center mb-6">
        <Btn 
          onClick={handleRunNILM} 
          loading={running} 
          disabled={!setup?.is_ready || running}
          icon={<Bot size={18} />}
          className="!px-8 !py-3.5 !text-[15px] !bg-green-400 !text-black hover:!bg-green-300 !rounded-full shadow-[0_0_20px_rgba(74,222,128,0.3)] transition-all"
        >
          {running ? 'Analyzing Energy Data...' : 'Run NILM Disaggregation'}
        </Btn>
      </div>

      {/* Results */}
      {breakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-5">
          <Card>
            <SectionHeader title="Energy Breakdown" subtitle={`${breakdown.total_kwh?.toFixed(1)} kWh Total Analyzed`} />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-subtle)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={100} />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-elevated)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#131520] border border-[#1E293B] p-2.5 rounded-xl text-xs shadow-lg">
                          <p className="text-white font-bold m-0 mb-1">{data.name}</p>
                          <p style={{ color: data.color }} className="m-0 font-mono font-bold">{data.kwh.toFixed(1)} kWh ({data.pct.toFixed(1)}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="kwh" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="flex flex-col gap-4">
            <StatCard label="Accounted Energy" value={`${breakdown.accounted_percentage?.toFixed(1)}%`} icon={Activity} color="green" glow />
            
            <Card className="flex-1">
              <h4 className="text-[#64748B] text-[10px] uppercase tracking-widest font-bold m-0 mb-3">Detailed View</h4>
              <div className="flex flex-col gap-4">
                {breakdown.breakdown?.map((item, i) => {
                  const color = getCategoryColor(item.category);
                  return (
                    <div key={i} className="bg-[#0A0D14] p-3 rounded-xl border border-[#1E293B]">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-white text-xs font-bold line-clamp-1 mr-2">{item.appliance_name}</span>
                        <span style={{ color }} className="text-xs font-mono font-bold whitespace-nowrap">{item.estimated_kwh?.toFixed(1)} kWh</span>
                      </div>
                      <ProgressBar pct={item.percentage} color={color} height="h-1.5" />
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[#64748B] text-[10px] font-bold">{item.percentage?.toFixed(1)}%</span>
                        <span className="text-[#64748B] text-[10px] font-bold">Conf: {(item.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
