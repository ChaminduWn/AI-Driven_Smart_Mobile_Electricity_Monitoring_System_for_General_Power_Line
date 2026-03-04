/**
 * LiveMeterScreen.jsx
 * EnergyIQ — IoT Appliance Testing Interface
 *
 * Screens:
 *  1. SCAN     — Discover online devices (MAC addresses)
 *  2. SETUP    — Enter appliance details + test duration
 *  3. MONITOR  — Live WebSocket data, rotating cards, anomaly alerts
 *  4. REPORT   — Health score, AI analysis, dataset export
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
} from 'react-native';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE  = 'http://192.168.1.105:8000/api/v1';
const WS_BASE   = 'ws://192.168.1.105:8000/api/v1';
const CARD_INTERVAL_MS = 3000;
const WS_RECONNECT_MS  = 4000;

const { width: SW } = Dimensions.get('window');

// ─── COLOUR PALETTE ──────────────────────────────────────────────────────────
const C = {
  bg:          '#0B0F1A',
  surface:     '#111827',
  card:        '#1A2235',
  border:      '#1F2D45',
  accent:      '#00D4FF',
  accentDim:   '#00D4FF33',
  green:       '#22C55E',
  yellow:      '#FBBF24',
  orange:      '#F97316',
  red:         '#EF4444',
  textPrimary: '#F0F4FF',
  textSec:     '#8899BB',
  textMuted:   '#4A5568',
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const pfColor = (pf) => {
  if (!pf) return C.textMuted;
  if (pf >= 0.95) return C.green;
  if (pf >= 0.85) return C.accent;
  if (pf >= 0.70) return C.yellow;
  return C.red;
};

const healthColor = (score) => {
  if (score >= 85) return C.green;
  if (score >= 65) return C.yellow;
  if (score >= 40) return C.orange;
  return C.red;
};

const rssiLabel = (rssi) => {
  if (rssi >= -50) return { label: 'Excellent', color: C.green };
  if (rssi >= -65) return { label: 'Good',      color: C.accent };
  if (rssi >= -75) return { label: 'Fair',       color: C.yellow };
  return               { label: 'Weak',      color: C.red };
};

const fmtDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
};

// ─── ARC GAUGE ───────────────────────────────────────────────────────────────
const ArcGauge = ({ value, min = 0, max = 100, label, unit, color }) => {
  const pct  = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct]);

  const barWidth = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={gaugeStyles.wrap}>
      <Text style={[gaugeStyles.value, { color }]}>{value != null ? value.toFixed(1) : '—'}</Text>
      <Text style={gaugeStyles.unit}>{unit}</Text>
      <View style={gaugeStyles.track}>
        <Animated.View style={[gaugeStyles.fill, { width: barWidth, backgroundColor: color }]} />
      </View>
      <Text style={gaugeStyles.label}>{label}</Text>
    </View>
  );
};

const gaugeStyles = StyleSheet.create({
  wrap:  { alignItems: 'center', width: (SW - 64) / 2 - 8, marginBottom: 4 },
  value: { fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
  unit:  { fontSize: 11, color: C.textSec, marginTop: -2, marginBottom: 6 },
  track: { width: '100%', height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: 6, borderRadius: 3 },
  label: { fontSize: 11, color: C.textMuted, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.6 },
});

// ─── RING SCORE ──────────────────────────────────────────────────────────────
const RingScore = ({ score }) => {
  const color = healthColor(score);
  return (
    <View style={ringStyles.wrap}>
      <View style={[ringStyles.ring, { borderColor: color }]}>
        <Text style={[ringStyles.score, { color }]}>{score}</Text>
        <Text style={ringStyles.outOf}>/100</Text>
      </View>
      <Text style={[ringStyles.verdict, { color }]}>
        {score >= 85 ? 'HEALTHY' : score >= 65 ? 'MONITOR' : score >= 40 ? 'DEGRADED' : 'FAULT'}
      </Text>
    </View>
  );
};

const ringStyles = StyleSheet.create({
  wrap:    { alignItems: 'center', marginVertical: 16 },
  ring:    { width: 130, height: 130, borderRadius: 65, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  score:   { fontSize: 42, fontWeight: '800' },
  outOf:   { fontSize: 13, color: C.textSec, marginTop: -4 },
  verdict: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, marginTop: 10 },
});

// ─── ANOMALY BADGE ───────────────────────────────────────────────────────────
const AnomalyBadge = ({ anomalies }) => {
  if (!anomalies || anomalies.length === 0) return null;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.00, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const icons = { LOW_VOLTAGE: '⚡', HIGH_VOLTAGE: '⚡', LOW_POWER_FACTOR: '📉', POWER_SPIKE: '🔺', FREQ_DEVIATION: '〰️' };

  return (
    <Animated.View style={[anomalyStyles.wrap, { transform: [{ scale: pulse }] }]}>
      {anomalies.slice(0, 3).map((a, i) => (
        <Text key={i} style={anomalyStyles.badge}>
          {icons[a.type] || '⚠️'} {a.message}
        </Text>
      ))}
    </Animated.View>
  );
};

const anomalyStyles = StyleSheet.create({
  wrap:  { backgroundColor: '#2D1515', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: C.red, padding: 10, marginBottom: 10 },
  badge: { color: '#FCA5A5', fontSize: 12, marginBottom: 2 },
});

// ─── LIVE DATA CARDS ─────────────────────────────────────────────────────────
const DATA_CARDS = [
  {
    id: 'power',
    title: 'Power',
    render: (d) => (
      <View style={cardStyles.row}>
        <ArcGauge value={d.power_w}      min={0} max={3000} label="Active Power" unit="W"  color={C.accent} />
        <ArcGauge value={d.power_factor} min={0} max={1}    label="Power Factor" unit="PF" color={pfColor(d.power_factor)} />
      </View>
    ),
  },
  {
    id: 'voltage',
    title: 'Voltage & Current',
    render: (d) => (
      <View style={cardStyles.row}>
        <ArcGauge value={d.voltage}   min={180} max={260} label="Voltage" unit="V" color={C.green} />
        <ArcGauge value={d.current_a} min={0}   max={16}  label="Current" unit="A" color={C.yellow} />
      </View>
    ),
  },
  {
    id: 'env',
    title: 'Environment (DHT22)',
    render: (d) => (
      <View style={cardStyles.row}>
        <ArcGauge value={d.temperature_c} min={0}  max={60}  label="Temperature" unit="°C" color={C.orange} />
        <ArcGauge value={d.humidity_pct}  min={0}  max={100} label="Humidity"    unit="%"  color={C.accent} />
      </View>
    ),
  },
  {
    id: 'session',
    title: 'Session Totals',
    render: (d) => (
      <View style={cardStyles.row}>
        <ArcGauge value={d.session_kwh}     min={0} max={5}   label="Session kWh" unit="kWh" color={C.green} />
        <ArcGauge value={d.session_cost_rs} min={0} max={200} label="Cost"        unit="Rs"  color={C.yellow} />
      </View>
    ),
  },
  {
    id: 'quality',
    title: 'Power Quality',
    render: (d) => (
      <View style={cardStyles.row}>
        <ArcGauge value={d.power_quality_score} min={0}  max={100} label="PQ Score"  unit="/100" color={C.accent} />
        <ArcGauge value={d.frequency_hz}        min={48} max={52}  label="Frequency" unit="Hz"   color={C.green} />
      </View>
    ),
  },
  {
    id: 'device',
    title: 'Device Signal',
    render: (d) => {
      const r = rssiLabel(d.wifi_rssi);
      return (
        <View style={cardStyles.centerCol}>
          <Text style={[cardStyles.bigLabel, { color: r.color }]}>{r.label}</Text>
          <Text style={cardStyles.bigSub}>{d.wifi_rssi} dBm  ·  {d.detected_appliance || 'Standby'}</Text>
        </View>
      );
    },
  },
];

const cardStyles = StyleSheet.create({
  row:       { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingVertical: 8 },
  centerCol: { alignItems: 'center', paddingVertical: 20 },
  bigLabel:  { fontSize: 30, fontWeight: '700' },
  bigSub:    { color: C.textSec, fontSize: 13, marginTop: 6 },
});

// ─── SCREEN: SCAN ─────────────────────────────────────────────────────────────
const ScanScreen = ({ account, onSelect }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  const scan = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/iot/devices`);
      const data = await res.json();
      setDevices(data.devices || []);
    } catch {
      Alert.alert('Network Error', 'Could not reach the EnergyIQ server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { scan(); }, []);

  return (
    <View style={ss.flex}>
      <Text style={ss.title}>Scan Devices</Text>
      <Text style={ss.sub}>Select an EnergyIQ tester to begin</Text>

      {loading ? (
        <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
      ) : devices.length === 0 ? (
        <View style={ss.empty}>
          <Text style={ss.emptyIcon}>📡</Text>
          <Text style={ss.emptyText}>No devices online</Text>
          <Text style={ss.emptySub}>Ensure the tester is powered and connected to WiFi</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.device_id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={ss.deviceCard} onPress={() => onSelect(item.device_id)}>
              <View style={ss.deviceLeft}>
                <View style={[ss.dot, { backgroundColor: item.online ? C.green : C.red }]} />
                <View>
                  <Text style={ss.deviceId}>{item.device_id}</Text>
                  <Text style={ss.deviceMeta}>
                    {item.online ? 'Online' : 'Offline'} · Last seen {item.last_seen_ago || '—'}
                  </Text>
                </View>
              </View>
              <Text style={ss.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={ss.refreshBtn} onPress={scan}>
        <Text style={ss.refreshTxt}>↻  Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── SCREEN: SETUP ────────────────────────────────────────────────────────────
const SetupScreen = ({ account, deviceId, onStart, onBack }) => {
  const [form, setForm] = useState({
    appliance_name:        '',
    appliance_brand:       '',
    appliance_description: '',
    test_duration_min:     '15',
  });
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const startSession = async () => {
    if (!form.appliance_name.trim()) {
      Alert.alert('Required', 'Please enter the appliance name.');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/iot/sessions`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          device_id:        deviceId,
          account_number:   account,
          ...form,
          test_duration_min: parseInt(form.test_duration_min, 10) || 15,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to start session');
      onStart(data.session_id, form.appliance_name);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const DURATION_OPTS = ['5', '10', '15', '30', '60'];

  return (
    <ScrollView style={ss.flex} contentContainerStyle={su.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={onBack} style={su.backBtn}>
        <Text style={su.backTxt}>‹ Back</Text>
      </TouchableOpacity>
      <Text style={ss.title}>New Test Session</Text>
      <Text style={ss.sub}>Device: <Text style={{ color: C.accent }}>{deviceId}</Text></Text>

      <View style={su.group}>
        <Text style={su.label}>Appliance Name *</Text>
        <TextInput
          style={su.input}
          value={form.appliance_name}
          onChangeText={set('appliance_name')}
          placeholder="e.g. Samsung Refrigerator"
          placeholderTextColor={C.textMuted}
        />
      </View>
      <View style={su.group}>
        <Text style={su.label}>Brand / Model</Text>
        <TextInput
          style={su.input}
          value={form.appliance_brand}
          onChangeText={set('appliance_brand')}
          placeholder="e.g. RT28 No-Frost"
          placeholderTextColor={C.textMuted}
        />
      </View>
      <View style={su.group}>
        <Text style={su.label}>Description</Text>
        <TextInput
          style={[su.input, { height: 72, textAlignVertical: 'top' }]}
          value={form.appliance_description}
          onChangeText={set('appliance_description')}
          placeholder="e.g. 5 years old, bottom freezer"
          placeholderTextColor={C.textMuted}
          multiline
        />
      </View>

      <View style={su.group}>
        <Text style={su.label}>Test Duration (minutes)</Text>
        <View style={su.chipRow}>
          {DURATION_OPTS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[su.chip, form.test_duration_min === d && su.chipActive]}
              onPress={() => set('test_duration_min')(d)}
            >
              <Text style={[su.chipTxt, form.test_duration_min === d && su.chipTxtActive]}>{d} min</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={[ss.primaryBtn, loading && { opacity: 0.6 }]} onPress={startSession} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#000" />
          : <Text style={ss.primaryBtnTxt}>▶  Start Test</Text>
        }
      </TouchableOpacity>
      <Text style={su.hint}>Plug the appliance into the tester after tapping Start</Text>
    </ScrollView>
  );
};

// ─── SCREEN: MONITOR ─────────────────────────────────────────────────────────
const MonitorScreen = ({ account, deviceId, sessionId, applianceName, onSessionEnd, onStop }) => {
  const [liveData,    setLiveData]    = useState(null);
  const [anomalies,   setAnomalies]   = useState([]);
  const [sessionInfo, setSessionInfo] = useState({ readings: 0, elapsed: 0 });
  const [cardIndex,   setCardIndex]   = useState(0);
  const [connected,   setConnected]   = useState(false);
  const [events,      setEvents]      = useState([]);
  const [stopping,    setStopping]    = useState(false);

  const wsRef        = useRef(null);
  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const elapsedRef   = useRef(0);

  // Elapsed clock
  useEffect(() => {
    const t = setInterval(() => {
      elapsedRef.current += 1;
      setSessionInfo((s) => ({ ...s, elapsed: elapsedRef.current }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Card rotation with fade
  useEffect(() => {
    const t = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      setCardIndex((i) => (i + 1) % DATA_CARDS.length);
    }, CARD_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  // WebSocket
  const connectWs = useCallback(() => {
    const url = `${WS_BASE}/iot/ws/${account}?device_id=${deviceId}`;
    const ws  = new WebSocket(url);

    ws.onopen  = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setTimeout(connectWs, WS_RECONNECT_MS);
    };
    ws.onerror = () => ws.close();

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'live_reading' || msg.type === 'snapshot') {
          const d = msg.data?.latest || msg.data;
          if (d) {
            setLiveData(d);
            setAnomalies(d.anomalies || []);
            setSessionInfo((s) => ({ ...s, readings: d.read_count || s.readings }));
          }
        } else if (msg.type === 'appliance_event') {
          setEvents((prev) => [msg.data, ...prev].slice(0, 8));
        } else if (msg.type === 'session_ended') {
          onSessionEnd(msg.data);
        }
      } catch {}
    };

    wsRef.current = ws;
  }, [deviceId, onSessionEnd]);

  useEffect(() => {
    connectWs();
    return () => wsRef.current?.close();
  }, [connectWs]);

  const stopSession = async () => {
    setStopping(true);
    try {
      await fetch(`${API_BASE}/iot/sessions/${account}/${sessionId}/end`, { method: 'POST' });
    } catch {
      Alert.alert('Session Ended', 'The session has been stopped.');
      onStop();
    } finally {
      setStopping(false);
    }
  };

  const currentCard = DATA_CARDS[cardIndex];

  return (
    <ScrollView style={ss.flex} contentContainerStyle={mn.container}>
      {/* Header */}
      <View style={mn.header}>
        <View>
          <Text style={mn.appName}>{applianceName}</Text>
          <Text style={mn.sessionMeta}>
            {fmtDuration(sessionInfo.elapsed)}  ·  {sessionInfo.readings} readings
          </Text>
        </View>
        <View style={[mn.statusPill, { backgroundColor: connected ? '#0F2D1A' : '#2D1515' }]}>
          <View style={[mn.dot, { backgroundColor: connected ? C.green : C.red }]} />
          <Text style={[mn.statusTxt, { color: connected ? C.green : C.red }]}>{connected ? 'LIVE' : 'OFFLINE'}</Text>
        </View>
      </View>

      {/* Anomaly alerts */}
      {anomalies.length > 0 && <AnomalyBadge anomalies={anomalies} />}

      {/* Rotating data card */}
      <View style={mn.cardWrap}>
        <View style={mn.cardDots}>
          {DATA_CARDS.map((c, i) => (
            <TouchableOpacity key={c.id} onPress={() => setCardIndex(i)}>
              <View style={[mn.dot2, i === cardIndex && { backgroundColor: C.accent }]} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={mn.cardTitle}>{currentCard.title}</Text>
        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          {liveData ? currentCard.render(liveData) : (
            <View style={mn.waitingWrap}>
              <ActivityIndicator color={C.accent} />
              <Text style={mn.waitingTxt}>Waiting for data…</Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Quick stats strip */}
      {liveData && (
        <View style={mn.strip}>
          {[
            { label: 'Peak',   val: `${(liveData.peak_power_w || 0).toFixed(0)} W` },
            { label: 'Avg',    val: `${(liveData.avg_power_w  || 0).toFixed(0)} W` },
            { label: 'PQ',     val: `${(liveData.power_quality_score || 0).toFixed(0)}/100` },
            { label: 'kWh',    val: `${(liveData.session_kwh || 0).toFixed(3)}` },
          ].map((s) => (
            <View key={s.label} style={mn.stripItem}>
              <Text style={mn.stripVal}>{s.val}</Text>
              <Text style={mn.stripLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Appliance events */}
      {events.length > 0 && (
        <View style={mn.eventsWrap}>
          <Text style={mn.eventsTitle}>Appliance Events</Text>
          {events.map((ev, i) => (
            <Text key={i} style={mn.eventRow}>
              {ev.from_appliance} <Text style={{ color: C.textSec }}>→</Text> <Text style={{ color: C.accent }}>{ev.to_appliance}</Text>{'  '}{ev.watts?.toFixed(0)} W
            </Text>
          ))}
        </View>
      )}

      {/* Stop */}
      <TouchableOpacity style={[mn.stopBtn, stopping && { opacity: 0.6 }]} onPress={stopSession} disabled={stopping}>
        {stopping
          ? <ActivityIndicator color={C.red} />
          : <Text style={mn.stopTxt}>■  Stop &amp; Analyse</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── SCREEN: HEALTH REPORT ───────────────────────────────────────────────────
const ReportScreen = ({ account, sessionData, onNewTest }) => {
  const [exporting, setExporting] = useState(false);

  const health = sessionData?.health_assessment || {};
  const ai     = sessionData?.ai_analysis       || {};
  const stats  = sessionData                    || {};

  const doExport = async (fmt) => {
    setExporting(true);
    try {
      const url  = `${API_BASE}/iot/sessions/${account}/${stats.id}/export?format=${fmt}`;
      const res  = await fetch(url);
      const data = await res.json();
      Alert.alert('Export Ready', `Dataset exported as ${fmt.toUpperCase()} (${data.count} readings)`);
    } catch {
      Alert.alert('Export Failed', 'Could not export dataset.');
    } finally {
      setExporting(false);
    }
  };

  const SEV_COLOR = { HIGH: C.red, MEDIUM: C.orange, LOW: C.yellow, INFO: C.accent };

  return (
    <ScrollView style={ss.flex} contentContainerStyle={rp.container}>
      <Text style={ss.title}>Health Report</Text>
      <Text style={ss.sub}>
        {stats.appliance_name}
        {stats.appliance_brand ? ` · ${stats.appliance_brand}` : ''}
        {stats.actual_duration_min ? `  ·  ${parseFloat(stats.actual_duration_min).toFixed(0)} min` : ''}
      </Text>

      {/* Score ring */}
      <RingScore score={health.health_score ?? 0} />

      {/* Stats grid */}
      <View style={rp.statsRow}>
        {[
          { label: 'Avg Power',  val: `${(stats.avg_power_w  || 0).toFixed(0)} W` },
          { label: 'Peak Power', val: `${(stats.peak_power_w || 0).toFixed(0)} W` },
          { label: 'Avg PF',     val: (stats.avg_power_factor || 0).toFixed(2) },
          { label: 'Total kWh',  val: (stats.total_session_kwh || 0).toFixed(3) },
          { label: 'Cost',       val: `Rs ${(stats.total_cost_rs || 0).toFixed(2)}` },
          { label: 'Readings',   val: `${stats.total_readings || 0}` },
        ].map((s) => (
          <View key={s.label} style={rp.statCell}>
            <Text style={rp.statVal}>{s.val}</Text>
            <Text style={rp.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Issues */}
      {health.issues?.length > 0 && (
        <View style={rp.section}>
          <Text style={rp.sectionTitle}>⚠  Issues Detected</Text>
          {health.issues.map((issue, i) => (
            <View key={i} style={[rp.issueRow, { borderLeftColor: SEV_COLOR[issue.severity] || C.yellow }]}>
              <Text style={[rp.issueSev, { color: SEV_COLOR[issue.severity] }]}>{issue.severity}</Text>
              <Text style={rp.issueTxt}>{issue.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* AI Summary */}
      {ai.summary && (
        <View style={rp.section}>
          <Text style={rp.sectionTitle}>🤖  AI Analysis</Text>
          <Text style={rp.bodyTxt}>{ai.summary}</Text>
        </View>
      )}

      {/* Comparison */}
      {health.comparison_note && (
        <View style={rp.section}>
          <Text style={rp.sectionTitle}>📊  vs Typical Appliance</Text>
          <Text style={rp.bodyTxt}>{health.comparison_note}</Text>
          {health.deviation_pct != null && (
            <Text style={[rp.deviation, { color: Math.abs(health.deviation_pct) < 20 ? C.green : C.orange }]}>
              {health.deviation_pct > 0 ? '+' : ''}{health.deviation_pct.toFixed(1)}% vs typical
            </Text>
          )}
        </View>
      )}

      {/* Recommendations */}
      {ai.recommendations?.length > 0 && (
        <View style={rp.section}>
          <Text style={rp.sectionTitle}>✅  Recommendations</Text>
          {ai.recommendations.map((r, i) => (
            <View key={i} style={rp.recRow}>
              <Text style={rp.recBullet}>›</Text>
              <Text style={rp.recTxt}>{r}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Service flag */}
      {health.service_recommended != null && (
        <View style={[rp.serviceFlag, { backgroundColor: health.service_recommended ? '#2D1515' : '#0F2D1A' }]}>
          <Text style={[rp.serviceTxt, { color: health.service_recommended ? C.red : C.green }]}>
            {health.service_recommended
              ? '🔧  Professional service recommended'
              : '✓  No service required at this time'}
          </Text>
        </View>
      )}

      {/* Export */}
      <View style={rp.section}>
        <Text style={rp.sectionTitle}>📤  Export Dataset</Text>
        <Text style={rp.exportHint}>{stats.total_readings} readings available for ML training</Text>
        <View style={rp.exportRow}>
          <TouchableOpacity style={rp.exportBtn} onPress={() => doExport('json')} disabled={exporting}>
            <Text style={rp.exportTxt}>{exporting ? '…' : 'JSON'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={rp.exportBtn} onPress={() => doExport('csv')} disabled={exporting}>
            <Text style={rp.exportTxt}>{exporting ? '…' : 'CSV'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={ss.primaryBtn} onPress={onNewTest}>
        <Text style={ss.primaryBtnTxt}>+ New Test</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────
const LiveMeterScreen = () => {
  const [account,       setAccount]       = useState(null);
  const [screen,        setScreen]        = useState('SCAN');
  const [deviceId,      setDeviceId]      = useState(null);
  const [sessionId,     setSessionId]     = useState(null);
  const [applianceName, setApplianceName] = useState('');
  const [reportData,    setReportData]    = useState(null);

  // Load account number from AsyncStorage once on mount
  useEffect(() => {
    AsyncStorage.getItem('account_number').then((val) => {
      if (val) setAccount(val);
    });
  }, []);

  // Don't render anything until account is loaded
  if (!account) {
    return (
      <View style={[ss.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={C.accent} />
        <Text style={{ color: C.textMuted, marginTop: 12, fontSize: 13 }}>Loading account…</Text>
      </View>
    );
  }

  return (
    <View style={ss.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={ss.topBar}>
        <Text style={ss.topBarTitle}>⚡ EnergyIQ Tester</Text>
        <Text style={ss.topBarStep}>
          {screen === 'SCAN' ? '1 / 4  Scan' : screen === 'SETUP' ? '2 / 4  Setup' : screen === 'MONITOR' ? '3 / 4  Live' : '4 / 4  Report'}
        </Text>
      </View>

      {screen === 'SCAN' && (
        <ScanScreen
          account={account}
          onSelect={(id) => { setDeviceId(id); setScreen('SETUP'); }}
        />
      )}
      {screen === 'SETUP' && deviceId && (
        <SetupScreen
          account={account}
          deviceId={deviceId}
          onStart={(sid, name) => { setSessionId(sid); setApplianceName(name); setScreen('MONITOR'); }}
          onBack={() => setScreen('SCAN')}
        />
      )}
      {screen === 'MONITOR' && sessionId && (
        <MonitorScreen
          account={account}
          deviceId={deviceId}
          sessionId={sessionId}
          applianceName={applianceName}
          onSessionEnd={(data) => { setReportData(data); setScreen('REPORT'); }}
          onStop={() => { setSessionId(null); setScreen('SCAN'); }}
        />
      )}
      {screen === 'REPORT' && reportData && (
        <ReportScreen
          account={account}
          sessionData={reportData}
          onNewTest={() => { setReportData(null); setSessionId(null); setScreen('SCAN'); }}
        />
      )}
    </View>
  );
};

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  flex:          { flex: 1, backgroundColor: C.bg },
  topBar:        {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 14,
    paddingTop: Platform.OS === 'ios' ? 54 : 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  topBarTitle:   { color: C.textPrimary, fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },
  topBarStep:    { color: C.textMuted,   fontSize: 12 },
  title:         { color: C.textPrimary, fontSize: 22, fontWeight: '700', paddingHorizontal: 20, paddingTop: 20, marginBottom: 4 },
  sub:           { color: C.textSec,     fontSize: 13, paddingHorizontal: 20, marginBottom: 16 },
  primaryBtn:    { marginHorizontal: 20, marginVertical: 16, backgroundColor: C.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnTxt: { color: '#000', fontWeight: '700', fontSize: 15 },
  deviceCard:    { backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.border },
  deviceLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot:           { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  deviceId:      { color: C.textPrimary, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  deviceMeta:    { color: C.textSec, fontSize: 12, marginTop: 2 },
  chevron:       { color: C.textMuted, fontSize: 22 },
  refreshBtn:    { margin: 20, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  refreshTxt:    { color: C.textSec, fontSize: 14 },
  empty:         { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIcon:     { fontSize: 44, marginBottom: 12 },
  emptyText:     { color: C.textPrimary, fontSize: 17, fontWeight: '600' },
  emptySub:      { color: C.textSec, fontSize: 13, textAlign: 'center', marginTop: 6 },
});

const su = StyleSheet.create({
  container:    { padding: 20, paddingBottom: 40 },
  backBtn:      { marginBottom: 4 },
  backTxt:      { color: C.accent, fontSize: 14 },
  group:        { marginBottom: 16 },
  label:        { color: C.textSec, fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:        { backgroundColor: C.card, color: C.textPrimary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, borderWidth: 1, borderColor: C.border },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipActive:   { backgroundColor: C.accentDim, borderColor: C.accent },
  chipTxt:      { color: C.textSec,  fontSize: 13 },
  chipTxtActive:{ color: C.accent,   fontSize: 13, fontWeight: '600' },
  hint:         { color: C.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 },
});

const mn = StyleSheet.create({
  container:   { padding: 16, paddingBottom: 40 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  appName:     { color: C.textPrimary, fontSize: 18, fontWeight: '700' },
  sessionMeta: { color: C.textSec, fontSize: 12, marginTop: 3 },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dot:         { width: 7, height: 7, borderRadius: 4 },
  statusTxt:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  cardWrap:    { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  cardDots:    { flexDirection: 'row', gap: 6, marginBottom: 10 },
  dot2:        { width: 7, height: 7, borderRadius: 4, backgroundColor: C.border },
  cardTitle:   { color: C.textSec, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  waitingWrap: { alignItems: 'center', paddingVertical: 24 },
  waitingTxt:  { color: C.textMuted, marginTop: 10, fontSize: 13 },
  strip:       { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  stripItem:   { flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: 1, borderRightColor: C.border },
  stripVal:    { color: C.textPrimary, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  stripLabel:  { color: C.textMuted,   fontSize: 10, marginTop: 2 },
  eventsWrap:  { backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  eventsTitle: { color: C.textSec, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  eventRow:    { color: C.textSec, fontSize: 12, marginBottom: 5 },
  stopBtn:     { borderWidth: 1.5, borderColor: C.red, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  stopTxt:     { color: C.red, fontWeight: '700', fontSize: 15 },
});

const rp = StyleSheet.create({
  container:   { padding: 20, paddingBottom: 40 },
  statsRow:    { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 10 },
  statCell:    { width: '33.33%', alignItems: 'center', paddingVertical: 14, borderRightWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  statVal:     { color: C.textPrimary, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel:   { color: C.textMuted,   fontSize: 10, marginTop: 2 },
  section:     { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  sectionTitle:{ color: C.textSec, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 },
  issueRow:    { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 8 },
  issueSev:    { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  issueTxt:    { color: C.textPrimary, fontSize: 13, lineHeight: 19 },
  bodyTxt:     { color: C.textPrimary, fontSize: 14, lineHeight: 22 },
  deviation:   { fontSize: 17, fontWeight: '700', marginTop: 8 },
  recRow:      { flexDirection: 'row', gap: 8, marginBottom: 6 },
  recBullet:   { color: C.accent, fontSize: 16 },
  recTxt:      { color: C.textPrimary, fontSize: 13, flex: 1, lineHeight: 20 },
  serviceFlag: { borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center' },
  serviceTxt:  { fontSize: 14, fontWeight: '600' },
  exportHint:  { color: C.textSec, fontSize: 12, marginBottom: 10 },
  exportRow:   { flexDirection: 'row', gap: 10 },
  exportBtn:   { flex: 1, backgroundColor: C.accentDim, borderRadius: 10, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: C.accent },
  exportTxt:   { color: C.accent, fontWeight: '600', fontSize: 14 },
});

export default LiveMeterScreen;