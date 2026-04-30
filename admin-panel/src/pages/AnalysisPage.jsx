import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, GitCompare, Lightbulb, RefreshCw, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { analysisAPI, billsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, SectionHeader, Btn, Badge, TabBar, Field, PageLoader, ErrorBanner, StatCard } from '../components/UI';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>)}
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

  useEffect(() => {
    if (!selectedAccount) return;
    billsAPI.getByAccount(selectedAccount)
      .then(r => { const raw = r.data?.bills || r.data || []; setBills(Array.isArray(raw) ? raw : []); })
      .catch(() => {})
      .finally(() => setBillsLoading(false));
  }, [selectedAccount]);

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

  const tabs = [
    { id: 'tariff',   label: 'Tariff Calc',    icon: Calculator },
    { id: 'analysis', label: 'Bill Analysis',  icon: TrendingUp },
    { id: 'compare',  label: 'Compare Bills',  icon: GitCompare },
    { id: 'recs',     label: 'Recommendations',icon: Lightbulb },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 20 }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {/* ── TARIFF CALCULATOR ─────────────────────────────────────────────── */}
      {tab === 'tariff' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
          <Card>
            <SectionHeader title="Tariff Calculator" subtitle="Estimate your electricity cost" />
            <Field label="Units (kWh)">
              <input type="number" value={tariffUnits} onChange={e => setTariffUnits(e.target.value)} placeholder="e.g. 180" />
            </Field>
            <Field label="Days">
              <input type="number" value={tariffDays} onChange={e => setTariffDays(e.target.value)} placeholder="30" />
            </Field>
            <Btn onClick={calcTariff} loading={tariffLoading} icon={<Calculator size={14} />} style={{ width: '100%', justifyContent: 'center' }}>
              Calculate
            </Btn>
          </Card>

          {tariffResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Total Cost', value: `Rs. ${(tariffResult.total_amount || tariffResult.total || 0).toLocaleString()}`, color: 'accent' },
                  { label: 'Units', value: `${tariffUnits} kWh`, color: 'yellow' },
                  { label: 'Rate', value: `Rs. ${tariffResult.rate_per_unit || tariffResult.avg_rate || '—'}/kWh`, color: 'green' },
                ].map(({ label, value, color }) => (
                  <Card key={label}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: `var(--${color})` }}>{value}</div>
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
            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Calculator size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p>Enter units to see cost breakdown</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── BILL ANALYSIS ────────────────────────────────────────────────── */}
      {tab === 'analysis' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          <Card>
            <SectionHeader title="Past Month Analysis" subtitle="Deep dive into a specific bill" />
            <Field label="Select Bill">
              <select value={selectedBill} onChange={e => setSelectedBill(e.target.value)}>
                <option value="">-- Choose a bill --</option>
                {bills.map(b => (
                  <option key={b.id || b._id} value={b.id || b._id}>
                    {b.billing_month || b.period || 'Bill'} — Rs. {(b.amount || b.total_amount || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </Field>
            <Btn onClick={runAnalysis} loading={analysisLoading} disabled={!selectedBill} icon={<TrendingUp size={14} />} style={{ width: '100%', justifyContent: 'center' }}>
              Analyze
            </Btn>
          </Card>

          {analysisLoading ? (
            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
            </Card>
          ) : analysisResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Period', value: analysisResult.billing_month || analysisResult.period || '—', color: 'accent' },
                  { label: 'Units', value: `${analysisResult.units_consumed || 0} kWh`, color: 'yellow' },
                  { label: 'Total Cost', value: `Rs. ${(analysisResult.total_amount || 0).toLocaleString()}`, color: 'green' },
                  { label: 'Daily Avg', value: `${analysisResult.daily_avg_units || (analysisResult.units_consumed / 30).toFixed(1) || 0} kWh`, color: 'purple' },
                ].map(({ label, value, color }) => (
                  <Card key={label}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: `var(--${color})` }}>{value}</div>
                  </Card>
                ))}
              </div>
              {analysisResult.slab_breakdown && (
                <Card>
                  <SectionHeader title="Slab Breakdown" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(analysisResult.slab_breakdown || []).map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12, width: 80 }}>{s.slab || s.range}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)' }}>{s.units} kWh</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--green)', marginLeft: 'auto' }}>Rs. {(s.amount || s.cost || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <TrendingUp size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p>Select a bill to analyze</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── COMPARE PERIODS ─────────────────────────────────────────────── */}
      {tab === 'compare' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          <Card>
            <SectionHeader title="Compare Periods" subtitle="Side-by-side bill comparison" />
            <Field label="Bill 1 (Earlier)">
              <select value={bill1} onChange={e => setBill1(e.target.value)}>
                <option value="">-- Select bill 1 --</option>
                {bills.map(b => <option key={b.id || b._id} value={b.id || b._id}>{b.billing_month || b.period} — Rs. {(b.amount || 0).toLocaleString()}</option>)}
              </select>
            </Field>
            <Field label="Bill 2 (Later)">
              <select value={bill2} onChange={e => setBill2(e.target.value)}>
                <option value="">-- Select bill 2 --</option>
                {bills.map(b => <option key={b.id || b._id} value={b.id || b._id}>{b.billing_month || b.period} — Rs. {(b.amount || 0).toLocaleString()}</option>)}
              </select>
            </Field>
            <Btn onClick={runCompare} loading={compareLoading} disabled={!bill1 || !bill2} icon={<GitCompare size={14} />} style={{ width: '100%', justifyContent: 'center' }}>
              Compare
            </Btn>
          </Card>

          {compareResult ? (
            <Card>
              <SectionHeader title="Comparison Results" />
              {compareResult.comparison && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {['period_1', 'period_2'].map((key, idx) => {
                    const p = compareResult.comparison?.[key] || compareResult[key] || {};
                    return (
                      <div key={key} style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: 16 }}>
                        <div style={{ fontWeight: 700, color: idx === 0 ? 'var(--accent)' : 'var(--yellow)', marginBottom: 12 }}>
                          Period {idx + 1}: {p.billing_month || p.period || '—'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {[
                            ['Units', `${p.units_consumed || 0} kWh`],
                            ['Cost', `Rs. ${(p.total_amount || p.amount || 0).toLocaleString()}`],
                            ['Daily Avg', `${p.daily_avg || '—'} kWh`],
                          ].map(([lbl, val]) => (
                            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{lbl}</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {compareResult.difference && (
                <div style={{ marginTop: 16, background: 'var(--bg-surface)', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Difference</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {Object.entries(compareResult.difference).map(([k, v]) => (
                      <div key={k} style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{k.replace(/_/g, ' ')}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: Number(v) > 0 ? 'var(--red)' : 'var(--green)', marginTop: 4 }}>
                          {Number(v) > 0 ? '+' : ''}{v}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <GitCompare size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p>Select two bills to compare</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── RECOMMENDATIONS ─────────────────────────────────────────────── */}
      {tab === 'recs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          <Card>
            <SectionHeader title="Budget Recommendations" subtitle="AI-powered savings suggestions" />
            <Field label="Based on Bill">
              <select value={recBill} onChange={e => setRecBill(e.target.value)}>
                <option value="">-- Select bill --</option>
                {bills.map(b => <option key={b.id || b._id} value={b.id || b._id}>{b.billing_month || b.period}</option>)}
              </select>
            </Field>
            <Btn onClick={loadRecs} loading={recsLoading} disabled={!recBill} icon={<Lightbulb size={14} />} style={{ width: '100%', justifyContent: 'center' }}>
              Get Recommendations
            </Btn>
          </Card>

          {recsResult ? (
            <Card>
              <SectionHeader title="Savings Recommendations" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(recsResult.recommendations || recsResult.tips || []).map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 10, borderLeft: '3px solid var(--accent)' }}>
                    <div style={{ width: 28, height: 28, background: 'var(--yellow-dim)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Lightbulb size={14} style={{ color: 'var(--yellow)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{rec.title || rec.category || `Tip ${i + 1}`}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{rec.description || rec.tip || rec}</div>
                      {rec.potential_savings && (
                        <div style={{ color: 'var(--green)', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                          Potential savings: Rs. {rec.potential_savings}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Lightbulb size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p>Select a bill to get personalized recommendations</p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
