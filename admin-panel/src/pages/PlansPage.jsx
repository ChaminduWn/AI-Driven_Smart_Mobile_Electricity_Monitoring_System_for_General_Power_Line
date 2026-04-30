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
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', align: 'flex-start', gap: 12 }}>
          {plan.is_priority && (
            <Star size={14} style={{ color: 'var(--yellow)', marginTop: 3 }} />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                Rs. {budget.toLocaleString()}
              </span>
              <Badge color={isActive ? sc : 'red'}>
                {isActive ? (plan.status || 'Active').replace(/_/g, ' ') : 'Ended'}
              </Badge>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              {plan.planning_days || 30} days · Started {plan.plan_start_date ? new Date(plan.plan_start_date).toLocaleDateString() : '—'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {isActive && (
            <>
              <button onClick={() => onPriority(plan)} title="Set Priority" style={{ background: 'var(--yellow-dim)', border: '1px solid rgba(255,215,0,0.2)', color: 'var(--yellow)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Star size={12} />
              </button>
              <button onClick={() => onTrack(plan)} title="Track Progress" style={{ background: 'var(--green-dim)', border: '1px solid rgba(34,212,138,0.2)', color: 'var(--green)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <PlusCircle size={12} />
              </button>
              <button onClick={() => onEnd(plan)} title="End Plan" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)', color: 'var(--accent)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <CheckCircle size={12} />
              </button>
            </>
          )}
          <button onClick={() => onDelete(plan)} style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,77,109,0.2)', color: 'var(--red)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Budget', value: `Rs. ${budget.toLocaleString()}`, color: 'var(--text-primary)' },
          { label: 'Spent', value: `Rs. ${spent.toLocaleString()}`, color: pct >= 90 ? 'var(--red)' : 'var(--text-primary)' },
          { label: 'Remaining', value: `Rs. ${remaining.toLocaleString()}`, color: remaining < 0 ? 'var(--red)' : 'var(--green)' },
          { label: 'Units Used', value: `${plan.units_consumed_so_far || 0} kWh`, color: 'var(--accent)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color, marginTop: 3 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Budget Used</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: progressColor }}>{pct.toFixed(1)}%</span>
        </div>
        <ProgressBar pct={pct} color={progressColor} height={8} />
      </div>

      {/* Readings toggle */}
      <button onClick={toggleReadings} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Clock size={12} /> {showReadings ? 'Hide' : 'Show'} meter readings ({plan.reading_count || 0})
      </button>

      {showReadings && (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
          {readingsLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading...</div>
          ) : readings.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No readings yet. Add meter readings to track progress.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {readings.map(r => (
                <div key={r.id || r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-base)', borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{r.reading_date ? new Date(r.reading_date).toLocaleDateString() : '—'}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{r.reading_value || r.current_reading} kWh</span>
                  <span style={{ color: r.status === 'on_track' ? 'var(--green)' : 'var(--yellow)', fontSize: 11 }}>
                    {(r.status || '').replace(/_/g, ' ')}
                  </span>
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
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Active Plans</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: 'var(--green)' }}>{activePlans.length}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Total Budget</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>
            Rs. {activePlans.reduce((s, p) => s + (p.target_budget || p.budget || 0), 0).toLocaleString()}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Priority Plan</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--yellow)' }}>
            {activePlans.find(p => p.is_priority) ? `Rs. ${(activePlans.find(p => p.is_priority).target_budget || 0).toLocaleString()}` : 'None set'}
          </div>
        </Card>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <TabBar
          tabs={[
            { id: 'active', label: `Active (${activePlans.length})` },
            { id: 'ended', label: `Ended (${endedPlans.length})` },
          ]}
          active={tab}
          onChange={setTab}
        />
        <Btn icon={<Plus size={14} />} onClick={() => setCreateModal(true)}>New Plan</Btn>
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
        <Field label="Based on Bill" hint="The plan's initial meter reading comes from this bill">
          <select value={createForm.bill_id} onChange={e => setCreateForm(f => ({ ...f, bill_id: e.target.value }))}>
            <option value="">-- Select a bill --</option>
            {bills.map(b => <option key={b.id || b._id} value={b.id || b._id}>{b.billing_month || b.period} — Rs. {(b.amount || 0).toLocaleString()}</option>)}
          </select>
        </Field>
        <Field label="Target Budget (Rs.)" hint="Maximum amount you want to spend">
          <input type="number" value={createForm.target_budget} onChange={e => setCreateForm(f => ({ ...f, target_budget: e.target.value }))} placeholder="e.g. 5000" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Planning Days">
            <input type="number" value={createForm.planning_days} onChange={e => setCreateForm(f => ({ ...f, planning_days: e.target.value }))} placeholder="30" />
          </Field>
          <Field label="Start Date">
            <input type="date" value={createForm.plan_start_date} onChange={e => setCreateForm(f => ({ ...f, plan_start_date: e.target.value }))} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Btn>
          <Btn loading={creating} onClick={handleCreate} disabled={!createForm.bill_id || !createForm.target_budget}>Create Plan</Btn>
        </div>
      </Modal>

      {/* Track modal */}
      <Modal open={!!trackModal} onClose={() => setTrackModal(null)} title="Add Meter Reading">
        {trackModal && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Plan budget: </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>
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
        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setTrackModal(null)}>Cancel</Btn>
          <Btn loading={tracking} onClick={handleTrack} disabled={!trackForm.current_reading}>Save Reading</Btn>
        </div>
      </Modal>
    </div>
  );
}
