/*
 * src/screens/LiveMeterScreen.js
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Dimensions, Platform,
} from 'react-native';
import { useAccount } from '../contexts/AccountContext';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';

const { width: W } = Dimensions.get('window');

// ─── Auto-detect correct URL based on platform ───────────────────────────────
// Web browser → localhost (both on same PC)
// Physical phone → your PC IP
const PC_IP   = '192.168.1.24';
const HOST    = Platform.OS === 'web' ? 'localhost' : PC_IP;
const BASE_URL = `http://${HOST}:8000/api/v1`;
const WS_URL   = `ws://${HOST}:8000`;
// ─────────────────────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// SUB COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ─── Big Power Display ────────────────────────────────────────────────────────
const PowerDisplay = ({ power }) => {
  const max   = 3000;
  const pct   = Math.min(1, power / max);
  const color = pct < 0.3 ? COLORS.success : pct < 0.7 ? '#F59E0B' : COLORS.danger;

  return (
    <View style={pw.container}>
      <Text style={pw.label}>LIVE POWER</Text>
      <Text style={[pw.value, { color }]}>
        {power >= 1000
          ? `${(power / 1000).toFixed(2)} kW`
          : `${power.toFixed(0)} W`}
      </Text>
      <View style={pw.track}>
        <View style={[pw.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={pw.maxLabel}>0W ──────────────────── 3000W</Text>
    </View>
  );
};

const pw = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: SPACING.lg },
  label:     { color: COLORS.textMuted, fontSize: 11, letterSpacing: 2, ...FONTS.medium },
  value:     { fontSize: 52, ...FONTS.bold, lineHeight: 60, marginVertical: SPACING.sm },
  track:     { width: W - 80, height: 8, backgroundColor: COLORS.bg3, borderRadius: 4, overflow: 'hidden', marginTop: SPACING.sm },
  fill:      { height: '100%', borderRadius: 4 },
  maxLabel:  { color: COLORS.textMuted, fontSize: 10, marginTop: 6 },
});


// ─── Gauge Circle ─────────────────────────────────────────────────────────────
const Gauge = ({ value, max, label, unit, color }) => {
  const size = 90;
  return (
    <View style={g.wrap}>
      <View style={[g.circle, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
        <Text style={[g.value, { color }]}>
          {value >= 100 ? value.toFixed(0) : value.toFixed(1)}
        </Text>
        <Text style={g.unit}>{unit}</Text>
      </View>
      <Text style={g.label}>{label}</Text>
    </View>
  );
};

const g = StyleSheet.create({
  wrap:   { alignItems: 'center', marginHorizontal: 6 },
  circle: { borderWidth: 5, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg3 },
  value:  { fontSize: 16, ...FONTS.bold },
  unit:   { color: COLORS.textMuted, fontSize: 10 },
  label:  { color: COLORS.textSecondary, fontSize: 11, marginTop: 6, textAlign: 'center' },
});


// ─── Mini Stat ────────────────────────────────────────────────────────────────
const Stat = ({ label, value, unit, color }) => (
  <View style={st.card}>
    <Text style={st.label}>{label}</Text>
    <Text style={[st.value, { color: color || COLORS.textPrimary }]}>
      {value}
      <Text style={st.unit}> {unit}</Text>
    </Text>
  </View>
);

const st = StyleSheet.create({
  card:  { flex: 1, backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, padding: SPACING.md, margin: 3, alignItems: 'center' },
  label: { color: COLORS.textMuted, fontSize: 10, ...FONTS.medium, marginBottom: 4 },
  value: { fontSize: 15, ...FONTS.bold },
  unit:  { fontSize: 10, color: COLORS.textMuted },
});


// ─── Appliance Badge ──────────────────────────────────────────────────────────
const ApplianceBadge = ({ name, watts }) => {
  const emoji = (n) => {
    if (!n) return '⚡';
    const l = n.toLowerCase();
    if (l.includes('ac'))                       return '❄️';
    if (l.includes('fan'))                      return '🌀';
    if (l.includes('rice'))                     return '🍚';
    if (l.includes('tv') || l.includes('tele')) return '📺';
    if (l.includes('laptop'))                   return '💻';
    if (l.includes('water'))                    return '🚿';
    if (l.includes('washing'))                  return '🫧';
    if (l.includes('standby') || l.includes('off')) return '💤';
    if (l.includes('charger'))                  return '🔌';
    if (l.includes('iron') || l.includes('micro')) return '🔥';
    return '⚡';
  };

  return (
    <View style={ab.row}>
      <Text style={ab.emoji}>{emoji(name)}</Text>
      <View>
        <Text style={ab.name}>{name || 'Detecting...'}</Text>
        {watts > 0 && <Text style={ab.watts}>{watts.toFixed(0)} W measured</Text>}
      </View>
    </View>
  );
};

const ab = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primary + '18', borderRadius: 99, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, alignSelf: 'flex-start', marginTop: 8 },
  emoji: { fontSize: 22 },
  name:  { color: COLORS.primary, fontSize: 13, ...FONTS.semiBold },
  watts: { color: COLORS.textMuted, fontSize: 11 },
});


// ─── Anomaly Alerts ───────────────────────────────────────────────────────────
const Anomalies = ({ list }) => {
  if (!list || list.length === 0) return null;
  const fmt = (code) => {
    if (code.startsWith('LOW_VOLTAGE'))      return `Low Voltage (${code.split(':')[1]}) - CEB grid issue`;
    if (code.startsWith('HIGH_VOLTAGE'))     return `High Voltage (${code.split(':')[1]}) - Surge risk`;
    if (code.startsWith('LOW_POWER_FACTOR')) return `Low Power Factor (${code.split(':')[1]})`;
    if (code.startsWith('POWER_SPIKE'))      return `Power Spike (${code.split(':')[1]})`;
    return code;
  };
  return (
    <View style={an.box}>
      {list.map((a, i) => (
        <Text key={i} style={an.text}>{fmt(a)}</Text>
      ))}
    </View>
  );
};

const an = StyleSheet.create({
  box:  { backgroundColor: '#EF444415', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  text: { color: '#EF4444', fontSize: 12, marginBottom: 2 },
});


// ─── Power History Chart ──────────────────────────────────────────────────────
const PowerChart = ({ history }) => {
  if (!history || history.length < 2) return null;
  const powers = history.map(r => r.power || 0);
  const maxP   = Math.max(...powers, 100);

  return (
    <View>
      <Text style={ch.title}>Power History - last 5 min</Text>
      <View style={{ height: 60, flexDirection: 'row', alignItems: 'flex-end' }}>
        {powers.slice(-40).map((p, i, arr) => {
          const h   = Math.max(2, (p / maxP) * 60);
          const col = p < 200 ? COLORS.success : p < 1000 ? '#F59E0B' : COLORS.danger;
          return (
            <View key={i} style={{
              flex: 1, height: h, backgroundColor: col, marginHorizontal: 0.5,
              opacity: 0.6 + (i / arr.length) * 0.4,
            }} />
          );
        })}
      </View>
      <View style={ch.legend}>
        <Text style={ch.leg}>5 min ago</Text>
        <Text style={ch.leg}>Now</Text>
      </View>
    </View>
  );
};

const ch = StyleSheet.create({
  title:  { color: COLORS.textMuted, fontSize: 11, ...FONTS.medium, marginBottom: SPACING.sm },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  leg:    { color: COLORS.textMuted, fontSize: 10 },
});


// ─── Appliance Event Log ──────────────────────────────────────────────────────
const EventLog = ({ events }) => {
  if (!events || events.length === 0) return (
    <Text style={{ color: COLORS.textMuted, fontSize: 12, textAlign: 'center', padding: SPACING.md }}>
      No appliance changes detected yet
    </Text>
  );
  return (
    <>
      {[...events].reverse().slice(0, 8).map((e, i) => (
        <View key={i} style={ev.row}>
          <Text style={ev.time}>
            {e.server_time ? new Date(e.server_time).toLocaleTimeString() : '--:--'}
          </Text>
          <Text style={ev.txt}>{e.from} to {e.to}</Text>
          <Text style={ev.w}>{e.watts?.toFixed(0)}W</Text>
        </View>
      ))}
    </>
  );
};

const ev = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.bg3, gap: 8 },
  time: { color: COLORS.textMuted, fontSize: 11, width: 65 },
  txt:  { color: COLORS.textSecondary, fontSize: 12, flex: 1 },
  w:    { color: COLORS.primary, fontSize: 12, ...FONTS.medium },
});


// ── Card wrapper ──────────────────────────────────────────────────────────────
const Card = ({ title, children }) => (
  <View style={card.box}>
    {title && <Text style={card.title}>{title}</Text>}
    {children}
  </View>
);

const card = StyleSheet.create({
  box:   { backgroundColor: COLORS.bg2, borderRadius: RADIUS.lg, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, padding: SPACING.lg, ...SHADOW.sm },
  title: { color: COLORS.textPrimary, fontSize: 14, ...FONTS.semiBold, marginBottom: SPACING.md },
});


// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function LiveMeterScreen({ navigation }) {
  const { selectedAccount } = useAccount();
  const wsRef        = useRef(null);
  const reconnectRef = useRef(null);
  const pingAnim     = useRef(new Animated.Value(1)).current;

  const [connected,       setConnected]       = useState(false);
  const [connecting,      setConnecting]      = useState(false);
  const [liveData,        setLiveData]        = useState(null);
  const [history,         setHistory]         = useState([]);
  const [applianceEvents, setApplianceEvents] = useState([]);
  const [activeTab,       setActiveTab]       = useState('live');
  const [debugMsg,        setDebugMsg]        = useState('');

  const account = selectedAccount;

  // ── WebSocket connect ───────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!account || connecting || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) return;

    const url = `${WS_URL}/api/v1/iot/ws/${account}`;
    setDebugMsg(`Connecting to: ${url}`);
    console.log('[LiveMeter] Connecting to:', url);
    console.log('[LiveMeter] Platform:', Platform.OS);

    setConnecting(true);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[LiveMeter] WebSocket connected!');
        setDebugMsg('Connected!');
        setConnected(true);
        setConnecting(false);
        Animated.loop(Animated.sequence([
          Animated.timing(pingAnim, { toValue: 0.2, duration: 700, useNativeDriver: true }),
          Animated.timing(pingAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        ])).start();
        ws._ping = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 20000);
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          console.log('[LiveMeter] Message received:', msg.type);
          if (msg.type === 'live_reading') {
            setLiveData(msg.data);
            setHistory(prev => [...prev.slice(-59), msg.data]);
          } else if (msg.type === 'appliance_event') {
            setApplianceEvents(prev => [...prev.slice(-49), msg.data]);
          } else if (msg.type === 'snapshot') {
            if (msg.data.latest)                    setLiveData(msg.data.latest);
            if (msg.data.history?.length)           setHistory(msg.data.history);
            if (msg.data.appliance_events?.length)  setApplianceEvents(msg.data.appliance_events);
          }
        } catch (err) {
          console.log('[LiveMeter] Parse error:', err);
        }
      };

      ws.onclose = (e) => {
        console.log('[LiveMeter] WebSocket closed:', e.code, e.reason);
        setDebugMsg(`Closed (${e.code}) - retrying...`);
        clearInterval(ws._ping);
        setConnected(false);
        setConnecting(false);
        pingAnim.stopAnimation();
        reconnectRef.current = setTimeout(() => connect(), 3000);
      };

      ws.onerror = (e) => {
        console.log('[LiveMeter] WebSocket error:', e.message);
        setDebugMsg(`Error: ${e.message}`);
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      console.log('[LiveMeter] Connect exception:', err);
      setDebugMsg(`Exception: ${err.message}`);
      setConnecting(false);
    }
  }, [account]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [account]);

  // ── Data shortcuts ──────────────────────────────────────────────────────────
  const d         = liveData || {};
  const power     = d.power         || 0;
  const voltage   = d.voltage       || 0;
  const current   = d.current       || 0;
  const pf        = d.power_factor  || 0;
  const freq      = d.frequency     || 0;
  const appliance = d.detected_appliance || 'No data';
  const anomalies = d.anomalies     || [];

  const TABS = [
    { id: 'live',   label: 'Live',   emoji: '⚡' },
    { id: 'stats',  label: 'Stats',  emoji: '📊' },
    { id: 'events', label: 'Events', emoji: '📋' },
  ];

  // ── No account selected ─────────────────────────────────────────────────────
  if (!account) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📡</Text>
        <Text style={s.emptyTitle}>No Account Selected</Text>
        <Text style={s.emptySub}>Select an account to view live meter data</Text>
      </View>
    );
  }

  // ── Main UI ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.screen}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Live Meter</Text>
          <Text style={s.sub}>Account: {account}</Text>
        </View>
        <View style={s.statusRow}>
          <Animated.View style={[s.dot, {
            backgroundColor: connected ? COLORS.success : connecting ? '#F59E0B' : COLORS.danger,
            opacity: connected ? pingAnim : 1,
          }]} />
          <Text style={[s.statusTxt, {
            color: connected ? COLORS.success : connecting ? '#F59E0B' : COLORS.danger,
          }]}>
            {connected ? 'LIVE' : connecting ? 'Connecting' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Debug bar — shows WS URL so you can confirm it's correct */}
      <View style={s.debugBar}>
        <Text style={s.debugTxt} numberOfLines={1}>
          {Platform.OS === 'web' ? 'WEB' : 'NATIVE'} | ws://{HOST}:8000 | {debugMsg}
        </Text>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[s.tab, activeTab === t.id && s.activeTab]}
            onPress={() => setActiveTab(t.id)}
          >
            <Text style={s.tabEmoji}>{t.emoji}</Text>
            <Text style={[s.tabLabel, activeTab === t.id && s.activeTabLabel]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* No data yet */}
        {!liveData && (
          <Card>
            <View style={s.noData}>
              <Text style={{ fontSize: 48 }}>📡</Text>
              <Text style={s.noDataTitle}>
                {connecting ? 'Connecting to device...' : 'Device Offline'}
              </Text>
              <Text style={s.noDataSub}>
                {connecting
                  ? 'Waiting for data from your ESP32 meter'
                  : 'Power on your ESP32 (plug in 5V adapter) and make sure it has WiFi'}
              </Text>
              <Text style={s.debugUrl}>{WS_URL}/api/v1/iot/ws/{account}</Text>
              <TouchableOpacity
                style={s.retryBtn}
                onPress={() => { disconnect(); setTimeout(connect, 500); }}
              >
                <Text style={s.retryTxt}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* LIVE TAB */}
        {liveData && activeTab === 'live' && (
          <>
            <Anomalies list={anomalies} />
            <Card>
              <PowerDisplay power={power} />
              <ApplianceBadge name={appliance} watts={power} />
            </Card>
            <Card title="Electrical Measurements">
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <Gauge value={voltage} max={260} label="Voltage"      unit="V"  color={COLORS.primary} />
                <Gauge value={current} max={20}  label="Current"      unit="A"  color={COLORS.secondary || '#818cf8'} />
                <Gauge value={pf}      max={1}   label="Power Factor" unit=""   color={COLORS.success} />
              </View>
            </Card>
            <Card title="Readings">
              <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                <Stat label="Frequency"    value={freq.toFixed(1)}                   unit="Hz"  color={COLORS.primary} />
                <Stat label="Session kWh"  value={d.session_kwh?.toFixed(3) || '0'}  unit="kWh" color={COLORS.success} />
                <Stat label="Session Cost" value={`Rs.${d.session_cost_rs?.toFixed(0) || '0'}`} unit="" color='#F59E0B' />
              </View>
            </Card>
            <Card>
              <PowerChart history={history} />
            </Card>
          </>
        )}

        {/* STATS TAB */}
        {liveData && activeTab === 'stats' && (
          <>
            <Card title="Session Summary">
              <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                <Stat label="Energy Used" value={d.session_kwh?.toFixed(3) || '0'} unit="kWh" color={COLORS.success} />
                <Stat label="Est. Cost"   value={`Rs.${d.session_cost_rs?.toFixed(0) || '0'}`} unit="" color='#F59E0B' />
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Stat label="Peak Power" value={Math.max(...history.map(r => r.power || 0), 0).toFixed(0)} unit="W" color={COLORS.danger} />
                <Stat label="Avg Power"  value={(history.reduce((s, r) => s + (r.power || 0), 0) / Math.max(history.length, 1)).toFixed(0)} unit="W" color={COLORS.primary} />
              </View>
            </Card>
            <Card title="Grid Quality (CEB Standard: 230V +-10%, 50Hz)">
              {[
                { label: 'Voltage',      val: `${voltage.toFixed(1)}V`, ok: voltage >= 207 && voltage <= 253 },
                { label: 'Frequency',    val: `${freq.toFixed(2)}Hz`,   ok: freq >= 49 && freq <= 51 },
                { label: 'Power Factor', val: pf.toFixed(2),            ok: pf >= 0.85 },
              ].map((row, i) => (
                <View key={i} style={s.gridRow}>
                  <Text style={s.gridLabel}>{row.label}</Text>
                  <Text style={[s.gridVal, { color: row.ok ? COLORS.success : COLORS.danger }]}>
                    {row.val} {row.ok ? 'OK' : 'WARN'}
                  </Text>
                </View>
              ))}
            </Card>
            <Card title="Apparent Power">
              <View style={{ flexDirection: 'row' }}>
                <Stat label="Apparent Power" value={d.apparent_power?.toFixed(0) || '0'} unit="VA"  color={COLORS.primary} />
                <Stat label="WiFi Signal"    value={d.wifi_rssi || '--'}                  unit="dBm" />
              </View>
            </Card>
          </>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <>
            <Card title="Appliance Change Log">
              <EventLog events={applianceEvents} />
            </Card>
            <Card title="How Detection Works">
              <Text style={s.infoTxt}>
                Appliances are detected by matching live wattage to a threshold table
                built from common Sri Lankan household appliances.
              </Text>
            </Card>
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}


// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg0 || '#0A0E1A' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 52, paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  backBtn:   { padding: 8, marginRight: 4 },
  backArrow: { color: COLORS.primary, fontSize: 22 },
  title:     { color: COLORS.textPrimary, fontSize: 20, ...FONTS.bold },
  sub:       { color: COLORS.textMuted, fontSize: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  statusTxt: { fontSize: 11, ...FONTS.bold, letterSpacing: 1 },

  // Debug bar — visible so you can confirm the URL
  debugBar: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 4,
  },
  debugTxt: { color: '#6b7280', fontSize: 10 },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.lg, padding: 4,
  },
  tab:            { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  activeTab:      { backgroundColor: COLORS.primary },
  tabEmoji:       { fontSize: 14 },
  tabLabel:       { color: COLORS.textSecondary, fontSize: 11, ...FONTS.medium, marginTop: 2 },
  activeTabLabel: { color: '#fff' },

  noData:      { alignItems: 'center', paddingVertical: SPACING.xl },
  noDataTitle: { color: COLORS.textPrimary, fontSize: 16, ...FONTS.semiBold, marginTop: 16, textAlign: 'center' },
  noDataSub:   { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  debugUrl:    { color: '#4b5563', fontSize: 10, textAlign: 'center', marginTop: 8 },
  retryBtn:    { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 99 },
  retryTxt:    { color: '#fff', ...FONTS.semiBold },

  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, ...FONTS.semiBold },
  emptySub:   { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginTop: 8 },

  gridRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.bg3 },
  gridLabel: { color: COLORS.textSecondary, fontSize: 13 },
  gridVal:   { fontSize: 14, ...FONTS.semiBold },

  infoTxt: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
});