import React, { useState } from 'react';
import { Card, SectionHeader, Btn, TabBar } from '../components/UI';
import { Calculator, Table as TableIcon } from 'lucide-react';

const PRESETS = [
  { label: 'Low', units: 30, days: 30, icon: '🌙', color: 'text-green-400' },
  { label: 'Mid', units: 90, days: 30, icon: '⚡', color: 'text-yellow-400' },
  { label: 'High', units: 180, days: 30, icon: '🔥', color: 'text-red-400' },
];

const LOW_SLABS = [['0 – 30', '4.50', '80'], ['31 – 60', '8.00', '210']];
const HIGH_SLABS = [['0 – 60', '12.75', '—'], ['61 – 90', '18.50', '400'], ['91 – 120', '24.00', '1,000'], ['121 – 180', '41.00', '1,500'], ['181+', '61.00', '2,100']];

function calcCEB(units, days) {
  if (!units || !days || units <= 0 || days <= 0) return null;
  const norm = (units / days) * 30;
  let fixed, slabs, category, label;

  if (norm <= 60) {
    fixed = norm <= 30 ? 80 : 210;
    slabs = [{ lim: 30, rate: 4.50 }, { lim: 60, rate: 8.00 }];
    category = 1;
    label = '0 – 60 kWh';
  } else {
    fixed = norm <= 90 ? 400 : norm <= 120 ? 1000 : norm <= 180 ? 1500 : 2100;
    slabs = [
      { lim: 60, rate: 12.75 }, { lim: 90, rate: 18.50 },
      { lim: 120, rate: 24.00 }, { lim: 180, rate: 41.00 },
      { lim: null, rate: 61.00 },
    ];
    category = 2;
    label = 'Above 60 kWh';
  }

  const breakdown = [];
  let energy = 0, remaining = units, prev = 0;
  for (const { lim, rate } of slabs) {
    if (remaining <= 0) break;
    let inSlab, rangeLabel;
    if (lim === null) {
      inSlab = remaining;
      rangeLabel = `${prev + 1}+`;
    } else {
      const scaled = Math.floor(lim * days / 30);
      inSlab = Math.max(0, Math.min(remaining, scaled - prev));
      rangeLabel = prev === 0 ? `0 – ${scaled}` : `${prev + 1} – ${scaled}`;
      prev = scaled;
    }
    if (inSlab <= 0) continue;
    const amt = +(inSlab * rate).toFixed(2);
    energy += amt;
    breakdown.push({ range: rangeLabel, units: inSlab, rate, amt });
    remaining -= inSlab;
  }

  energy = +energy.toFixed(2);
  const subtotal = energy + fixed;
  const sscl = +(subtotal * 0.02565).toFixed(2);
  const total = +(subtotal + sscl).toFixed(2);
  return { category, label, energy, fixed, subtotal, sscl, total, breakdown, norm: +norm.toFixed(1) };
}

export default function TariffPage() {
  const [tab, setTab] = useState('calculator');
  const [units, setUnits] = useState('');
  const [days, setDays] = useState('30');
  const [result, setResult] = useState(null);

  const calculate = (u = units, d = days) => {
    const r = calcCEB(parseInt(u), parseInt(d) || 30);
    if (r) setResult(r);
  };

  const applyPreset = (p) => {
    setUnits(String(p.units));
    setDays(String(p.days));
    calculate(String(p.units), String(p.days));
  };

  const tabs = [
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'table', label: 'Rate Table', icon: TableIcon },
  ];

  return (
    <div className="animate-[fadeIn_0.3s_ease] max-w-4xl mx-auto">
      <div className="mb-6 overflow-x-auto">
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === 'calculator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <SectionHeader title="Consumption Details" subtitle="Enter your usage to calculate" />
            <div className="flex flex-col gap-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-1.5">UNITS (kWh)</label>
                  <input
                    value={units}
                    onChange={e => setUnits(e.target.value)}
                    type="number"
                    placeholder="e.g. 120"
                    className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-1.5">BILLING DAYS</label>
                  <input
                    value={days}
                    onChange={e => setDays(e.target.value)}
                    type="number"
                    placeholder="30"
                    className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-2">QUICK PRESETS</label>
                <div className="flex gap-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p)}
                      className="flex-1 bg-[#0A0D14] border border-[#1E293B] hover:border-[#333B53] rounded-xl py-3 flex flex-col items-center gap-1 transition-all"
                    >
                      <span className="text-xl">{p.icon}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${p.color}`}>{p.label}</span>
                      <span className="text-xs font-bold text-white">{p.units} kWh</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => calculate()}
              disabled={!units || !days}
              className="w-full py-4 bg-[#00E5FF] hover:bg-[#00E5FF]/90 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl font-bold text-sm tracking-wide shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all"
            >
              Calculate Bill →
            </button>
          </Card>

          {result && (
            <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease]">
              <Card>
                <SectionHeader title="Bill Summary" />
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Energy', val: result.energy, color: 'text-[#00E5FF]' },
                    { label: 'Fixed', val: result.fixed, color: 'text-[#818CF8]' },
                    { label: 'SSCL', val: result.sscl, color: 'text-[#64748B]' },
                  ].map((p, i) => (
                    <div key={i} className="bg-[#0A0D14] border border-[#1E293B] rounded-xl p-3 flex flex-col items-center">
                      <div className="text-[9px] font-bold tracking-widest text-[#64748B] uppercase mb-1">{p.label}</div>
                      <div className={`text-sm font-bold ${p.color}`}>Rs. {p.val.toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#0A0D14] border border-[#00E5FF]/30 rounded-xl p-5 flex justify-between items-center mb-5">
                  <div>
                    <div className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase">TOTAL DUE</div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">incl. all taxes · {days} days</div>
                  </div>
                  <div className="text-3xl font-black text-[#00E5FF] tracking-tight">Rs. {result.total.toLocaleString()}</div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Per Day', val: `Rs. ${(result.total / (parseInt(days) || 30)).toFixed(2)}` },
                    { label: 'Per kWh', val: `Rs. ${(result.total / parseInt(units)).toFixed(2)}` },
                    { label: 'Category', val: `Cat ${result.category}` },
                  ].map((p, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="text-[9px] font-bold tracking-widest text-[#64748B] uppercase mb-1">{p.label}</div>
                      <div className="text-xs font-bold text-[#94A3B8]">{p.val}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <SectionHeader title="Energy Breakdown" />
                <div className="flex flex-col gap-3">
                  {result.breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#0A0D14] p-3 rounded-lg border border-[#1E293B]">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#E2E8F0]">{item.range} kWh</span>
                        <span className="text-[10px] text-[#64748B]">{item.units} units × Rs. {item.rate}/kWh</span>
                      </div>
                      <span className="text-sm font-bold text-[#00E5FF]">Rs. {item.amt.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {tab === 'table' && (
        <Card>
          <SectionHeader title="Domestic Tariff — Oct 2025" subtitle="Effective 15 Oct 2025 · Defined per 30-day billing period" />
          
          <div className="mb-6 rounded-xl border border-green-500/30 overflow-hidden">
            <div className="bg-green-500/10 px-4 py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs font-bold text-green-400">Category 1 — 0 to 60 kWh / month</span>
            </div>
            <div className="grid grid-cols-3 bg-[#0A0D14] px-4 py-2 border-y border-[#1E293B]">
              {['Block', 'Rate / kWh', 'Fixed Charge'].map(h => <div key={h} className="text-[10px] font-bold text-[#64748B] uppercase">{h}</div>)}
            </div>
            {LOW_SLABS.map((r, i) => (
              <div key={i} className={`grid grid-cols-3 px-4 py-3 ${i % 2 === 0 ? 'bg-[#070B14]/80' : ''}`}>
                <div className="text-xs font-bold text-[#CBD5E1]">{r[0]} kWh</div>
                <div className="text-xs font-bold text-[#38BDF8]">Rs. {r[1]}</div>
                <div className="text-xs font-bold text-[#818CF8]">Rs. {r[2]}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-orange-500/30 overflow-hidden">
            <div className="bg-orange-500/10 px-4 py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-xs font-bold text-orange-400">Category 2 — Above 60 kWh / month</span>
            </div>
            <div className="grid grid-cols-3 bg-[#0A0D14] px-4 py-2 border-y border-[#1E293B]">
              {['Block', 'Rate / kWh', 'Fixed Charge'].map(h => <div key={h} className="text-[10px] font-bold text-[#64748B] uppercase">{h}</div>)}
            </div>
            {HIGH_SLABS.map((r, i) => (
              <div key={i} className={`grid grid-cols-3 px-4 py-3 ${i % 2 === 0 ? 'bg-[#070B14]/80' : ''}`}>
                <div className="text-xs font-bold text-[#CBD5E1]">{r[0]} kWh</div>
                <div className="text-xs font-bold text-[#38BDF8]">Rs. {r[1]}</div>
                <div className="text-xs font-bold text-[#818CF8]">{r[2] === '—' ? '—' : `Rs. ${r[2]}`}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-[#0A0D14] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-2">
            {['⚡ SSCL of 2.565% applied on all charges', '📅 Slab limits scale for non-30-day periods', '🔢 Category set by 30-day normalised consumption'].map((n, i) => (
              <div key={i} className="text-[11px] text-[#94A3B8]">{n}</div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
