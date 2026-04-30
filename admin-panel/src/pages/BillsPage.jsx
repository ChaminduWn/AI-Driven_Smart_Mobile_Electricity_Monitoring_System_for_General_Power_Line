import React, { useState, useEffect } from 'react';
import { Plus, FileText, Trash2, Eye, Calendar, Zap, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { billsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Card, SectionHeader, Btn, Badge, Modal, Field,
  EmptyState, PageLoader, ErrorBanner, StatCard, ProgressBar
} from '../components/UI';

const defaultForm = {
  billing_month: '', units_consumed: '', amount: '',
  meter_reading_start: '', meter_reading_end: '', due_date: '',
};

function BillCard({ bill, onView, onDelete }) {
  const [open, setOpen] = useState(false);
  const amount = bill.amount || bill.total_amount || 0;
  const units = bill.units_consumed || bill.units || 0;
  const month = bill.billing_month || bill.period || 'Unknown Period';
  const isPaid = bill.is_paid || bill.paid || false;

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <div
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
        onClick={() => setOpen(!open)}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{month}</span>
            <Badge color={isPaid ? 'green' : 'yellow'}>{isPaid ? 'Paid' : 'Unpaid'}</Badge>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
            {units} kWh · Due: {bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'N/A'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
            Rs. {amount.toLocaleString()}
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 16px', background: 'var(--bg-base)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
            {[
              { label: 'Meter Start', value: bill.meter_reading_start ?? '—' },
              { label: 'Meter End', value: bill.meter_reading_end ?? '—' },
              { label: 'Rate (Rs/kWh)', value: units ? (amount / units).toFixed(2) : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
          {bill.notes && <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>{bill.notes}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" variant="secondary" icon={<Eye size={12} />} onClick={() => onView(bill)}>View Analysis</Btn>
            <Btn size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={() => onDelete(bill)}>Delete</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillsPage() {
  const { selectedAccount } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!selectedAccount) return;
    setLoading(true); setError('');
    try {
      const res = await billsAPI.getByAccount(selectedAccount);
      const raw = res.data?.bills || res.data || [];
      setBills(Array.isArray(raw) ? raw : []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load bills.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [selectedAccount]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await billsAPI.create({
        ...form,
        account_number: selectedAccount,
        units_consumed: parseFloat(form.units_consumed) || 0,
        amount: parseFloat(form.amount) || 0,
        meter_reading_start: parseFloat(form.meter_reading_start) || null,
        meter_reading_end: parseFloat(form.meter_reading_end) || null,
      });
      setModal(false);
      setForm(defaultForm);
      await load();
    } catch (e) {
      alert(e.response?.data?.detail || 'Save failed.');
    }
    setSaving(false);
  };

  const handleDelete = async (b) => {
    if (!confirm('Delete this bill?')) return;
    try {
      await billsAPI.delete(b.id || b._id);
      await load();
    } catch (e) { alert(e.response?.data?.detail || 'Delete failed.'); }
  };

  const totalUnits = bills.reduce((s, b) => s + (b.units_consumed || b.units || 0), 0);
  const totalAmount = bills.reduce((s, b) => s + (b.amount || b.total_amount || 0), 0);
  const avgMonthly = bills.length ? (totalAmount / bills.length).toFixed(0) : 0;

  if (loading) return <PageLoader />;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Bills" value={bills.length} sub="All time records" icon={FileText} color="accent" />
        <StatCard label="Total Units" value={`${totalUnits.toLocaleString()} kWh`} sub="All recorded consumption" icon={Zap} color="yellow" />
        <StatCard label="Avg Monthly" value={`Rs. ${Number(avgMonthly).toLocaleString()}`} sub="Average bill amount" icon={DollarSign} color="green" glow />
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <SectionHeader title="Electricity Bills" subtitle={`${bills.length} bill${bills.length !== 1 ? 's' : ''} on record`} />
          <Btn icon={<Plus size={14} />} onClick={() => setModal(true)}>Add Bill</Btn>
        </div>

        {bills.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No bills recorded"
            subtitle="Start by adding your first electricity bill to track usage and costs."
            action={<Btn icon={<Plus size={14} />} onClick={() => setModal(true)}>Add First Bill</Btn>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bills.map(b => (
              <BillCard
                key={b.id || b._id}
                bill={b}
                onView={() => {/* navigate to analysis with this bill */}}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Add New Bill" width={520}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Billing Month" style={{ gridColumn: '1/-1' }}>
            <input type="month" value={form.billing_month} onChange={set('billing_month')} />
          </Field>
          <Field label="Units Consumed (kWh)" hint="Total kWh for this period">
            <input type="number" step="0.1" value={form.units_consumed} onChange={set('units_consumed')} placeholder="e.g. 250" />
          </Field>
          <Field label="Amount (Rs.)">
            <input type="number" step="0.01" value={form.amount} onChange={set('amount')} placeholder="e.g. 4500" />
          </Field>
          <Field label="Meter Reading Start">
            <input type="number" value={form.meter_reading_start} onChange={set('meter_reading_start')} placeholder="e.g. 12300" />
          </Field>
          <Field label="Meter Reading End">
            <input type="number" value={form.meter_reading_end} onChange={set('meter_reading_end')} placeholder="e.g. 12550" />
          </Field>
          <Field label="Due Date" style={{ gridColumn: '1/-1' }}>
            <input type="date" value={form.due_date} onChange={set('due_date')} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn loading={saving} onClick={handleSave}>Save Bill</Btn>
        </div>
      </Modal>
    </div>
  );
}
