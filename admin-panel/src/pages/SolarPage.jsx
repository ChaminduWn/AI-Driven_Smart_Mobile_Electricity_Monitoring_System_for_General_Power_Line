import React, { useState } from 'react';
import { Sun, Cpu, CloudRain, PiggyBank, Map, HelpCircle, ArrowRight } from 'lucide-react';
import { Card, SectionHeader, Btn, TabBar, Field, StatCard, Badge } from '../components/UI';

const CLIMATE_DATA = {
  Colombo: { temp: 28.5, rain: 2390, wind: 'Low', impact: 'Low', ghi: 5.0 },
  Kandy: { temp: 24.0, rain: 1900, wind: 'Medium', impact: 'Medium', ghi: 4.6 },
  Galle: { temp: 27.5, rain: 2300, wind: 'Low', impact: 'Low', ghi: 4.9 },
  Jaffna: { temp: 30.0, rain: 1000, wind: 'High', impact: 'Medium', ghi: 5.6 },
  Anuradhapura: { temp: 30.5, rain: 900, wind: 'Medium', impact: 'Low', ghi: 5.3 },
};

const BRANDS = ['Any Brand', 'Jinko Solar', 'JA Solar', 'Trina Solar', 'Longi', 'Canadian Solar'];
const LOCATIONS = Object.keys(CLIMATE_DATA);

export default function SolarPage() {
  const [tab, setTab] = useState('ml');
  const [form, setForm] = useState({
    Budget_LKR: '', Roof_Size_m2: '', Location: 'Colombo',
    Preferred_Brand: 'Any Brand', Energy_Usage_kWhPerDay: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePredict = () => {
    setLoading(true);
    // Simulate ML API Call
    setTimeout(() => {
      const budget = parseFloat(form.Budget_LKR) || 0;
      const predictedPrice = budget * 0.95; // Just a mock
      
      setResult({
        mlData: {
          predicted_capacity_kw: parseFloat((form.Roof_Size_m2 / 7).toFixed(1)) || 5.0,
          constrained_capacity_kw: parseFloat((form.Roof_Size_m2 / 10).toFixed(1)) || 4.0,
          predicted_brand: form.Preferred_Brand !== 'Any Brand' ? form.Preferred_Brand : 'Jinko Solar',
          predicted_price_lkr: predictedPrice || 850000,
        },
        financials: {
          monthly_generation_kwh: parseFloat(((form.Roof_Size_m2 / 7) * 4 * 30).toFixed(0)) || 600,
          monthly_savings_lkr: parseFloat(((form.Roof_Size_m2 / 7) * 4 * 30 * 45).toFixed(0)) || 27000,
          payback_years: 4.5,
        },
        systemKw: parseFloat((form.Roof_Size_m2 / 7).toFixed(1)) || 5.0,
        monthlyKwh: parseFloat(((form.Roof_Size_m2 / 7) * 4 * 30).toFixed(0)) || 600,
      });
      setTab('results');
      setLoading(false);
    }, 1200);
  };

  const tabs = [
    { id: 'ml', label: 'ML Prediction', icon: Cpu },
    { id: 'results', label: 'Insights & Savings', icon: PiggyBank },
    { id: 'weather', label: 'Climate Data', icon: CloudRain },
  ];

  const renderForm = () => (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
      <Card>
        <SectionHeader title="AI-Powered System Sizing" subtitle="Enter your parameters to get ML solar recommendations" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Budget (LKR)">
            <input type="number" placeholder="e.g. 1500000" value={form.Budget_LKR} onChange={e => setForm({ ...form, Budget_LKR: e.target.value })} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" />
          </Field>
          <Field label="Roof Size (m²)">
            <input type="number" placeholder="e.g. 80" value={form.Roof_Size_m2} onChange={e => setForm({ ...form, Roof_Size_m2: e.target.value })} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" />
          </Field>
          <Field label="Daily Usage (kWh)">
            <input type="number" placeholder="e.g. 15" value={form.Energy_Usage_kWhPerDay} onChange={e => setForm({ ...form, Energy_Usage_kWhPerDay: e.target.value })} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" />
          </Field>
          <Field label="Location (District)">
            <select value={form.Location} onChange={e => setForm({ ...form, Location: e.target.value })} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors">
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Preferred Brand" className="sm:col-span-2">
            <select value={form.Preferred_Brand} onChange={e => setForm({ ...form, Preferred_Brand: e.target.value })} className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors">
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-5">
          <Btn onClick={handlePredict} loading={loading} icon={<Sun size={18} />} className="w-full justify-center !py-4 !text-base !bg-[#00E5FF] !text-black hover:!bg-[#00B8CC] font-bold tracking-wide rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.2)]">
            Generate ML Recommendation
          </Btn>
        </div>
      </Card>
      <div className="flex flex-col gap-4">
        <Card className="bg-[#00E5FF]/5 border-[#00E5FF]/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#00E5FF] rounded-xl flex items-center justify-center shrink-0">
              <Cpu size={20} className="text-black" />
            </div>
            <div className="text-sm font-bold text-[#00E5FF]">ML Engine</div>
          </div>
          <p className="text-[13px] text-[#94A3B8] leading-relaxed m-0">
            Our AI analyzes Sri Lanka's climate, hardware pricing, and specific energy needs to recommend the optimum solar setup.
          </p>
        </Card>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!result) return (
      <div className="text-center py-16 px-6 text-[#64748B]">
        <Sun size={64} className="opacity-20 mb-6 mx-auto" />
        <p className="text-sm font-medium">Fill out the prediction form first to see your ML insights.</p>
        <Btn onClick={() => setTab('ml')} variant="ghost" className="mt-4">Go to Form</Btn>
      </div>
    );

    return (
      <div className="flex flex-col gap-6">
        <div>
          <SectionHeader title="ML Prediction Insights" subtitle="Based on your parameters" className="mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Predicted Capacity" value={`${result.mlData.predicted_capacity_kw} kW`} color="accent" icon={Cpu} glow />
            <StatCard label="Constrained Cap." value={`${result.mlData.constrained_capacity_kw} kW`} color="blue" icon={Sun} />
            <StatCard label="Brand Match" value={result.mlData.predicted_brand} color="purple" icon={Sun} />
            <StatCard label="Estimated Price" value={`Rs. ${result.mlData.predicted_price_lkr.toLocaleString()}`} color="green" icon={PiggyBank} />
          </div>
        </div>

        <div>
          <SectionHeader title="Financial Summary" subtitle="25-year projection" className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Monthly Gen." value={`${result.financials.monthly_generation_kwh} kWh`} color="yellow" />
            <StatCard label="Monthly Savings" value={`Rs. ${result.financials.monthly_savings_lkr.toLocaleString()}`} color="green" />
            <StatCard label="Payback Period" value={`${result.financials.payback_years} yrs`} color="accent" />
          </div>
        </div>
      </div>
    );
  };

  const renderWeather = () => {
    const data = CLIMATE_DATA[form.Location];
    if (!data) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-5">
        <Card>
          <SectionHeader title={`Climate: ${form.Location}`} />
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center p-3 bg-[#0A0D14] rounded-xl border border-[#1E293B]">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Avg GHI</span>
              <span className="text-base font-bold text-yellow-400 font-mono">{data.ghi} kWh/m²/d</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0A0D14] rounded-xl border border-[#1E293B]">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Avg Temp</span>
              <span className="text-base font-bold text-orange-400 font-mono">{data.temp}°C</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0A0D14] rounded-xl border border-[#1E293B]">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Rainfall</span>
              <span className="text-base font-bold text-[#00E5FF] font-mono">{data.rain} mm</span>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="mb-6 overflow-x-auto pb-1 sm:pb-0">
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === 'ml' && renderForm()}
      {tab === 'results' && renderResults()}
      {tab === 'weather' && renderWeather()}
    </div>
  );
}
