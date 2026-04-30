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
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>)}
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
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 24 }}>
        <Card>
          <SectionHeader title="Device & Session Control" subtitle="Start a live monitoring session" />
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Device</label>
              <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)} disabled={isRunning}>
                {devices.length === 0 && <option value="">No devices found</option>}
                {devices.map(d => (
                  <option key={d.device_id || d.id || d} value={d.device_id || d.id || d}>
                    {d.name || d.device_name || d.device_id || d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Duration</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DURATION_PRESETS.map(m => (
                  <button key={m} onClick={() => { setDuration(m); setCustomDuration(''); }} disabled={isRunning} style={{
                    padding: '7px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: isRunning ? 'not-allowed' : 'pointer',
                    border: '1px solid', borderColor: duration === m && !customDuration ? 'var(--accent)' : 'var(--border-default)',
                    background: duration === m && !customDuration ? 'var(--accent-dim)' : 'var(--bg-base)',
                    color: duration === m && !customDuration ? 'var(--accent)' : 'var(--text-muted)',
                  }}>{m}m</button>
                ))}
                <input
                  type="number" placeholder="Custom" disabled={isRunning}
                  value={customDuration} onChange={e => setCustomDuration(e.target.value)}
                  style={{ width: 80 }}
                />
              </div>
            </div>

            {!isRunning ? (
              <Btn onClick={startSession} loading={starting} disabled={!selectedDevice} icon={<Play size={14} />} variant="primary">
                Start Session
              </Btn>
            ) : (
              <Btn onClick={stopSession} loading={stopping} icon={<StopCircle size={14} />} variant="danger">
                Stop
              </Btn>
            )}
          </div>
        </Card>

        {/* Status */}
        <Card style={{ minWidth: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {wsStatus === 'connected' ? <Wifi size={20} style={{ color: 'var(--green)' }} /> : wsStatus === 'connecting' ? <Radio size={20} style={{ color: 'var(--yellow)', animation: 'blink 1s infinite' }} /> : <WifiOff size={20} style={{ color: 'var(--text-muted)' }} />}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: wsStatus === 'connected' ? 'var(--green)' : wsStatus === 'connecting' ? 'var(--yellow)' : 'var(--text-muted)', textTransform: 'uppercase' }}>{wsStatus}</span>
          </div>
          {isRunning && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
              {fmtSecs(elapsed)}
            </div>
          )}
          {session && <Badge color={session.status === 'completed' ? 'green' : 'accent'}>{session.status || 'running'}</Badge>}
        </Card>
      </div>

      {/* Live metrics */}
      {liveData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Thermometer size={24} style={{ color: 'var(--orange)' }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Temperature</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--orange)' }}>{fmtF(liveData.temperature_c)}°C</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Droplets size={24} style={{ color: 'var(--accent)' }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Humidity</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{fmtF(liveData.humidity_pct)}%</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SectionHeader title="Live Waveform" subtitle={`${chartData.length} data points`} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn size="sm" variant="ghost" icon={<Download size={12} />} onClick={() => downloadData('csv')}>CSV</Btn>
              <Btn size="sm" variant="ghost" icon={<Download size={12} />} onClick={() => downloadData('json')}>JSON</Btn>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="power" orientation="left" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} width={50} />
              <YAxis yAxisId="current" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: relayState ? 'var(--green)' : 'var(--text-disabled)',
              boxShadow: relayState ? '0 0 10px var(--green)' : 'none',
              transition: '0.3s',
            }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Relay is {relayState ? 'ON' : 'OFF'}
            </span>
            <Btn
              onClick={toggleRelay}
              variant={relayState ? 'danger' : 'success'}
              icon={<Zap size={14} />}
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
