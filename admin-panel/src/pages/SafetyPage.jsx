import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Cloud, AlertTriangle, Phone, BookOpen, ChevronDown, ChevronUp, MessageSquare, Send } from 'lucide-react';
import { safetyAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, SectionHeader, Btn, Badge, TabBar, EmptyState, PageLoader } from '../components/UI';

const DISASTERS = ['flood', 'cyclone', 'lightning', 'earthquake', 'fire', 'tsunami'];

const riskColor = (score) => {
  if (score >= 75) return 'var(--red)';
  if (score >= 50) return 'var(--orange)';
  if (score >= 25) return 'var(--yellow)';
  return 'var(--green)';
};

const riskLabel = (score) => {
  if (score >= 75) return 'HIGH RISK';
  if (score >= 50) return 'MODERATE';
  if (score >= 25) return 'LOW RISK';
  return 'SAFE';
};

function RiskGauge({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = riskColor(score);
  // SVG arc
  const r = 70;
  const cx = 90; const cy = 90;
  const startAngle = -210; const sweep = 240;
  const toRad = (d) => d * Math.PI / 180;
  const arcPath = (sa, sw, radius) => {
    const ea = sa + sw;
    const laf = sw > 180 ? 1 : 0;
    const x1 = cx + radius * Math.cos(toRad(sa));
    const y1 = cy + radius * Math.sin(toRad(sa));
    const x2 = cx + radius * Math.cos(toRad(ea));
    const y2 = cy + radius * Math.sin(toRad(ea));
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${laf} 1 ${x2} ${y2}`;
  };
  const filledSweep = (pct / 100) * sweep;

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="150" viewBox="0 0 180 150" className="drop-shadow-lg">
        {/* Background arc */}
        <path d={arcPath(startAngle, sweep, r)} fill="none" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
        {/* Filled arc */}
        {pct > 0 && <path d={arcPath(startAngle, filledSweep, r)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" className="transition-all duration-1000 ease-out" />}
        {/* Score text */}
        <text x={cx} y={cy + 8} textAnchor="middle" fill={color} fontSize="32" fontWeight="800" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{score}</text>
        <text x={cx} y={cy + 26} textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold" letterSpacing="1">{riskLabel(score)}</text>
      </svg>
    </div>
  );
}

function ProtocolPhase({ title, items, open: defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const phaseColor = title.includes('Prep') ? 'var(--accent)' : title.includes('During') ? 'var(--red)' : 'var(--green)';
  return (
    <div className="mb-3 border border-[#1E293B] rounded-xl overflow-hidden bg-[#0A0D14]">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between p-3.5 cursor-pointer bg-[#131520] hover:bg-[#1A1E2D] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: phaseColor }} />
          <span className="font-bold text-white text-sm">{title}</span>
          <span className="text-xs text-[#64748B]">({items.length} steps)</span>
        </div>
        {open ? <ChevronUp size={16} className="text-[#64748B]" /> : <ChevronDown size={16} className="text-[#64748B]" />}
      </div>
      {open && (
        <div className="p-4 bg-[#0A0D14] flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold border"
                style={{ color: phaseColor, background: `${phaseColor}15`, borderColor: `${phaseColor}30` }}
              >
                {i + 1}
              </div>
              <span className="text-[#94A3B8] text-sm leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SafetyPage() {
  const { selectedAccount } = useAuth();
  const [tab, setTab] = useState('risk');

  // Weather
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState('Colombo');

  // Risk
  const [riskData, setRiskData] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);

  // Protocol
  const [disasterType, setDisasterType] = useState('flood');
  const [protocol, setProtocol] = useState(null);
  const [protocolLoading, setProtocolLoading] = useState(false);

  // Assistant
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: '⚡ Welcome to the Electricity Safety Assistant!\n\nPUCSL Electricity Guidelines\n\nI can help you with:\n• Electrical hazards\n• Safety procedures\n• Emergency response',
      timestamp: new Date(),
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (!selectedAccount) return;
    setRiskLoading(true);
    safetyAPI.getRiskScore(selectedAccount)
      .then(r => setRiskData(r.data))
      .catch(() => {})
      .finally(() => setRiskLoading(false));
  }, [selectedAccount]);

  useEffect(() => {
    setProtocolLoading(true);
    setProtocol(null);
    safetyAPI.getProtocol(disasterType)
      .then(r => setProtocol(r.data))
      .catch(() => {})
      .finally(() => setProtocolLoading(false));
  }, [disasterType]);

  const fetchWeather = async () => {
    setWeatherLoading(true);
    try {
      const r = await safetyAPI.getWeather(weatherLocation);
      setWeatherData(r.data);
    } catch (e) { alert(e.response?.data?.detail || 'Weather fetch failed.'); }
    setWeatherLoading(false);
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const askQuestion = async () => {
    if (!question.trim()) return;

    const userMessage = { type: 'user', text: question, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    const q = question.trim();
    setQuestion('');
    setChatLoading(true);

    try {
      // Direct call to safety model API as in mobile app
      const response = await fetch('http://localhost:8001/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      let botResponse = `${data.answer || data}`;
      if (data.hazard_type && data.hazard_type !== 'Unknown') botResponse += `\n\n🚨 Hazard Type: ${data.hazard_type}`;
      if (data.source && data.source !== 'Unknown' && data.source !== 'N/A') botResponse += `\n📖 Source: ${data.source}`;
      
      const confScore = data.confidence ?? data.confidence_score;
      if (confScore !== undefined && confScore !== null) {
        const conf = typeof confScore === 'number' ? confScore : parseFloat(confScore);
        if (!isNaN(conf)) botResponse += `\n✅ Confidence: ${(conf * 100).toFixed(0)}%`;
      }

      setMessages((prev) => [...prev, { type: 'bot', text: botResponse, timestamp: new Date() }]);
    } catch (error) {
      console.error('Connection Error:', error);
      setMessages((prev) => [...prev, {
        type: 'bot',
        text: `⚠️ Connection Error\n\n${error.message}\n\nMake sure the API is running on port 8001.`,
        timestamp: new Date(),
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const tabs = [
    { id: 'risk', label: 'Risk Score', icon: AlertTriangle },
    { id: 'weather', label: 'Weather', icon: Cloud },
    { id: 'protocol', label: 'Emergency Protocol', icon: BookOpen },
    { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
  ];

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="mb-6 overflow-x-auto">
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {/* ── RISK SCORE ───────────────────────────────────────────────────── */}
      {tab === 'risk' && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <Card className="flex flex-col items-center justify-center">
            {riskLoading ? (
              <div className="text-center text-[#64748B] p-10 font-medium">Loading risk score...</div>
            ) : riskData ? (
              <>
                <RiskGauge score={riskData.risk_score || riskData.score || 0} />
                <p className="text-[#94A3B8] text-xs text-center mt-3 font-medium">
                  {riskData.summary || 'Risk assessment based on your usage patterns and environmental factors.'}
                </p>
              </>
            ) : (
              <EmptyState icon="🛡️" title="No risk data" subtitle="Risk score could not be loaded." />
            )}
          </Card>

          <div className="flex flex-col gap-4">
            {riskData?.factors && (
              <Card>
                <SectionHeader title="Risk Factors" />
                <div className="flex flex-col">
                  {(riskData.factors || []).map((f, i) => (
                    <div key={i} className={`flex items-center justify-between py-3 ${i < riskData.factors.length - 1 ? 'border-b border-[#1E293B]' : ''}`}>
                      <span className="text-[#94A3B8] text-[13px] font-bold">{f.name || f.factor}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 bg-[#0A0D14] rounded-full overflow-hidden border border-[#1E293B]">
                          <div className="h-full rounded-full transition-all" style={{ width: `${f.score || f.value || 0}%`, background: riskColor(f.score || f.value || 0) }} />
                        </div>
                        <span className="font-mono text-xs font-bold" style={{ color: riskColor(f.score || f.value || 0) }}>
                          {f.score || f.value || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {riskData?.recommendations && (
              <Card>
                <SectionHeader title="Safety Recommendations" />
                <div className="flex flex-col gap-2.5">
                  {(riskData.recommendations || []).map((r, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-[#0A0D14] rounded-xl border border-[#1E293B]">
                      <ShieldAlert size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                      <span className="text-[#94A3B8] text-[13px] font-medium leading-relaxed">{r}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── WEATHER ──────────────────────────────────────────────────────── */}
      {tab === 'weather' && (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <Card>
            <SectionHeader title="Current Weather" subtitle="Check conditions for your location" />
            <div className="flex gap-3 mb-5">
              <input
                value={weatherLocation}
                onChange={e => setWeatherLocation(e.target.value)}
                placeholder="City name..."
                onKeyDown={e => e.key === 'Enter' && fetchWeather()}
                className="flex-1 bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00E5FF] transition-colors"
              />
              <Btn onClick={fetchWeather} loading={weatherLoading} icon={<Cloud size={16} />}>Check</Btn>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Trincomalee'].map(c => (
                <button 
                  key={c} 
                  onClick={() => setWeatherLocation(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                    weatherLocation === c 
                      ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30' 
                      : 'bg-transparent text-[#64748B] border-[#1E293B] hover:text-white hover:border-[#333B53]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Card>

          {weatherData ? (
            <Card>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Temperature', value: `${weatherData.temperature || weatherData.temp || '—'}°C`, color: 'text-orange-400' },
                  { label: 'Humidity', value: `${weatherData.humidity || '—'}%`, color: 'text-[#00E5FF]' },
                  { label: 'Condition', value: weatherData.condition || weatherData.description || '—', color: 'text-green-400' },
                  { label: 'Wind Speed', value: `${weatherData.wind_speed || '—'} km/h`, color: 'text-yellow-400' },
                  { label: 'Visibility', value: `${weatherData.visibility || '—'} km`, color: 'text-purple-400' },
                  { label: 'Pressure', value: `${weatherData.pressure || '—'} hPa`, color: 'text-[#00E5FF]' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#0A0D14] border border-[#1E293B] rounded-xl p-4">
                    <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-bold mb-1.5">{label}</div>
                    <div className={`font-mono text-xl font-bold truncate ${color}`}>{value}</div>
                  </div>
                ))}
              </div>
              {weatherData.warning && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3">
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <span className="text-red-400 text-sm font-medium">{weatherData.warning}</span>
                </div>
              )}
            </Card>
          ) : (
            <Card className="flex items-center justify-center">
              <EmptyState icon="🌤️" title="Enter a location" subtitle="Search for any city in Sri Lanka to get current weather conditions." />
            </Card>
          )}
        </div>
      )}

      {/* ── EMERGENCY PROTOCOL ───────────────────────────────────────────── */}
      {tab === 'protocol' && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="flex flex-col gap-3">
            {DISASTERS.map(d => (
              <button
                key={d}
                onClick={() => setDisasterType(d)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-bold transition-all duration-200 text-left ${
                  disasterType === d 
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.1)]' 
                    : 'bg-[#131520] border-[#1E293B] text-[#94A3B8] hover:bg-[#1A1E2D] hover:text-white'
                }`}
              >
                <ShieldAlert size={18} className={disasterType === d ? 'text-yellow-400' : 'text-[#64748B]'} />
                {d.charAt(0).toUpperCase() + d.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          <div>
            {protocolLoading ? (
              <Card className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 rounded-full border-2 border-[#1E293B] border-t-yellow-400 animate-spin" />
              </Card>
            ) : protocol ? (
              <div className="flex flex-col gap-4">
                <Card className="border-yellow-500/20 bg-yellow-500/5 shadow-[0_0_20px_rgba(250,204,21,0.05)]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center shrink-0">
                      <ShieldAlert size={24} className="text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-yellow-400 tracking-tight">
                        {disasterType.charAt(0).toUpperCase() + disasterType.slice(1)} Protocol
                      </h3>
                      <p className="text-[#94A3B8] text-sm mt-0.5">Follow these steps to stay safe</p>
                    </div>
                  </div>
                </Card>

                {protocol.before?.length > 0 && <ProtocolPhase title="Preparation (Before)" items={protocol.before} open />}
                {protocol.during?.length > 0 && <ProtocolPhase title="During Event" items={protocol.during} />}
                {protocol.after?.length > 0 && <ProtocolPhase title="Recovery (After)" items={protocol.after} />}

                {/* Emergency contacts */}
                {protocol.emergencyContacts && (
                  <Card className="border-red-500/20 mt-2">
                    <SectionHeader title="Emergency Contacts" />
                    {protocol.emergencyContacts.sriLanka && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(protocol.emergencyContacts.sriLanka).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between bg-[#0A0D14] border border-[#1E293B] rounded-xl p-4">
                            <div>
                              <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-bold mb-1">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="font-mono text-lg text-[#00E5FF] font-bold">{v}</div>
                            </div>
                            {typeof v === 'string' && /\d/.test(v) && (
                              <a href={`tel:${v}`} className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg px-3 py-2 text-xs font-bold transition-colors">
                                <Phone size={14} /> Call
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const primary = protocol?.emergencyContacts?.sriLanka?.emergencyServices
                          || Object.values(protocol?.emergencyContacts?.sriLanka || {}).find(v => typeof v === 'string' && /\d/.test(v));
                        if (primary) window.open(`tel:${primary}`);
                      }}
                      className="mt-6 w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-lg tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:-translate-y-1 active:scale-95 flex justify-center items-center gap-2"
                    >
                      <Phone size={20} /> CALL EMERGENCY SERVICES
                    </button>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <EmptyState icon="📋" title="No protocol available" subtitle="Select a disaster type to see the emergency protocol." />
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── AI ASSISTANT ─────────────────────────────────────────────────── */}
      {tab === 'assistant' && (
        <Card className="flex flex-col p-0 overflow-hidden h-[calc(100vh-200px)] min-h-[600px] border-[#1E293B]">
          {/* Chat Header */}
          <div className="bg-[#0A0D14] p-4 border-b border-[#1E293B] flex items-center gap-4">
            <div className="w-10 h-10 bg-[#00E5FF]/10 rounded-full flex items-center justify-center shrink-0">
              <MessageSquare size={20} className="text-[#00E5FF]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white tracking-tight">Safety Assistant</h3>
              <p className="text-xs text-[#64748B]">PUCSL Electricity Guidelines</p>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => setMessages([{ type: 'bot', text: '⚡ Welcome to the Electricity Safety Assistant!\n\nPUCSL Electricity Guidelines\n\nI can help you with:\n• Electrical hazards\n• Safety procedures\n• Emergency response', timestamp: new Date() }])}>
              Clear Chat
            </Btn>
          </div>

          {/* Chat Body */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#131520]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col max-w-[85%] ${msg.type === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.type === 'user' 
                    ? 'bg-[#00E5FF] text-black rounded-tr-sm shadow-[0_2px_10px_rgba(0,229,255,0.2)] font-medium' 
                    : 'bg-[#1A1E2D] text-white border border-[#333B53] rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
                <div className="text-[10px] text-[#64748B] mt-1.5 font-bold tracking-wider">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-3 text-[#64748B] text-sm font-medium self-start bg-[#1A1E2D] border border-[#333B53] px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="w-4 h-4 rounded-full border-2 border-[#333B53] border-t-[#00E5FF] animate-spin" />
                Analyzing your question...
              </div>
            )}
            
            {messages.length <= 1 && !chatLoading && (
              <div className="flex flex-wrap gap-2 mt-4 self-start">
                {['⚡ Electrocution', '🔌 Power Lines', '⚠️ Hazards'].map(q => (
                  <button 
                    key={q} 
                    onClick={() => {
                      const fullQ = q.includes('Electro') ? 'What to do if someone is electrocuted?' : q.includes('Power') ? 'How do I stay safe around power lines?' : 'What are the main electrical hazards?';
                      setQuestion(fullQ);
                    }} 
                    className="bg-[#0A0D14] border border-[#1E293B] hover:border-[#00E5FF]/50 text-[#00E5FF] hover:bg-[#00E5FF]/5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-[#0A0D14] border-t border-[#1E293B]">
            <div className="flex gap-3">
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askQuestion()}
                placeholder="Ask a safety question..."
                className="flex-1 bg-[#131520] border border-[#333B53] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00E5FF] transition-colors"
                disabled={chatLoading}
              />
              <button 
                onClick={askQuestion} 
                disabled={chatLoading || !question.trim()}
                className={`w-12 h-12 rounded-xl bg-[#00E5FF] text-black flex items-center justify-center transition-all ${
                  (chatLoading || !question.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00E5FF]/90 hover:-translate-y-0.5 shadow-[0_0_15px_rgba(0,229,255,0.3)] active:scale-95'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-center text-[10px] text-[#64748B] mt-3 font-bold tracking-wider uppercase">
              💡 For guidance, consult a licensed electrician
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
