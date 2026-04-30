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
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Appliances', value: appliances.length, icon: Plug, color: 'purple' },
          { label: 'Active Load', value: `${totalWatts.toLocaleString()} W`, icon: Zap, color: 'yellow' },
          { label: 'Est. Monthly', value: `${estMonthly.toFixed(1)} kWh`, icon: Clock, color: 'green' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
              <div style={{ width: 28, height: 28, background: `var(--${color}-dim)`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} style={{ color: `var(--${color})` }} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: `var(--${color})` }}>{value}</div>
          </Card>
        ))}
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {/* Header + controls */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SectionHeader title="My Appliances" subtitle={`${appliances.length} registered devices`} />
          <Btn icon={<Plus size={14} />} onClick={openAdd}>Add Appliance</Btn>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search appliances..." style={{ paddingLeft: 30 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid',
                  borderColor: filter === c ? 'var(--accent)' : 'var(--border-default)',
                  background: filter === c ? 'var(--accent-dim)' : 'transparent',
                  color: filter === c ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* Appliance grid */}
        {filtered.length === 0 ? (
          <EmptyState icon="🔌" title="No appliances found" subtitle="Add your household appliances to start tracking energy usage." action={<Btn onClick={openAdd} icon={<Plus size={14} />}>Add First Appliance</Btn>} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map(a => {
              const isActive = a.is_active !== false;
              const watts = a.wattage || a.power_rating || 0;
              const hours = a.daily_usage_hours || a.usage_hours || 0;
              const monthly = (watts * hours * 30 / 1000).toFixed(1);
              return (
                <div
                  key={a.id || a._id}
                  style={{
                    background: 'var(--bg-surface)', border: '1px solid',
                    borderColor: isActive ? 'var(--border-default)' : 'var(--border-subtle)',
                    borderRadius: 'var(--radius-md)', padding: 16,
                    opacity: isActive ? 1 : 0.6, transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                        {a.name || a.appliance_name}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Badge color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Badge>
                        {a.category && <Badge color="purple">{a.category}</Badge>}
                        {(a.quantity || 1) > 1 && <Badge color="accent">x{a.quantity}</Badge>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(a)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-muted)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => handleDelete(a)} style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,77,109,0.2)', color: 'var(--red)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Power', value: `${watts}W` },
                      { label: 'Daily', value: `${hours}h` },
                      { label: '~/Month', value: `${monthly} kWh` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: 'var(--bg-base)', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{value}</div>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Name" style={{ gridColumn: '1/-1' }}>
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
          <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Active</label>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.is_active ? 'var(--green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            >
              {form.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn loading={saving} onClick={handleSave}>{modal === 'edit' ? 'Save Changes' : 'Add Appliance'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
