import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Plug, Zap, Clock, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { appliancesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Card, SectionHeader, Btn, Badge, Modal, Field,
  EmptyState, PageLoader, ErrorBanner
} from '../components/UI';

const CATEGORIES = ['All', 'AC', 'Refrigerator', 'Washing Machine', 'TV', 'Fan', 'Light', 'Water Heater', 'Computer', 'Other'];

const defaultForm = { name: '', category: 'Other', wattage: '', daily_usage_hours: '', quantity: 1, is_active: true };

export default function AppliancesPage() {
  const { selectedAccount } = useAuth();
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const load = async () => {
    if (!selectedAccount) return;
    setLoading(true); setError('');
    try {
      const res = await appliancesAPI.getByAccount(selectedAccount, false);
      const raw = res.data?.appliances || res.data || [];
      setAppliances(Array.isArray(raw) ? raw : []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load appliances.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [selectedAccount]);

  const openAdd = () => { setForm({ ...defaultForm, account_number: selectedAccount }); setEditTarget(null); setModal('add'); };
  const openEdit = (a) => {
    setForm({
      name: a.name || a.appliance_name || '',
      category: a.category || 'Other',
      wattage: a.wattage || a.power_rating || '',
      daily_usage_hours: a.daily_usage_hours || a.usage_hours || '',
      quantity: a.quantity || 1,
      is_active: a.is_active !== false,
      account_number: selectedAccount,
    });
    setEditTarget(a);
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        account_number: selectedAccount,
        wattage: parseFloat(form.wattage) || 0,
        daily_usage_hours: parseFloat(form.daily_usage_hours) || 0,
        quantity: parseInt(form.quantity) || 1,
      };
      if (modal === 'edit' && editTarget) {
        await appliancesAPI.update(editTarget.id || editTarget._id, payload);
      } else {
        await appliancesAPI.add(payload);
      }
      setModal(null);
      await load();
    } catch (e) {
      alert(e.response?.data?.detail || 'Save failed.');
    }
    setSaving(false);
  };

  const handleDelete = async (a) => {
    if (!confirm(`Delete "${a.name || a.appliance_name}"?`)) return;
    try {
      await appliancesAPI.delete(a.id || a._id);
      await load();
    } catch (e) {
      alert(e.response?.data?.detail || 'Delete failed.');
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const filtered = appliances.filter(a => {
    const matchCat = filter === 'All' || (a.category || '').toLowerCase() === filter.toLowerCase();
    const matchSearch = !search || (a.name || a.appliance_name || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalWatts = appliances.filter(a => a.is_active !== false)
    .reduce((s, a) => s + ((a.wattage || 0) * (a.quantity || 1)), 0);

  const estMonthly = appliances.filter(a => a.is_active !== false)
    .reduce((s, a) => s + ((a.wattage || 0) * (a.daily_usage_hours || 0) * 30 / 1000) * (a.quantity || 1), 0);

  if (loading) return <PageLoader />;

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Appliances', value: appliances.length, icon: Plug, color: 'purple' },
          { label: 'Active Load', value: `${totalWatts.toLocaleString()} W`, icon: Zap, color: 'yellow' },
          { label: 'Est. Monthly', value: `${estMonthly.toFixed(1)} kWh`, icon: Clock, color: 'green' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase">{label}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center`} style={{ background: `var(--${color}-dim)` }}>
                <Icon size={14} style={{ color: `var(--${color})` }} />
              </div>
            </div>
            <div className={`font-mono text-xl sm:text-2xl font-bold`} style={{ color: `var(--${color})` }}>{value}</div>
          </Card>
        ))}
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {/* Header + controls */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-[#1E293B] pb-5">
          <SectionHeader title="My Appliances" subtitle={`${appliances.length} registered devices`} className="!mb-0" />
          <Btn icon={<Plus size={14} />} onClick={openAdd} className="shrink-0">Add Appliance</Btn>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search appliances..." 
              className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00E5FF] transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap md:flex-nowrap md:overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                  filter === c 
                    ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30' 
                    : 'bg-transparent text-[#64748B] border-[#1E293B] hover:text-white hover:border-[#333B53]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Appliance grid */}
        {filtered.length === 0 ? (
          <EmptyState icon="🔌" title="No appliances found" subtitle="Add your household appliances to start tracking energy usage." action={<Btn onClick={openAdd} icon={<Plus size={14} />}>Add First Appliance</Btn>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(a => {
              const isActive = a.is_active !== false;
              const watts = a.wattage || a.power_rating || 0;
              const hours = a.daily_usage_hours || a.usage_hours || 0;
              const monthly = (watts * hours * 30 / 1000).toFixed(1);
              return (
                <div
                  key={a.id || a._id}
                  className={`bg-[#0A0D14] border rounded-xl p-4 transition-all duration-200 ${isActive ? 'border-[#1E293B] opacity-100 hover:border-[#333B53]' : 'border-[#1E293B]/50 opacity-50 grayscale-[50%]'}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-bold text-white mb-1.5 line-clamp-1">
                        {a.name || a.appliance_name}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge color={isActive ? 'green' : 'red'} className="!text-[9px] !px-2 !py-0.5">{isActive ? 'Active' : 'Inactive'}</Badge>
                        {a.category && <Badge color="purple" className="!text-[9px] !px-2 !py-0.5">{a.category}</Badge>}
                        {(a.quantity || 1) > 1 && <Badge color="accent" className="!text-[9px] !px-2 !py-0.5">x{a.quantity}</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEdit(a)} className="w-8 h-8 rounded-lg bg-[#131520] border border-[#1E293B] text-[#94A3B8] hover:text-[#00E5FF] hover:border-[#00E5FF]/30 flex items-center justify-center transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(a)} className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 flex items-center justify-center transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Power', value: `${watts}W` },
                      { label: 'Daily', value: `${hours}h` },
                      { label: '~/Month', value: `${monthly} kWh` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[#131520] rounded-lg p-2 text-center border border-[#1E293B]/50">
                        <div className="text-[9px] text-[#64748B] uppercase tracking-wider font-bold mb-1">{label}</div>
                        <div className="font-mono text-xs font-bold text-white truncate">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'edit' ? 'Edit Appliance' : 'Add Appliance'}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name" className="sm:col-span-2">
            <input value={form.name} onChange={set('name')} placeholder="e.g. Living Room AC" />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Quantity">
            <input type="number" min="1" value={form.quantity} onChange={set('quantity')} />
          </Field>
          <Field label="Wattage (W)" hint="Power consumption in watts">
            <input type="number" value={form.wattage} onChange={set('wattage')} placeholder="e.g. 1500" />
          </Field>
          <Field label="Daily Usage (hours)">
            <input type="number" step="0.5" value={form.daily_usage_hours} onChange={set('daily_usage_hours')} placeholder="e.g. 8" />
          </Field>
          <div className="sm:col-span-2 flex items-center justify-between bg-[#0A0D14] p-4 rounded-xl border border-[#1E293B]">
            <label className="text-[#94A3B8] text-sm font-bold">Appliance is Active</label>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`transition-colors ${form.is_active ? 'text-green-400' : 'text-[#64748B]'}`}
            >
              {form.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn loading={saving} onClick={handleSave}>{modal === 'edit' ? 'Save Changes' : 'Add Appliance'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
