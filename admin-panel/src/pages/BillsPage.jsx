import React, { useState, useEffect } from 'react';
import { Plus, FileText, Trash2, Eye, Calendar, Zap, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    <div className="bg-[#0A0D14] border border-[#1E293B] rounded-xl overflow-hidden transition-colors hover:border-[#333B53]">
      <div
        className="px-4 py-3.5 cursor-pointer flex items-center gap-3 bg-[#131520] hover:bg-[#1A1E2D] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="w-10 h-10 rounded-lg bg-[#00E5FF]/10 flex items-center justify-center shrink-0">
          <FileText size={18} className="text-[#00E5FF]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-sm truncate">{month}</span>
            <Badge color={isPaid ? 'green' : 'yellow'} className="!text-[9px] !px-2 !py-0.5 shrink-0">{isPaid ? 'Paid' : 'Unpaid'}</Badge>
          </div>
          <div className="text-[#64748B] text-xs">
            {units} kWh · Due: {bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'N/A'}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-lg font-bold text-[#00E5FF]">
            Rs. {amount.toLocaleString()}
          </div>
        </div>
        <div className="text-[#64748B] shrink-0 ml-2">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {open && (
        <div className="border-t border-[#1E293B] p-4 bg-[#0A0D14]">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Meter Start', value: bill.meter_reading_start ?? '—' },
              { label: 'Meter End', value: bill.meter_reading_end ?? '—' },
              { label: 'Rate (Rs/kWh)', value: units ? (amount / units).toFixed(2) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center bg-[#131520] p-2 rounded-lg border border-[#1E293B]/50">
                <div className="text-[9px] text-[#64748B] uppercase tracking-wider font-bold mb-1">{label}</div>
                <div className="font-mono font-bold text-white text-xs truncate">{value}</div>
              </div>
            ))}
          </div>
          {bill.notes && <p className="text-[#94A3B8] text-xs mb-4 p-3 bg-[#131520] rounded-lg border border-[#1E293B]/50">{bill.notes}</p>}
          <div className="flex gap-2 justify-end">
            <Btn size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => onView(bill)}>Analysis</Btn>
            <Btn size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => onDelete(bill)}>Delete</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillsPage() {
  const navigate = useNavigate();
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
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Bills" value={bills.length} sub="All time records" icon={FileText} color="accent" />
        <StatCard label="Total Units" value={`${totalUnits.toLocaleString()} kWh`} sub="All recorded consumption" icon={Zap} color="yellow" />
        <StatCard label="Avg Monthly" value={`Rs. ${Number(avgMonthly).toLocaleString()}`} sub="Average bill amount" icon={DollarSign} color="green" glow />
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-[#1E293B] pb-5">
          <SectionHeader title="Electricity Bills" subtitle={`${bills.length} bill${bills.length !== 1 ? 's' : ''} on record`} className="!mb-0" />
          <Btn icon={<Plus size={14} />} onClick={() => setModal(true)} className="shrink-0">Add Bill</Btn>
        </div>

        {bills.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No bills recorded"
            subtitle="Start by adding your first electricity bill to track usage and costs."
            action={<Btn icon={<Plus size={14} />} onClick={() => setModal(true)}>Add First Bill</Btn>}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {bills.map(b => (
              <BillCard
                key={b.id || b._id}
                bill={b}
                onView={() => navigate(`/d/bills/${b.id || b._id}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Add New Bill" width={520}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Billing Month" className="sm:col-span-2">
            <input type="month" value={form.billing_month} onChange={set('billing_month')} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" />
          </Field>
          <Field label="Units Consumed (kWh)" hint="Total kWh for this period">
            <input type="number" step="0.1" value={form.units_consumed} onChange={set('units_consumed')} placeholder="e.g. 250" className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" />
          </Field>
          <Field label="Amount (Rs.)">
            <input type="number" step="0.01" value={form.amount} onChange={set('amount')} placeholder="e.g. 4500" className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" />
          </Field>
          <Field label="Meter Reading Start">
            <input type="number" value={form.meter_reading_start} onChange={set('meter_reading_start')} placeholder="e.g. 12300" className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" />
          </Field>
          <Field label="Meter Reading End">
            <input type="number" value={form.meter_reading_end} onChange={set('meter_reading_end')} placeholder="e.g. 12550" className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" />
          </Field>
          <Field label="Due Date" className="sm:col-span-2">
            <input type="date" value={form.due_date} onChange={set('due_date')} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" />
          </Field>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn loading={saving} onClick={handleSave}>Save Bill</Btn>
        </div>
      </Modal>
    </div>
  );
}
