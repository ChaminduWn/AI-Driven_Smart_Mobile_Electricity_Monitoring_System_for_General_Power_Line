import React, { useState, useEffect } from 'react';
import { Plus, Target, Trash2, Edit2, CheckCircle, PlusCircle, Star, Clock, Zap } from 'lucide-react';
import { plansAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Card, SectionHeader, Btn, Badge, Modal, Field,
  EmptyState, PageLoader, ErrorBanner, ProgressBar, TabBar
} from '../components/UI';

const statusColor = (s) => {
  if (!s) return 'accent';
  const l = s.toLowerCase();
  if (l.includes('on_track') || l.includes('good')) return 'green';
  if (l.includes('warning') || l.includes('at_risk')) return 'yellow';
  if (l.includes('over') || l.includes('exceeded')) return 'red';
  return 'accent';
};

function PlanCard({ plan, onEnd, onDelete, onPriority, onTrack }) {
  const [showReadings, setShowReadings] = useState(false);
  const [readings, setReadings] = useState([]);
  const [readingsLoading, setReadingsLoading] = useState(false);

  const budget = plan.target_budget || plan.budget || 0;
  const spent = plan.current_cost || plan.spent_so_far || 0;
  const pct = budget ? Math.min(100, (spent / budget) * 100) : 0;
  const remaining = budget - spent;
  const isActive = plan.is_active !== false && plan.status !== 'ended';
  const sc = statusColor(plan.status);

  const loadReadings = async () => {
    setReadingsLoading(true);
    try {
      const r = await analysisAPI.getPlanReadings(plan.id || plan._id);
      setReadings(r.data?.readings || r.data || []);
    } catch { /* ignore */ }
    setReadingsLoading(false);
  };

  const toggleReadings = () => {
    if (!showReadings) loadReadings();
    setShowReadings(!showReadings);
  };

  const progressColor = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--yellow)' : 'var(--green)';

  return (
    <Card className="mb-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5 border-b border-[#1E293B] pb-5">
        <div className="flex items-start gap-3">
          {plan.is_priority && (
            <Star size={18} className="text-yellow-400 mt-1 shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-[#00E5FF]">
                Rs. {budget.toLocaleString()}
              </span>
              <Badge color={isActive ? sc : 'red'} className="!text-[10px] !px-2.5 !py-0.5 uppercase tracking-widest font-bold">
                {isActive ? (plan.status || 'Active').replace(/_/g, ' ') : 'Ended'}
              </Badge>
            </div>
            <div className="text-[#64748B] text-xs font-medium">
              {plan.planning_days || 30} days · Started {plan.plan_start_date ? new Date(plan.plan_start_date).toLocaleDateString() : '—'}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isActive && (
            <>
              <button onClick={() => onPriority(plan)} title="Set Priority" className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/50 flex items-center justify-center transition-colors">
                <Star size={16} />
              </button>
              <button onClick={() => onTrack(plan)} title="Track Progress" className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 flex items-center justify-center transition-colors">
                <PlusCircle size={16} />
              </button>
              <button onClick={() => onEnd(plan)} title="End Plan" className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/20 hover:border-[#00E5FF]/50 flex items-center justify-center transition-colors">
                <CheckCircle size={16} />
              </button>
            </>
          )}
          <button onClick={() => onDelete(plan)} className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 flex items-center justify-center transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Budget', value: `Rs. ${budget.toLocaleString()}`, color: 'text-white' },
          { label: 'Spent', value: `Rs. ${spent.toLocaleString()}`, color: pct >= 90 ? 'text-red-400' : 'text-white' },
          { label: 'Remaining', value: `Rs. ${remaining.toLocaleString()}`, color: remaining < 0 ? 'text-red-400' : 'text-green-400' },
          { label: 'Units Used', value: `${plan.units_consumed_so_far || 0} kWh`, color: 'text-[#00E5FF]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0A0D14] rounded-xl p-3 border border-[#1E293B]">
            <div className="text-[9px] text-[#64748B] uppercase tracking-wider font-bold mb-1">{label}</div>
            <div className={`font-mono text-sm font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Budget Used</span>
          <span className="font-mono text-sm font-bold" style={{ color: progressColor }}>{pct.toFixed(1)}%</span>
        </div>
        <ProgressBar pct={pct} color={progressColor} height="h-2.5" />
      </div>

      {/* Readings toggle */}
      <button 
        onClick={toggleReadings} 
        className="flex items-center gap-2 text-[#94A3B8] text-xs font-bold hover:text-white transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-[#1E293B]/50"
      >
        <Clock size={14} /> {showReadings ? 'Hide' : 'Show'} meter readings ({plan.reading_count || 0})
      </button>

      {showReadings && (
        <div className="mt-4 pt-4 border-t border-[#1E293B]">
          {readingsLoading ? (
            <div className="text-[#64748B] text-sm text-center py-4">Loading readings...</div>
          ) : readings.length === 0 ? (
            <div className="text-[#64748B] text-sm text-center py-4">No readings yet. Add meter readings to track progress.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {readings.map(r => (
                <div key={r.id || r._id} className="flex justify-between items-center p-3 bg-[#0A0D14] border border-[#1E293B] rounded-xl">
                  <span className="text-[#94A3B8] text-sm font-medium">{r.reading_date ? new Date(r.reading_date).toLocaleDateString() : '—'}</span>
                  <span className="font-mono text-[#00E5FF] font-bold">{r.reading_value || r.current_reading} kWh</span>
                  <Badge color={r.status === 'on_track' ? 'green' : 'yellow'} className="!text-[9px] uppercase tracking-wider font-bold">
                    {(r.status || '').replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function PlansPage() {
  const { selectedAccount } = useAuth();
  const [plans, setPlans] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('active');

  // Create plan modal
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ bill_id: '', target_budget: '', planning_days: '30', plan_start_date: '' });
  const [creating, setCreating] = useState(false);

  // Track modal
  const [trackModal, setTrackModal] = useState(null);
  const [trackForm, setTrackForm] = useState({ current_reading: '', reading_date: new Date().toISOString().split('T')[0], notes: '' });
  const [tracking, setTracking] = useState(false);

  const load = async () => {
    if (!selectedAccount) return;
    setLoading(true); setError('');
    try {
      const [pRes, bRes] = await Promise.allSettled([
        analysisAPI.getPlansByAccount(selectedAccount, false),
        billsAPI.getByAccount(selectedAccount),
      ]);
      if (pRes.status === 'fulfilled') {
        const raw = pRes.value.data?.plans || pRes.value.data || [];
        setPlans(Array.isArray(raw) ? raw : []);
      }
      if (bRes.status === 'fulfilled') {
        const raw = bRes.value.data?.bills || bRes.value.data || [];
        setBills(Array.isArray(raw) ? raw : []);
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load plans.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [selectedAccount]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await analysisAPI.createBudgetPlan(
        createForm.bill_id,
        parseFloat(createForm.target_budget),
        parseInt(createForm.planning_days) || 30,
        createForm.plan_start_date || null,
      );
      setCreateModal(false);
      setCreateForm({ bill_id: '', target_budget: '', planning_days: '30', plan_start_date: '' });
      await load();
    } catch (e) { alert(e.response?.data?.detail || 'Failed to create plan.'); }
    setCreating(false);
  };

  const handleEnd = async (p) => {
    if (!confirm('End this budget plan?')) return;
    try { await analysisAPI.endPlan(p.id || p._id); await load(); }
    catch (e) { alert(e.response?.data?.detail || 'Failed.'); }
  };

  const handleDelete = async (p) => {
    if (!confirm('Delete this plan?')) return;
    try { await analysisAPI.deletePlan(p.id || p._id); await load(); }
    catch (e) { alert(e.response?.data?.detail || 'Failed.'); }
  };

  const handlePriority = async (p) => {
    try { await analysisAPI.setPlanPriority(p.id || p._id); await load(); }
    catch (e) { alert(e.response?.data?.detail || 'Failed.'); }
  };

  const handleTrack = async () => {
    if (!trackModal) return;
    setTracking(true);
    try {
      await analysisAPI.trackProgress(
        trackModal.id || trackModal._id,
        parseFloat(trackForm.current_reading),
        trackForm.reading_date,
        trackForm.notes || null,
      );
      setTrackModal(null);
      setTrackForm({ current_reading: '', reading_date: new Date().toISOString().split('T')[0], notes: '' });
      await load();
    } catch (e) { alert(e.response?.data?.detail || 'Failed.'); }
    setTracking(false);
  };

  const activePlans = plans.filter(p => p.is_active !== false && p.status !== 'ended');
  const endedPlans = plans.filter(p => p.is_active === false || p.status === 'ended');
  const shown = tab === 'active' ? activePlans : endedPlans;

  if (loading) return <PageLoader />;

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 sm:p-5">
          <div className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-2">Active Plans</div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-green-400">{activePlans.length}</div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-2">Total Budget</div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#00E5FF] truncate">
            Rs. {activePlans.reduce((s, p) => s + (p.target_budget || p.budget || 0), 0).toLocaleString()}
          </div>
        </Card>
        <Card className="p-4 sm:p-5 border-yellow-500/30 bg-yellow-500/5">
          <div className="text-[10px] font-bold tracking-widest text-yellow-500/70 uppercase mb-2">Priority Plan</div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-yellow-400 truncate">
            {activePlans.find(p => p.is_priority) ? `Rs. ${(activePlans.find(p => p.is_priority).target_budget || 0).toLocaleString()}` : 'None set'}
          </div>
        </Card>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="overflow-x-auto pb-1 sm:pb-0">
          <TabBar
            tabs={[
              { id: 'active', label: `Active (${activePlans.length})` },
              { id: 'ended', label: `Ended (${endedPlans.length})` },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>
        <Btn icon={<Plus size={14} />} onClick={() => setCreateModal(true)} className="shrink-0">New Plan</Btn>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={tab === 'active' ? 'No active plans' : 'No ended plans'}
          subtitle={tab === 'active' ? 'Create a budget plan to start managing your electricity spend.' : 'Ended plans will appear here.'}
          action={tab === 'active' ? <Btn icon={<Plus size={14} />} onClick={() => setCreateModal(true)}>Create First Plan</Btn> : null}
        />
      ) : (
        shown.map(p => (
          <PlanCard
            key={p.id || p._id}
            plan={p}
            onEnd={handleEnd}
            onDelete={handleDelete}
            onPriority={handlePriority}
            onTrack={setTrackModal}
          />
        ))
      )}

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Budget Plan">
        <div className="flex flex-col gap-4">
          <Field label="Based on Bill" hint="The plan's initial meter reading comes from this bill">
            <select value={createForm.bill_id} onChange={e => setCreateForm(f => ({ ...f, bill_id: e.target.value }))}>
              <option value="">-- Select a bill --</option>
              {bills.map(b => <option key={b.id || b._id} value={b.id || b._id}>{b.billing_month || b.period} — Rs. {(b.amount || 0).toLocaleString()}</option>)}
            </select>
          </Field>
          <Field label="Target Budget (Rs.)" hint="Maximum amount you want to spend">
            <input type="number" value={createForm.target_budget} onChange={e => setCreateForm(f => ({ ...f, target_budget: e.target.value }))} placeholder="e.g. 5000" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Planning Days">
              <input type="number" value={createForm.planning_days} onChange={e => setCreateForm(f => ({ ...f, planning_days: e.target.value }))} placeholder="30" />
            </Field>
            <Field label="Start Date">
              <input type="date" value={createForm.plan_start_date} onChange={e => setCreateForm(f => ({ ...f, plan_start_date: e.target.value }))} />
            </Field>
          </div>
          <div className="flex gap-3 mt-2 justify-end">
            <Btn variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Btn>
            <Btn loading={creating} onClick={handleCreate} disabled={!createForm.bill_id || !createForm.target_budget}>Create Plan</Btn>
          </div>
        </div>
      </Modal>

      {/* Track modal */}
      <Modal open={!!trackModal} onClose={() => setTrackModal(null)} title="Add Meter Reading">
        <div className="flex flex-col gap-4">
          {trackModal && (
            <div className="bg-[#00E5FF]/10 border border-[#00E5FF]/30 p-4 rounded-xl flex items-center justify-between">
              <span className="text-[#00E5FF] text-sm font-bold">Plan budget: </span>
              <span className="font-mono text-lg text-[#00E5FF] font-bold">
                Rs. {(trackModal.target_budget || trackModal.budget || 0).toLocaleString()}
              </span>
            </div>
          )}
          <Field label="Current Meter Reading (kWh)" hint="Enter the meter reading from your meter">
            <input type="number" step="0.1" value={trackForm.current_reading} onChange={e => setTrackForm(f => ({ ...f, current_reading: e.target.value }))} placeholder="e.g. 12450" />
          </Field>
          <Field label="Reading Date">
            <input type="date" value={trackForm.reading_date} onChange={e => setTrackForm(f => ({ ...f, reading_date: e.target.value }))} />
          </Field>
          <Field label="Notes (optional)">
            <input value={trackForm.notes} onChange={e => setTrackForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this reading..." />
          </Field>
          <div className="flex gap-3 mt-2 justify-end">
            <Btn variant="ghost" onClick={() => setTrackModal(null)}>Cancel</Btn>
            <Btn loading={tracking} onClick={handleTrack} disabled={!trackForm.current_reading}>Save Reading</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
