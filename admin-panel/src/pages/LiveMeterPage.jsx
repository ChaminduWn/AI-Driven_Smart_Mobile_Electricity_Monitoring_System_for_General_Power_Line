import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Wifi, WifiOff, Play, StopCircle, Download, Thermometer, Droplets, Zap, Radio } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { iotAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { WS_BASE } from '../config';
import storage from '../utils/storage';
import { Card, SectionHeader, Btn, Badge, Field, EmptyState, PageLoader, StatCard, ProgressBar } from '../components/UI';

const POLL_INTERVAL = 3000;
const WS_RECONNECT = 6000;
const DURATION_PRESETS = [5, 10, 15, 30, 60];

const fmtF = (v, d = 1) => (v != null && !isNaN(v) ? Number(v).toFixed(d) : '—');
const fmtSecs = (s) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
const pfColor = (pf) => pf >= 0.95 ? 'var(--green)' : pf >= 0.85 ? 'var(--accent)' : pf >= 0.7 ? 'var(--yellow)' : 'var(--red)';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#131520] border border-[#1E293B] rounded-xl p-3 text-xs shadow-lg">
      <p className="text-[#64748B] mb-1 font-medium">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-bold m-0 mt-0.5">{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function LiveMeterPage() {
  const { selectedAccount } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [devicesLoading, setDevicesLoading] = useState(true);

  // Session state
  const [session, setSession] = useState(null); // null | {id, status, ...}
  const [duration, setDuration] = useState(15);
  const [customDuration, setCustomDuration] = useState('');
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  // Live data
  const [liveData, setLiveData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [wsStatus, setWsStatus] = useState('disconnected'); // disconnected | connecting | connected
  const [elapsed, setElapsed] = useState(0);
  const [relayState, setRelayState] = useState(false);

  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const elapsedRef = useRef(null);
  const reconnectRef = useRef(null);

  // Load devices
  useEffect(() => {
    if (!selectedAccount) return;
    iotAPI.getDevices(selectedAccount)
      .then(r => {
        const raw = r.data?.devices || r.data || [];
        const devs = Array.isArray(raw) ? raw : [];
        setDevices(devs);
        if (devs.length > 0) setSelectedDevice(devs[0].device_id || devs[0].id || devs[0]);
      })
      .catch(() => {})
      .finally(() => setDevicesLoading(false));
  }, [selectedAccount]);

  const pushChartPoint = (data) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setChartData(prev => [...prev.slice(-59), { time: ts, power: data.power_w || data.power || 0, current: data.current_a || data.current || 0 }]);
  };

  const startPoll = useCallback((sessionId, devId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await iotAPI.getLatest(devId);
        const d = r.data?.data || r.data;
        if (d) { setLiveData(d); pushChartPoint(d); }
        // Also check session status
        const sr = await iotAPI.getSession(sessionId);
        const sess = sr.data?.session || sr.data;
        if (sess?.status === 'completed') {
          clearInterval(pollRef.current);
          setSession(sess);
        }
      } catch { /* ignore */ }
    }, POLL_INTERVAL);
  }, []);

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  const connectWS = useCallback(async (sessionId, devId) => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setWsStatus('connecting');
    try {
      const token = await storage.getItem('accessToken');
      const ws = new WebSocket(`${WS_BASE}/ws/session/${sessionId}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => { setWsStatus('connected'); stopPoll(); };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'reading' || msg.power_w !== undefined) {
            setLiveData(msg);
            pushChartPoint(msg);
          } else if (msg.type === 'session_ended') {
            setSession(prev => ({ ...prev, status: 'completed', ...msg }));
            ws.close();
          }
        } catch { /* ignore */ }
      };
      ws.onerror = () => setWsStatus('disconnected');
      ws.onclose = () => {
        setWsStatus('disconnected');
        // Fallback to polling
        startPoll(sessionId, devId);
        if (session?.status !== 'completed') {
          reconnectRef.current = setTimeout(() => connectWS(sessionId, devId), WS_RECONNECT);
        }
      };
    } catch { setWsStatus('disconnected'); startPoll(sessionId, devId); }
  }, [session, startPoll]);

  const startSession = async () => {
    if (!selectedDevice) return;
    setStarting(true);
    const mins = parseInt(customDuration) || duration;
    try {
      const r = await iotAPI.startSession(selectedDevice, mins);
      const sess = r.data?.session || r.data;
      setSession(sess);
      setChartData([]);
      setElapsed(0);
      setLiveData(null);
      await connectWS(sess.id || sess.session_id, selectedDevice);
      // Elapsed timer
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } catch (e) { alert(e.response?.data?.detail || 'Failed to start session.'); }
    setStarting(false);
  };

  const stopSession = async () => {
    if (!session) return;
    setStopping(true);
    try {
      await iotAPI.stopSession(session.id || session.session_id);
      if (wsRef.current) wsRef.current.close();
      stopPoll();
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      // Poll until completed
      const check = async () => {
        try {
          const r = await iotAPI.getSession(session.id || session.session_id);
          const s = r.data?.session || r.data;
          setSession(s);
          if (s?.status !== 'completed') setTimeout(check, 2000);
        } catch { /* ignore */ }
      };
      await check();
    } catch (e) { alert(e.response?.data?.detail || 'Failed to stop session.'); }
    setStopping(false);
  };

  const toggleRelay = async () => {
    if (!selectedDevice) return;
    const next = !relayState;
    try {
      await iotAPI.controlRelay(selectedDevice, next ? 'on' : 'off');
      setRelayState(next);
    } catch (e) { alert(e.response?.data?.detail || 'Relay control failed.'); }
  };

  const downloadData = (type) => {
    if (type === 'json') {
      const blob = new Blob([JSON.stringify({ session, readings: chartData }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `session_${session?.id || 'data'}.json`;
      a.click(); URL.revokeObjectURL(url);
    } else {
      const rows = [['Time', 'Power (W)', 'Current (A)'], ...chartData.map(d => [d.time, d.power, d.current])];
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `session_${session?.id || 'data'}.csv`;
      a.click(); URL.revokeObjectURL(url);
    }
  };

  // Cleanup
  useEffect(() => () => {
    stopPoll();
    if (wsRef.current) wsRef.current.close();
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
  }, []);

  const isRunning = session && session.status !== 'completed' && session.status !== 'stopped';

  if (devicesLoading) return <PageLoader />;

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      {/* Header controls */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-6">
        <Card className="flex-1">
          <SectionHeader title="Device & Session Control" subtitle="Start a live monitoring session" />
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-1.5">Device</label>
              <select 
                value={selectedDevice} 
                onChange={e => setSelectedDevice(e.target.value)} 
                disabled={isRunning}
                className="w-full bg-[#0A0D14] border border-[#1E293B] rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00E5FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {devices.length === 0 && <option value="">No devices found</option>}
                {devices.map(d => (
                  <option key={d.device_id || d.id || d} value={d.device_id || d.id || d}>
                    {d.name || d.device_name || d.device_id || d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-1.5">Duration</label>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map(m => (
                  <button 
                    key={m} 
                    onClick={() => { setDuration(m); setCustomDuration(''); }} 
                    disabled={isRunning} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#333B53]'
                    } ${
                      duration === m && !customDuration 
                        ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30' 
                        : 'bg-[#0A0D14] text-[#64748B] border-[#1E293B] hover:text-white'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
                <input
                  type="number" placeholder="Custom" disabled={isRunning}
                  value={customDuration} onChange={e => setCustomDuration(e.target.value)}
                  className="w-20 bg-[#0A0D14] border border-[#1E293B] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#00E5FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {!isRunning ? (
              <Btn onClick={startSession} loading={starting} disabled={!selectedDevice} icon={<Play size={14} />} variant="primary" className="shrink-0">
                Start Session
              </Btn>
            ) : (
              <Btn onClick={stopSession} loading={stopping} icon={<StopCircle size={14} />} variant="danger" className="shrink-0">
                Stop
              </Btn>
            )}
          </div>
        </Card>

        {/* Status */}
        <Card className="min-w-[180px] flex flex-col justify-center items-center gap-2">
          <div className="flex items-center gap-2">
            {wsStatus === 'connected' ? <Wifi size={20} className="text-green-400" /> : wsStatus === 'connecting' ? <Radio size={20} className="text-yellow-400 animate-pulse" /> : <WifiOff size={20} className="text-[#64748B]" />}
            <span className={`font-mono text-xs font-bold uppercase tracking-widest ${wsStatus === 'connected' ? 'text-green-400' : wsStatus === 'connecting' ? 'text-yellow-400' : 'text-[#64748B]'}`}>{wsStatus}</span>
          </div>
          {isRunning && (
            <div className="font-mono text-2xl font-bold text-[#00E5FF]">
              {fmtSecs(elapsed)}
            </div>
          )}
          {session && <Badge color={session.status === 'completed' ? 'green' : 'accent'} className="uppercase font-bold tracking-widest !text-[9px]">{session.status || 'running'}</Badge>}
        </Card>
      </div>

      {/* Live metrics */}
      {liveData && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Power', value: `${fmtF(liveData.power_w || liveData.power)} W`, color: 'accent', glow: true },
            { label: 'Voltage', value: `${fmtF(liveData.voltage_v || liveData.voltage)} V`, color: 'yellow' },
            { label: 'Current', value: `${fmtF(liveData.current_a || liveData.current)} A`, color: 'green' },
            { label: 'Power Factor', value: fmtF(liveData.power_factor || liveData.pf, 2), color: 'purple' },
            { label: 'Energy', value: `${fmtF(liveData.energy_kwh || liveData.energy, 3)} kWh`, color: 'orange' },
          ].map(({ label, value, color, glow }) => (
            <StatCard key={label} label={label} value={value} color={color} glow={glow} />
          ))}
        </div>
      )}

      {/* Env metrics */}
      {liveData && (liveData.temperature_c !== undefined || liveData.humidity_pct !== undefined) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Thermometer size={24} className="text-orange-400" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-1">Temperature</div>
                <div className="font-mono text-2xl font-bold text-orange-400">{fmtF(liveData.temperature_c)}°C</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center shrink-0">
                <Droplets size={24} className="text-[#00E5FF]" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-1">Humidity</div>
                <div className="font-mono text-2xl font-bold text-[#00E5FF]">{fmtF(liveData.humidity_pct)}%</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <SectionHeader title="Live Waveform" subtitle={`${chartData.length} data points`} className="!mb-0" />
            <div className="flex gap-2">
              <Btn size="sm" variant="ghost" icon={<Download size={14} />} onClick={() => downloadData('csv')}>CSV</Btn>
              <Btn size="sm" variant="ghost" icon={<Download size={14} />} onClick={() => downloadData('json')}>JSON</Btn>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="power" orientation="left" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
              <YAxis yAxisId="current" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Line yAxisId="power" type="monotone" dataKey="power" name="Power (W)" stroke="#00D4FF" strokeWidth={2} dot={false} />
              <Line yAxisId="current" type="monotone" dataKey="current" name="Current (A)" stroke="#22D48A" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Relay control */}
      {selectedDevice && (
        <Card>
          <SectionHeader title="Relay Control" subtitle="Toggle the device relay remotely" />
          <div className="flex items-center gap-4 bg-[#0A0D14] p-4 rounded-xl border border-[#1E293B]">
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${relayState ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]' : 'bg-[#64748B]'}`} />
            <span className="text-[#94A3B8] text-sm font-medium">
              Relay is {relayState ? 'ON' : 'OFF'}
            </span>
            <Btn
              onClick={toggleRelay}
              variant={relayState ? 'danger' : 'success'}
              icon={<Zap size={14} />}
              className="ml-auto"
            >
              Turn {relayState ? 'Off' : 'On'}
            </Btn>
          </div>
        </Card>
      )}

      {!session && devices.length === 0 && (
        <EmptyState icon="📡" title="No IoT devices found" subtitle="Register IoT devices to your account to start live monitoring." />
      )}
    </div>
  );
}
