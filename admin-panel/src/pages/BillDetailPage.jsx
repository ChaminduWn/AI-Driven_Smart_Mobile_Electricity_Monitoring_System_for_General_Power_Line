import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Zap, DollarSign, Calendar, Info } from 'lucide-react';
import { billsAPI, analysisAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, SectionHeader, Btn, Badge, PageLoader, ErrorBanner } from '../components/UI';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

export default function BillDetailPage() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { selectedAccount } = useAuth();
  const [bill, setBill] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!selectedAccount || !billId) return;
      setLoading(true);
      setError('');
      try {
        const res = await billsAPI.getById(billId);
        const data = res.data?.data || res.data || null;
        setBill(data);
      } catch (e) {
        setError(e.response?.data?.detail || 'Failed to load bill details.');
      }
      setLoading(false);
    };
    load();
  }, [selectedAccount, billId]);

  useEffect(() => {
    const loadAnalysis = async () => {
      if (!billId) return;
      setAnalysisLoading(true);
      try {
        const res = await analysisAPI.analyzePastMonth(billId);
        setAnalysis(res.data?.data || res.data || null);
      } catch (e) {
        // analysis is optional, do not block bill loading
      }
      setAnalysisLoading(false);
    };
    loadAnalysis();
  }, [billId]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message={error} onRetry={() => window.location.reload()} />;
  if (!bill) return <ErrorBanner message="Bill not found." onRetry={() => navigate('/d/bills')} />;

  const units = bill.units_consumed || bill.units || 0;
  const amount = bill.amount || bill.total_amount || 0;
  const averageRate = units ? (amount / units).toFixed(2) : '—';
  const period = bill.billing_month || bill.period || 'Unknown period';
  const dueDate = bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'N/A';
  const status = bill.is_paid || bill.paid ? 'Paid' : 'Unpaid';

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Btn variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>Back</Btn>
          <div>
            <p className="text-sm text-[#94A3B8]">Bill Detail</p>
            <h1 className="text-2xl font-semibold text-white">{period}</h1>
          </div>
        </div>
        <Badge color={status === 'Paid' ? 'green' : 'yellow'} className="!text-sm !px-3 !py-2">
          {status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <Card>
          <SectionHeader title="Bill Summary" subtitle="Quick overview of this electricity bill" />
          <div className="grid gap-3 mt-4">
            {[
              { label: 'Billing Month', value: period, icon: FileText },
              { label: 'Total Units', value: `${units} kWh`, icon: Zap },
              { label: 'Total Amount', value: formatCurrency(amount), icon: DollarSign },
              { label: 'Average Rate', value: `${averageRate} Rs/kWh`, icon: Info },
              { label: 'Due Date', value: dueDate, icon: Calendar },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-[#0A0D14] rounded-2xl p-4 border border-[#1E293B]">
                <div className="flex items-center gap-3 mb-2 text-[#94A3B8] text-xs uppercase tracking-[0.2em] font-semibold">
                  <Icon size={14} />
                  {label}
                </div>
                <div className="text-white font-semibold">{value}</div>
              </div>
            ))}
          </div>

          {(bill.meter_reading_start || bill.meter_reading_end) && (
            <div className="mt-5">
              <SectionHeader title="Meter Readings" subtitle="Recorded meter values" />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-[#0A0D14] rounded-2xl p-4 border border-[#1E293B]">
                  <div className="text-[#94A3B8] text-xs uppercase tracking-[0.12em] mb-2">Start</div>
                  <div className="font-semibold text-white">{bill.meter_reading_start ?? '—'}</div>
                </div>
                <div className="bg-[#0A0D14] rounded-2xl p-4 border border-[#1E293B]">
                  <div className="text-[#94A3B8] text-xs uppercase tracking-[0.12em] mb-2">End</div>
                  <div className="font-semibold text-white">{bill.meter_reading_end ?? '—'}</div>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <SectionHeader title="Analysis Result" subtitle="Calculated insights for this bill" />
            {analysisLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-[#1E293B] border-t-[#00E5FF] animate-spin" />
              </div>
            ) : analysis ? (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Daily Avg', value: `${analysis.daily_avg_units || analysis.daily_avg || 0} kWh` },
                    { label: 'Daily Cost', value: formatCurrency(analysis.daily_avg_cost || analysis.daily_avg_cost || 0) },
                    { label: 'Peak Usage', value: `${analysis.peak_usage || analysis.max_usage || '—'} kWh` },
                    { label: 'Projected Total', value: formatCurrency(analysis.projected_total_cost || analysis.projected_cost || amount) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#0A0D14] rounded-2xl p-4 border border-[#1E293B]">
                      <div className="text-[#94A3B8] text-[11px] uppercase tracking-[0.18em] font-semibold mb-2">{label}</div>
                      <div className="text-white font-semibold">{value}</div>
                    </div>
                  ))}
                </div>

                {analysis.slab_breakdown && analysis.slab_breakdown.length > 0 && (
                  <div className="bg-[#0A0D14] rounded-2xl p-4 border border-[#1E293B]">
                    <div className="text-[#94A3B8] text-xs uppercase tracking-[0.18em] font-semibold mb-3">Slab Breakdown</div>
                    <div className="space-y-2">
                      {analysis.slab_breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center gap-3 text-sm">
                          <span>{item.slab || item.range || `Slab ${index + 1}`}</span>
                          <span className="font-semibold text-white">{item.units ?? item.unit ?? 0} kWh</span>
                          <span className="text-[#94A3B8]">Rs. {(item.amount || item.cost || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="bg-[#0A0D14] rounded-2xl p-4 border border-[#1E293B]">
                    <div className="flex items-center gap-2 text-[#94A3B8] uppercase tracking-[0.18em] font-semibold mb-3">
                      <Info size={14} /> Recommendations
                    </div>
                    <div className="space-y-3">
                      {analysis.recommendations.map((rec, idx) => (
                        <div key={idx} className="rounded-2xl p-3 bg-[#131520] border border-[#1E293B]">
                          <div className="font-semibold text-white">{rec.title || rec.category || `Tip ${idx + 1}`}</div>
                          <p className="text-[#94A3B8] text-sm mt-1">{rec.description || rec.tip || rec.message || 'No details available.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-[#94A3B8] py-16">
                <p className="mb-3">No analysis data is available for this bill yet.</p>
                <Btn onClick={() => navigate('/d/analysis')} icon={<ArrowLeft size={14} />}>
                  Go to Analysis Page
                </Btn>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
