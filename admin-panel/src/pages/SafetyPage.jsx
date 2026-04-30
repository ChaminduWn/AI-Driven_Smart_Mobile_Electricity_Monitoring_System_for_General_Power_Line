import React, { useState, useEffect } from 'react';
import { ShieldAlert, Cloud, AlertTriangle, Phone, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="180" height="150" viewBox="0 0 180 150">
        {/* Background arc */}
        <path d={arcPath(startAngle, sweep, r)} fill="none" stroke="var(--border-default)" strokeWidth="12" strokeLinecap="round" />
        {/* Filled arc */}
        {pct > 0 && <path d={arcPath(startAngle, filledSweep, r)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />}
        {/* Score text */}
        <text x={cx} y={cy + 8} textAnchor="middle" fill={color} fontSize="28" fontWeight="700" fontFamily="'Space Mono', monospace">{score}</text>
        <text x={cx} y={cy + 26} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="'Syne', sans-serif">{riskLabel(score)}</text>
      </svg>
    </div>
  );
}

function ProtocolPhase({ title, items, open: defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const phaseColor = title.includes('Prep') ? 'var(--accent)' : title.includes('During') ? 'var(--red)' : 'var(--green)';
  return (
    <div style={{ marginBottom: 10, border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', cursor: 'pointer', background: 'var(--bg-surface)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: phaseColor }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{title}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({items.length} steps)</span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
      </div>
      {open && (
        <div style={{ padding: '10px 14px 14px', background: 'var(--bg-base)' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: phaseColor + '20', border: `1px solid ${phaseColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 10, color: phaseColor, fontWeight: 700 }}>{i + 1}</div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>{item}</span>
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

  const tabs = [
    { id: 'risk', label: 'Risk Score', icon: AlertTriangle },
    { id: 'weather', label: 'Weather', icon: Cloud },
    { id: 'protocol', label: 'Emergency Protocol', icon: BookOpen },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 20 }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {/* ── RISK SCORE ───────────────────────────────────────────────────── */}
      {tab === 'risk' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {riskLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Loading risk score...</div>
            ) : riskData ? (
              <>
                <RiskGauge score={riskData.risk_score || riskData.score || 0} />
                <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                  {riskData.summary || 'Risk assessment based on your usage patterns and environmental factors.'}
                </p>
              </>
            ) : (
              <EmptyState icon="🛡️" title="No risk data" subtitle="Risk score could not be loaded." />
            )}
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {riskData?.factors && (
              <Card>
                <SectionHeader title="Risk Factors" />
                {(riskData.factors || []).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < riskData.factors.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{f.name || f.factor}</span>
                    <div style={{ display: 'flex', align: 'center', gap: 10 }}>
                      <div style={{ width: 80, height: 4, background: 'var(--bg-base)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${f.score || f.value || 0}%`, background: riskColor(f.score || f.value || 0), borderRadius: 4 }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: riskColor(f.score || f.value || 0) }}>
                        {f.score || f.value || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {riskData?.recommendations && (
              <Card>
                <SectionHeader title="Safety Recommendations" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(riskData.recommendations || []).map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: 8 }}>
                      <ShieldAlert size={14} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r}</span>
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
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          <Card>
            <SectionHeader title="Current Weather" subtitle="Check conditions for your location" />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                value={weatherLocation}
                onChange={e => setWeatherLocation(e.target.value)}
                placeholder="City name..."
                onKeyDown={e => e.key === 'Enter' && fetchWeather()}
                style={{ flex: 1 }}
              />
              <Btn onClick={fetchWeather} loading={weatherLoading} icon={<Cloud size={14} />}>Check</Btn>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Trincomalee'].map(c => (
                <button key={c} onClick={() => { setWeatherLocation(c); }}
                  style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-default)', background: weatherLocation === c ? 'var(--accent-dim)' : 'transparent', color: weatherLocation === c ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {c}
                </button>
              ))}
            </div>
          </Card>

          {weatherData ? (
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
                {[
                  { label: 'Temperature', value: `${weatherData.temperature || weatherData.temp || '—'}°C`, color: 'orange' },
                  { label: 'Humidity', value: `${weatherData.humidity || '—'}%`, color: 'accent' },
                  { label: 'Condition', value: weatherData.condition || weatherData.description || '—', color: 'green' },
                  { label: 'Wind Speed', value: `${weatherData.wind_speed || '—'} km/h`, color: 'yellow' },
                  { label: 'Visibility', value: `${weatherData.visibility || '—'} km`, color: 'purple' },
                  { label: 'Pressure', value: `${weatherData.pressure || '—'} hPa`, color: 'accent' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: `var(--${color})` }}>{value}</div>
                  </div>
                ))}
              </div>
              {weatherData.warning && (
                <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
                  <AlertTriangle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--red)', fontSize: 13 }}>{weatherData.warning}</span>
                </div>
              )}
            </Card>
          ) : (
            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState icon="🌤️" title="Enter a location" subtitle="Search for any city in Sri Lanka to get current weather conditions." />
            </Card>
          )}
        </div>
      )}

      {/* ── EMERGENCY PROTOCOL ───────────────────────────────────────────── */}
      {tab === 'protocol' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DISASTERS.map(d => (
              <button
                key={d}
                onClick={() => setDisasterType(d)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                  border: '1px solid',
                  borderColor: disasterType === d ? 'var(--yellow)' : 'var(--border-subtle)',
                  background: disasterType === d ? 'var(--yellow-dim)' : 'var(--bg-card)',
                  borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
                  color: disasterType === d ? 'var(--yellow)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                <ShieldAlert size={15} style={{ color: disasterType === d ? 'var(--yellow)' : 'var(--text-muted)' }} />
                {d.charAt(0).toUpperCase() + d.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          <div>
            {protocolLoading ? (
              <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--yellow)', animation: 'spin 0.8s linear infinite' }} />
              </Card>
            ) : protocol ? (
              <>
                <Card style={{ marginBottom: 14, borderColor: 'rgba(255,215,0,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldAlert size={20} style={{ color: 'var(--yellow)' }} />
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--yellow)', fontWeight: 700, fontSize: 16 }}>
                        {disasterType.charAt(0).toUpperCase() + disasterType.slice(1)} Protocol
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Follow these steps to stay safe</p>
                    </div>
                  </div>
                </Card>

                {protocol.before?.length > 0 && <ProtocolPhase title="Preparation (Before)" items={protocol.before} open />}
                {protocol.during?.length > 0 && <ProtocolPhase title="During Event" items={protocol.during} />}
                {protocol.after?.length > 0 && <ProtocolPhase title="Recovery (After)" items={protocol.after} />}

                {/* Emergency contacts */}
                {protocol.emergencyContacts && (
                  <Card style={{ marginTop: 14, borderColor: 'rgba(255,77,109,0.3)' }}>
                    <SectionHeader title="Emergency Contacts" />
                    {protocol.emergencyContacts.sriLanka && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                        {Object.entries(protocol.emergencyContacts.sriLanka).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', borderRadius: 8, padding: '10px 12px' }}>
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>{v}</div>
                            </div>
                            {typeof v === 'string' && /\d/.test(v) && (
                              <a href={`tel:${v}`} style={{ background: 'var(--green-dim)', border: '1px solid rgba(34,212,138,0.2)', color: 'var(--green)', borderRadius: 6, padding: '4px 10px', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                                <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Call
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
                      style={{
                        marginTop: 14, width: '100%', padding: '14px', background: 'var(--red)',
                        color: '#fff', border: 'none', borderRadius: 10, fontSize: 15,
                        fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      🚨 CALL EMERGENCY SERVICES
                    </button>
                  </Card>
                )}
              </>
            ) : (
              <EmptyState icon="📋" title="No protocol available" subtitle="Select a disaster type to see the emergency protocol." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
