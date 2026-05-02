import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, GitCompare, Lightbulb, RefreshCw, ChevronDown, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line } from 'recharts';
import { analysisAPI, billsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, SectionHeader, Btn, Badge, TabBar, Field, PageLoader, ErrorBanner, StatCard } from '../components/UI';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#131520] border border-[#1E293B] rounded-xl p-3 text-xs shadow-lg">
      <p className="text-[#64748B] mb-1 font-medium">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-bold m-0 mt-0.5">{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function AnalysisPage() {
  const { selectedAccount } = useAuth();
  const [tab, setTab] = useState('tariff');
  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(true);

  // Tariff calculator
  const [tariffUnits, setTariffUnits] = useState('');
  const [tariffDays, setTariffDays] = useState('30');
  const [tariffResult, setTariffResult] = useState(null);
  const [tariffLoading, setTariffLoading] = useState(false);

  // Bill analysis
  const [selectedBill, setSelectedBill] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Compare
  const [bill1, setBill1] = useState('');
  const [bill2, setBill2] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Budget recs
  const [recBill, setRecBill] = useState('');
  const [recsResult, setRecsResult] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);

  // Tracking
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [planReadings, setPlanReadings] = useState([]);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [newReading, setNewReading] = useState('');
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [readingNotes, setReadingNotes] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  // Plan creation
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [planBill, setPlanBill] = useState('');
  const [planTarget, setPlanTarget] = useState('');
  const [planDays, setPlanDays] = useState('30');
  const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [createPlanLoading, setCreatePlanLoading] = useState(false);

  useEffect(() => {
    if (!selectedAccount) return;
    billsAPI.getByAccount(selectedAccount)
      .then(r => { const raw = r.data?.bills || r.data || []; setBills(Array.isArray(raw) ? raw : []); })
      .catch(() => {})
      .finally(() => setBillsLoading(false));
  }, [selectedAccount]);

  useEffect(() => {
    if (tab === 'tracking' && selectedAccount) {
      loadPlans();
    }
  }, [tab, selectedAccount]);

  const calcTariff = async () => {
    if (!tariffUnits) return;
    setTariffLoading(true); setTariffResult(null);
    try {
      const r = await analysisAPI.calculateTariff(parseFloat(tariffUnits), parseInt(tariffDays) || 30);
      setTariffResult(r.data);
    } catch (e) { alert(e.response?.data?.detail || 'Calculation failed.'); }
    setTariffLoading(false);
  };

  const runAnalysis = async () => {
    if (!selectedBill) return;
    setAnalysisLoading(true); setAnalysisResult(null);
    try {
      const r = await analysisAPI.analyzePastMonth(selectedBill);
      setAnalysisResult(r.data);
    } catch (e) { alert(e.response?.data?.detail || 'Analysis failed.'); }
    setAnalysisLoading(false);
  };

  const runCompare = async () => {
    if (!bill1 || !bill2) return;
    setCompareLoading(true); setCompareResult(null);
    try {
      const r = await analysisAPI.comparePeriods(bill1, bill2);
      setCompareResult(r.data);
    } catch (e) { alert(e.response?.data?.detail || 'Comparison failed.'); }
    setCompareLoading(false);
  };

  const loadRecs = async () => {
    if (!recBill) return;
    setRecsLoading(true); setRecsResult(null);
    try {
      const r = await analysisAPI.getBudgetRecommendations(recBill);
      setRecsResult(r.data);
    } catch (e) { alert(e.response?.data?.detail || 'Failed to load recommendations.'); }
    setRecsLoading(false);
  };

  const loadPlans = async () => {
    setPlansLoading(true);
    try {
      const r = await analysisAPI.getPlansByAccount(selectedAccount, false);
      setPlans(r.data?.plans || []);
    } catch (e) { alert(e.response?.data?.detail || 'Failed to load plans.'); }
    setPlansLoading(false);
  };

  const loadPlanReadings = async (planId) => {
    setReadingsLoading(true);
    try {
      const r = await analysisAPI.getPlanReadings(planId);
      setPlanReadings(r.data?.readings || []);
    } catch (e) { alert(e.response?.data?.detail || 'Failed to load readings.'); }
    setReadingsLoading(false);
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    if (planId) loadPlanReadings(planId);
    else setPlanReadings([]);
  };

  const submitReading = async () => {
    if (!selectedPlan || !newReading) return;
    setTrackingLoading(true);
    try {
      await analysisAPI.trackProgress(selectedPlan, parseFloat(newReading), readingDate, readingNotes || null);
      setNewReading('');
      setReadingNotes('');
      loadPlanReadings(selectedPlan);
      alert('Reading added successfully!');
    } catch (e) { alert(e.response?.data?.detail || 'Failed to add reading.'); }
    setTrackingLoading(false);
  };

  const createPlan = async () => {
    if (!planBill || !planTarget) return;
    setCreatePlanLoading(true);
    try {
      await analysisAPI.createBudgetPlan(planBill, parseFloat(planTarget), parseInt(planDays), planStartDate);
      setShowCreatePlan(false);
      setPlanBill('');
      setPlanTarget('');
      setPlanDays('30');
      setPlanStartDate(new Date().toISOString().split('T')[0]);
      loadPlans();
      alert('Plan created successfully!');
    } catch (e) { alert(e.response?.data?.detail || 'Failed to create plan.'); }
    setCreatePlanLoading(false);
  };

  const tabs = [
    { id: 'tariff',   label: 'Tariff Calc',    icon: Calculator },
    { id: 'analysis', label: 'Bill Analysis',  icon: TrendingUp },
    { id: 'compare',  label: 'Compare Bills',  icon: GitCompare },
    { id: 'recs',     label: 'Recommendations',icon: Lightbulb },
    { id: 'tracking', label: 'Energy Tracking',icon: Target },
  ];

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="mb-6 overflow-x-auto">
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {/* ── TARIFF CALCULATOR ─────────────────────────────────────────────── */}
      {tab === 'tariff' && (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <Card>
            <SectionHeader title="Tariff Calculator" subtitle="Estimate your electricity cost" />
            <Field label="Units (kWh)">
              <input type="number" value={tariffUnits} onChange={e => setTariffUnits(e.target.value)} placeholder="e.g. 180" className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" />
            </Field>
            <Field label="Days">
              <input type="number" value={tariffDays} onChange={e => setTariffDays(e.target.value)} placeholder="30" className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" />
            </Field>
            <Btn onClick={calcTariff} loading={tariffLoading} icon={<Calculator size={14} />} className="w-full mt-2">
              Calculate
            </Btn>
          </Card>

          {tariffResult ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Cost', value: `Rs. ${(tariffResult.total_amount || tariffResult.total || 0).toLocaleString()}`, color: 'accent' },
                  { label: 'Units', value: `${tariffUnits} kWh`, color: 'yellow' },
                  { label: 'Rate', value: `Rs. ${tariffResult.rate_per_unit || tariffResult.avg_rate || '—'}/kWh`, color: 'green' },
                ].map(({ label, value, color }) => (
                  <Card key={label} className="p-4 sm:p-5">
                    <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#94A3B8] uppercase mb-2">{label}</div>
                    <div className="font-mono text-xl sm:text-2xl font-bold truncate" style={{ color: `var(--${color})` }}>{value}</div>
                  </Card>
                ))}
              </div>
              {tariffResult.breakdown && Array.isArray(tariffResult.breakdown) && (
                <Card>
                  <SectionHeader title="Tariff Slab Breakdown" />
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={tariffResult.breakdown.map(b => ({ slab: b.slab || b.range, amount: b.amount || b.cost || 0, units: b.units || 0 }))}>
                      <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="slab" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" name="Amount (Rs.)" fill="#00D4FF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-[#64748B] flex flex-col items-center">
                <Calculator size={48} className="opacity-30 mb-4" />
                <p className="text-sm">Enter units to see cost breakdown</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── BILL ANALYSIS ────────────────────────────────────────────────── */}
      {tab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <Card>
            <SectionHeader title="Past Month Analysis" subtitle="Deep dive into a specific bill" />
            <Field label="Select Bill">
              <select value={selectedBill} onChange={e => setSelectedBill(e.target.value)} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors">
                <option value="">-- Choose a bill --</option>
                {bills.map(b => (
                  <option key={b.id || b._id} value={b.id || b._id}>
                    {b.billing_month || b.period || 'Bill'} — Rs. {(b.amount || b.total_amount || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </Field>
            <Btn onClick={runAnalysis} loading={analysisLoading} disabled={!selectedBill} icon={<TrendingUp size={14} />} className="w-full mt-2">
              Analyze
            </Btn>
          </Card>

          {analysisLoading ? (
            <Card className="flex items-center justify-center min-h-[300px]">
              <div className="w-8 h-8 rounded-full border-2 border-[#1E293B] border-t-[#00E5FF] animate-spin" />
            </Card>
          ) : analysisResult ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Period', value: analysisResult.billing_month || analysisResult.period || '—', color: 'accent' },
                  { label: 'Units', value: `${analysisResult.units_consumed || 0} kWh`, color: 'yellow' },
                  { label: 'Total Cost', value: `Rs. ${(analysisResult.total_amount || 0).toLocaleString()}`, color: 'green' },
                  { label: 'Daily Avg', value: `${analysisResult.daily_avg_units || (analysisResult.units_consumed / 30).toFixed(1) || 0} kWh`, color: 'purple' },
                ].map(({ label, value, color }) => (
                  <Card key={label} className="p-4 sm:p-5">
                    <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#94A3B8] uppercase mb-2">{label}</div>
                    <div className="font-mono text-lg sm:text-xl font-bold truncate" style={{ color: `var(--${color})` }}>{value}</div>
                  </Card>
                ))}
              </div>
              {analysisResult.slab_breakdown && (
                <Card>
                  <SectionHeader title="Slab Breakdown" />
                  <div className="flex flex-col gap-3">
                    {(analysisResult.slab_breakdown || []).map((s, i) => (
                      <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-[#0A0D14] rounded-xl">
                        <span className="text-[#64748B] text-xs w-24">{s.slab || s.range}</span>
                        <span className="font-mono text-sm text-[#00E5FF]">{s.units} kWh</span>
                        <span className="font-mono text-sm text-green-400 sm:ml-auto">Rs. {(s.amount || s.cost || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-[#64748B] flex flex-col items-center">
                <TrendingUp size={48} className="opacity-30 mb-4" />
                <p className="text-sm">Select a bill to analyze</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── COMPARE PERIODS ─────────────────────────────────────────────── */}
      {tab === 'compare' && (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <Card>
            <SectionHeader title="Compare Periods" subtitle="Side-by-side bill comparison" />
            <Field label="Bill 1 (Earlier)">
              <select value={bill1} onChange={e => setBill1(e.target.value)} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors">
                <option value="">-- Select bill 1 --</option>
                {bills.map(b => <option key={b.id || b._id} value={b.id || b._id}>{b.billing_month || b.period} — Rs. {(b.amount || 0).toLocaleString()}</option>)}
              </select>
            </Field>
            <Field label="Bill 2 (Later)">
              <select value={bill2} onChange={e => setBill2(e.target.value)} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors">
                <option value="">-- Select bill 2 --</option>
                {bills.map(b => <option key={b.id || b._id} value={b.id || b._id}>{b.billing_month || b.period} — Rs. {(b.amount || 0).toLocaleString()}</option>)}
              </select>
            </Field>
            <Btn onClick={runCompare} loading={compareLoading} disabled={!bill1 || !bill2} icon={<GitCompare size={14} />} className="w-full mt-2">
              Compare
            </Btn>
          </Card>

          {compareResult ? (
            <Card>
              <SectionHeader title="Comparison Results" />
              {compareResult.comparison && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['period_1', 'period_2'].map((key, idx) => {
                    const p = compareResult.comparison?.[key] || compareResult[key] || {};
                    return (
                      <div key={key} className="bg-[#0A0D14] rounded-xl p-5 border border-[#1E293B]">
                        <div className={`font-bold mb-4 ${idx === 0 ? 'text-[#00E5FF]' : 'text-yellow-400'}`}>
                          Period {idx + 1}: {p.billing_month || p.period || '—'}
                        </div>
                        <div className="flex flex-col gap-3">
                          {[
                            ['Units', `${p.units_consumed || 0} kWh`],
                            ['Cost', `Rs. ${(p.total_amount || p.amount || 0).toLocaleString()}`],
                            ['Daily Avg', `${p.daily_avg || '—'} kWh`],
                          ].map(([lbl, val]) => (
                            <div key={lbl} className="flex justify-between items-center border-b border-[#1E293B]/50 pb-2 last:border-0 last:pb-0">
                              <span className="text-[#64748B] text-xs">{lbl}</span>
                              <span className="font-mono text-sm text-white">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {compareResult.difference && (
                <div className="mt-5 bg-[#0A0D14] rounded-xl p-5 border border-[#1E293B]">
                  <div className="font-bold text-white mb-4">Difference</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(compareResult.difference).map(([k, v]) => (
                      <div key={k} className="text-center p-3 bg-[#131520] rounded-lg">
                        <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">{k.replace(/_/g, ' ')}</div>
                        <div className={`font-mono text-lg font-bold ${Number(v) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {Number(v) > 0 ? '+' : ''}{v}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-[#64748B] flex flex-col items-center">
                <GitCompare size={48} className="opacity-30 mb-4" />
                <p className="text-sm">Select two bills to compare</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── RECOMMENDATIONS ─────────────────────────────────────────────── */}
      {tab === 'recs' && (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <Card>
            <SectionHeader title="Budget Recommendations" subtitle="AI-powered savings suggestions" />
            <Field label="Based on Bill">
              <select value={recBill} onChange={e => setRecBill(e.target.value)} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors">
                <option value="">-- Select bill --</option>
                {bills.map(b => <option key={b.id || b._id} value={b.id || b._id}>{b.billing_month || b.period}</option>)}
              </select>
            </Field>
            <Btn onClick={loadRecs} loading={recsLoading} disabled={!recBill} icon={<Lightbulb size={14} />} className="w-full mt-2">
              Get Recommendations
            </Btn>
          </Card>

          {recsResult ? (
            <Card>
              <SectionHeader title="Savings Recommendations" />
              <div className="flex flex-col gap-4">
                {(recsResult.recommendations || recsResult.tips || []).map((rec, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-[#0A0D14] rounded-xl border-l-4 border-yellow-400">
                    <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Lightbulb size={16} className="text-yellow-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white mb-1">{rec.title || rec.category || `Tip ${i + 1}`}</div>
                      <div className="text-[#94A3B8] text-sm leading-relaxed">{rec.description || rec.tip || rec}</div>
                      {rec.potential_savings && (
                        <div className="text-green-400 text-xs font-bold mt-2">
                          Potential savings: Rs. {rec.potential_savings}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-[#64748B] flex flex-col items-center">
                <Lightbulb size={48} className="opacity-30 mb-4" />
                <p className="text-sm">Select a bill to get personalized recommendations</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── ENERGY TRACKING ─────────────────────────────────────────────── */}
      {tab === 'tracking' && (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <Card>
            <SectionHeader title="Energy Tracking" subtitle="Monitor progress on savings plans" />
            <div className="mb-4">
              <Btn onClick={() => setShowCreatePlan(!showCreatePlan)} variant="secondary" icon={<Target size={14} />} className="w-full">
                {showCreatePlan ? 'Cancel' : 'Create New Plan'}
              </Btn>
            </div>
            {showCreatePlan && (
              <div className="space-y-4 mb-4 p-4 bg-[#0A0D14] rounded-xl border border-[#1E293B]">
                <Field label="Based on Bill">
                  <select value={planBill} onChange={e => setPlanBill(e.target.value)} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors">
                    <option value="">-- Select bill --</option>
                    {bills.map(b => <option key={b.id || b._id} value={b.id || b._id}>{b.billing_month || b.period}</option>)}
                  </select>
                </Field>
                <Field label="Target Budget (Rs.)">
                  <input
                    type="number"
                    value={planTarget}
                    onChange={e => setPlanTarget(e.target.value)}
                    placeholder="Enter target budget"
                    className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                </Field>
                <Field label="Duration (Days)">
                  <input
                    type="number"
                    value={planDays}
                    onChange={e => setPlanDays(e.target.value)}
                    placeholder="30"
                    className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                </Field>
                <Field label="Start Date">
                  <input
                    type="date"
                    value={planStartDate}
                    onChange={e => setPlanStartDate(e.target.value)}
                    className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                </Field>
                <Btn onClick={createPlan} loading={createPlanLoading} disabled={!planBill || !planTarget} icon={<Target size={14} />} className="w-full">
                  Create Plan
                </Btn>
              </div>
            )}
            <Field label="Select Plan">
              <select value={selectedPlan} onChange={e => handlePlanSelect(e.target.value)} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors">
                <option value="">-- Choose a plan --</option>
                {plans.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name || `Plan ${p.id}`} — Target: Rs. {(p.target_budget || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </Field>
            {selectedPlan && (
              <>
                <Field label="Current Reading (kWh)">
                  <input
                    type="number"
                    value={newReading}
                    onChange={e => setNewReading(e.target.value)}
                    placeholder="Enter meter reading"
                    className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                </Field>
                <Field label="Reading Date">
                  <input
                    type="date"
                    value={readingDate}
                    onChange={e => setReadingDate(e.target.value)}
                    className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                </Field>
                <Field label="Notes (Optional)">
                  <textarea
                    value={readingNotes}
                    onChange={e => setReadingNotes(e.target.value)}
                    placeholder="Any notes about this reading"
                    rows={3}
                    className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors resize-none"
                  />
                </Field>
                <Btn onClick={submitReading} loading={trackingLoading} disabled={!newReading} icon={<Target size={14} />} className="w-full mt-2">
                  Add Reading
                </Btn>
              </>
            )}
          </Card>

          {selectedPlan ? (
            <div className="flex flex-col gap-5">
              {readingsLoading ? (
                <Card className="flex items-center justify-center min-h-[200px]">
                  <div className="w-8 h-8 rounded-full border-2 border-[#1E293B] border-t-[#00E5FF] animate-spin" />
                </Card>
              ) : planReadings.length > 0 ? (
                <>
                  <Card>
                    <SectionHeader title="Progress Chart" />
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={planReadings.map(r => ({
                        date: new Date(r.reading_date).toLocaleDateString(),
                        reading: r.current_reading,
                        cumulative: r.cumulative_units || 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="date" stroke="#64748B" />
                        <YAxis stroke="#64748B" />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="reading" stroke="#00E5FF" strokeWidth={2} name="Reading (kWh)" />
                        <Line type="monotone" dataKey="cumulative" stroke="#FFD60A" strokeWidth={2} name="Cumulative (kWh)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card>
                    <SectionHeader title="Recent Readings" />
                    <div className="flex flex-col gap-3">
                      {planReadings.slice(-5).reverse().map((r, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-[#0A0D14] rounded-xl">
                          <div>
                            <div className="font-bold text-white">{r.current_reading} kWh</div>
                            <div className="text-[#64748B] text-xs">{new Date(r.reading_date).toLocaleDateString()}</div>
                          </div>
                          {r.notes && <div className="text-[#94A3B8] text-sm max-w-[200px] truncate">{r.notes}</div>}
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-[#64748B] flex flex-col items-center">
                    <Target size={48} className="opacity-30 mb-4" />
                    <p className="text-sm">No readings yet. Add your first reading to start tracking.</p>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-[#64748B] flex flex-col items-center">
                <Target size={48} className="opacity-30 mb-4" />
                <p className="text-sm">Select a plan to view tracking data</p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
