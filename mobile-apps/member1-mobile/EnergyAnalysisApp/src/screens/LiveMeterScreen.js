/**
 * LiveMeterScreen.jsx  — EnergyIQ Appliance Tester (FIXED v3)
 *
 * Fixes applied:
 *  ✅ RelayControlCard imported and wired into MonitorScreen
 *  ✅ getToken passed correctly to RelayControlCard
 *  ✅ WebSocket reconnect loop fixed — no rapid open/close spam
 *  ✅ Polling fallback when WS disconnects (every 3s via /iot/latest/:device_id)
 *  ✅ Stop button: POST to end session, then POLL /sessions/:id until completed
 *  ✅ All live metrics shown: power, voltage, current, PF, PQ, env, session stats
 *  ✅ Temperature/humidity displayed correctly (temperature_c, humidity_pct)
 *  ✅ Download JSON/CSV — actual file download via expo-file-system
 *  ✅ Report screen shown after stop, even if WS session_ended never arrives
 *  ✅ Custom duration input alongside preset chips (any minutes user wants)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Animated, Dimensions, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { StorageManager } from '../utils/storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { API_BASE, WS_BASE } from '../config';
import RelayControlCard from '../components/RelayControlCard';

const POLL_INTERVAL_MS = 3000;
const WS_RECONNECT_MS = 6000;
const { width: SW } = Dimensions.get('window');

// ─── AUTH ─────────────────────────────────────────────────────────────────────
let _cachedToken = null;
let _cachedAccount = null;

const _getFromStorage = async (key) => {
  try {
    const AS = require('@react-native-async-storage/async-storage').default;
    const v = await AS.getItem(key);
    if (v) return v;
  } catch { }
  
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key); } catch { }
  }
  return null;
};

const loadAuth = async () => {
  _cachedToken = await _getFromStorage('accessToken') || '';
  let acct = await _getFromStorage('selectedAccount');
  if (!acct) {
    try {
      const uStr = await _getFromStorage('user');
      if (uStr) {
        const uObj = JSON.parse(uStr);
        acct = uObj.default_account_number || uObj.account_number;
      }
    } catch { }
  }
  if (!acct) {
    try {
      const raw = await _getFromStorage('accounts');
      const arr = JSON.parse(raw || '[]');
      if (arr.length) acct = arr[0];
    } catch { }
  }
  _cachedAccount = acct || '';
  return { token: _cachedToken, account: _cachedAccount };
};

const getToken = () => _cachedToken || '';
const getAccount = () => _cachedAccount || '';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

// ─── COLOURS ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#0B0F1A',
  card: '#1A2235',
  border: '#1F2D45',
  accent: '#00D4FF',
  accentDim: '#00D4FF22',
  green: '#22C55E',
  yellow: '#FBBF24',
  orange: '#F97316',
  red: '#EF4444',
  purple: '#A855F7',
  teal: '#14B8A6',
  textPrimary: '#F0F4FF',
  textSec: '#8899BB',
  textMuted: '#4A5568',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const pfColor = pf => pf >= 0.95 ? C.green : pf >= 0.85 ? C.accent : pf >= 0.70 ? C.yellow : C.red;
const hColor = s => s >= 85 ? C.green : s >= 65 ? C.yellow : s >= 40 ? C.orange : C.red;
const fmtSecs = s => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
const fmtF = (v, d = 1) => v != null && !isNaN(v) ? Number(v).toFixed(d) : '—';
const safe = v => v != null && !isNaN(Number(v)) ? Number(v) : null;

// ─── FILE DOWNLOAD HELPER ─────────────────────────────────────────────────────
const downloadFile = async (content, filename, mimeType) => {
  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    } catch (webErr) {
      console.warn('Web Download Error:', webErr);
    }
  }

  if (Platform.OS === 'android') {
    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri, filename, mimeType
        );
        await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
        Alert.alert('✅ Download Complete', 'The report has been saved to your selected folder.');
        return true;
      }
    } catch (safErr) {
      console.warn('SAF Error:', safErr);
    }
  }

  try {
    const path = FileSystem.cacheDirectory + filename;
    await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType,
        UTI: mimeType === 'text/csv' ? 'public.comma-separated-values-text' : 'public.json',
        dialogTitle: 'Download Report',
      });
      return true;
    } else {
      Alert.alert('Saved', `Report saved to app cache:\n${filename}`);
    }
  } catch (err) {
    Alert.alert('Download Error', `Could not save file: ${err.message}`);
  }
  return false;
};

// ─── ANIMATED PROGRESS BAR ───────────────────────────────────────────────────
const RainbowBar = ({ pct }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: Math.min(1, pct), duration: 800, useNativeDriver: false }).start();
  }, [pct]);
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: false })
    ).start();
  }, []);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const color = anim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [C.accent, C.green, C.yellow, C.orange],
  });
  return (
    <View style={rb.track}>
      <Animated.View style={[rb.fill, { width, backgroundColor: color }]}>
        <Animated.View style={[rb.shimmer, {
          left: shimmer.interpolate({ inputRange: [0, 1], outputRange: ['-30%', '130%'] })
        }]} />
      </Animated.View>
    </View>
  );
};
const rb = StyleSheet.create({
  track: { height: 10, backgroundColor: '#1F2D45', borderRadius: 5, overflow: 'hidden', marginVertical: 6 },
  fill: { height: 10, borderRadius: 5, overflow: 'hidden' },
  shimmer: {
    position: 'absolute', top: 0, width: '30%', height: '100%',
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 5
  },
});

// ─── GAUGE ────────────────────────────────────────────────────────────────────
const Gauge = ({ value, min = 0, max = 100, label, unit, color }) => {
  const pct = Math.min(1, Math.max(0, ((value ?? 0) - min) / (max - min)));
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct]);
  const w = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={g.wrap}>
      <Text style={[g.val, { color: color || C.accent }]}>{fmtF(value)}</Text>
      <Text style={g.unit}>{unit}</Text>
      <View style={g.track}>
        <Animated.View style={[g.fill, { width: w, backgroundColor: color || C.accent }]} />
      </View>
      <Text style={g.label}>{label}</Text>
    </View>
  );
};
const g = StyleSheet.create({
  wrap: { alignItems: 'center', width: (SW - 64) / 2 - 8 },
  val: { fontSize: 26, fontWeight: '700' },
  unit: { fontSize: 11, color: C.textSec, marginBottom: 5 },
  track: { width: '100%', height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  label: { fontSize: 10, color: C.textMuted, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.6 },
});

// ─── HEALTH RING ──────────────────────────────────────────────────────────────
const HealthRing = ({ score }) => {
  const c = hColor(score);
  const label = score >= 85 ? 'HEALTHY' : score >= 65 ? 'MONITOR' : score >= 40 ? 'DEGRADED' : 'FAULT';
  return (
    <View style={hr.wrap}>
      <View style={[hr.ring, { borderColor: c }]}>
        <Text style={[hr.score, { color: c }]}>{score ?? '—'}</Text>
        <Text style={hr.sub}>/100</Text>
      </View>
      <Text style={[hr.label, { color: c }]}>{label}</Text>
    </View>
  );
};
const hr = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 12 },
  ring: { width: 120, height: 120, borderRadius: 60, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 38, fontWeight: '800' },
  sub: { fontSize: 12, color: C.textSec, marginTop: -2 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginTop: 8 },
});

// ─── ANOMALY BANNER ───────────────────────────────────────────────────────────
const AnomalyBanner = ({ anomalies }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.03, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulse, { toValue: 1.00, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
    ])).start();
  }, []);
  if (!anomalies?.length) return null;
  const ICONS = {
    LOW_VOLTAGE: '⚡', HIGH_VOLTAGE: '⚡', LOW_PF: '📉', CRITICAL_LOW_PF: '🔴',
    POWER_SPIKE: '🔺', FREQ_DEVIATION: '〰️'
  };
  return (
    <Animated.View style={[ab.wrap, { transform: [{ scale: pulse }] }]}>
      {anomalies.slice(0, 3).map((a, i) => {
        const key = typeof a === 'string' ? a.split(':')[0] : a?.type;
        const msg = typeof a === 'string' ? a : a?.message || String(a);
        return <Text key={i} style={ab.row}>{ICONS[key] || '⚠️'} {msg}</Text>;
      })}
    </Animated.View>
  );
};
const ab = StyleSheet.create({
  wrap: {
    backgroundColor: '#2D1515', borderRadius: 10, borderLeftWidth: 3,
    borderLeftColor: C.red, padding: 10, marginBottom: 10
  },
  row: { color: '#FCA5A5', fontSize: 12, marginBottom: 2 },
});

// ─── METRIC ROW ───────────────────────────────────────────────────────────────
const MetricRow = ({ items }) => (
  <View style={mr.row}>
    {items.map(({ label, value, unit, color }, i) => (
      <View key={i} style={mr.cell}>
        <Text style={[mr.val, { color: color || C.textPrimary }]}>{value}</Text>
        {unit ? <Text style={mr.unit}>{unit}</Text> : null}
        <Text style={mr.label}>{label}</Text>
      </View>
    ))}
  </View>
);
const mr = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 8 },
  cell: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRightWidth: 1, borderColor: C.border
  },
  val: { fontSize: 16, fontWeight: '700' },
  unit: { fontSize: 10, color: C.textSec },
  label: { fontSize: 9, color: C.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
});

// ─── STAT CHIP ────────────────────────────────────────────────────────────────
const StatChip = ({ label, value, color }) => (
  <View style={sc.wrap}>
    <Text style={[sc.val, { color: color || C.textPrimary }]}>{value}</Text>
    <Text style={sc.label}>{label}</Text>
  </View>
);
const sc = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRightWidth: 1, borderColor: C.border
  },
  val: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 10, color: C.textMuted, marginTop: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 1 — SCAN
// ─────────────────────────────────────────────────────────────────────────────
const ScanScreen = ({ onSelect }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  const scan = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/iot/devices`, { headers: authHeaders() });
      const d = await r.json();
      setDevices(d.devices || []);
    } catch {
      Alert.alert('Network Error', 'Cannot reach EnergyIQ server.\nCheck Wi-Fi and server address.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { scan(); }, []);

  return (
    <View style={s.flex}>
      <Text style={s.title}>Select Device</Text>
      <Text style={s.sub}>Tap an EnergyIQ tester to start</Text>
      {loading
        ? <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
        : devices.length === 0
          ? <View style={s.empty}>
            <Text style={{ fontSize: 48 }}>📡</Text>
            <Text style={s.emptyH}>No devices online</Text>
            <Text style={s.emptySub}>Power on the tester and connect to Wi-Fi</Text>
          </View>
          : <FlatList data={devices} keyExtractor={i => i.device_id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.devCard} onPress={() => onSelect(item.device_id)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[s.dot, { backgroundColor: item.online ? C.green : C.red }]} />
                  <View>
                    <Text style={s.devId}>{item.device_id}</Text>
                    <Text style={s.devMeta}>
                      {item.online ? '● Online' : '○ Offline'}  ·  {item.last_seen_ago || '—'}
                      {item.power_w ? `  ·  ${Number(item.power_w).toFixed(0)}W` : ''}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: C.textMuted, fontSize: 20 }}>›</Text>
              </TouchableOpacity>
            )} />
      }
      <TouchableOpacity style={s.outlineBtn} onPress={scan}>
        <Text style={s.outlineTxt}>↻  Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 2 — SETUP
// ─────────────────────────────────────────────────────────────────────────────
const SetupScreen = ({ account, deviceId, onStart, onBack }) => {
  const [form, setForm] = useState({
    appliance_name: '', appliance_brand: '', appliance_description: '', test_duration_min: '15',
  });
  const [customDuration, setCustomDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const selectPreset = (val) => {
    set('test_duration_min')(val);
    setCustomDuration('');
  };

  const onCustomChange = (val) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setCustomDuration(cleaned);
    if (cleaned) {
      set('test_duration_min')('custom');
    } else {
      set('test_duration_min')('15');
    }
  };

  const resolvedMinutes = () => {
    if (form.test_duration_min === 'custom') {
      return parseInt(customDuration) || 15;
    }
    return parseInt(form.test_duration_min) || 15;
  };

  const start = async () => {
    if (!form.appliance_name.trim()) { Alert.alert('Required', 'Enter the appliance name'); return; }
    const mins = resolvedMinutes();
    if (mins < 1 || mins > 1440) {
      Alert.alert('Invalid Duration', 'Please enter a duration between 1 and 1440 minutes.');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/iot/sessions`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          device_id: deviceId,
          account_number: account || getAccount(),
          appliance_name: form.appliance_name,
          appliance_brand: form.appliance_brand,
          appliance_description: form.appliance_description,
          test_duration_min: mins,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Failed');
      onStart(d.session_id, form.appliance_name, mins);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const DURATIONS = ['5', '10', '15', '30', '60'];

  return (
    <ScrollView style={s.flex} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={onBack}><Text style={s.back}>‹ Back</Text></TouchableOpacity>
      <Text style={s.title}>New Test Session</Text>
      <Text style={s.sub}>Device: <Text style={{ color: C.accent }}>{deviceId}</Text></Text>

      {[
        { key: 'appliance_name', label: 'Appliance Name *', ph: 'e.g. Samsung Refrigerator' },
        { key: 'appliance_brand', label: 'Brand / Model', ph: 'e.g. RT28 No-Frost' },
      ].map(({ key, label, ph }) => (
        <View key={key} style={{ marginBottom: 14 }}>
          <Text style={s.inputLabel}>{label}</Text>
          <TextInput style={s.input} value={form[key]} onChangeText={set(key)}
            placeholder={ph} placeholderTextColor={C.textMuted} />
        </View>
      ))}

      <View style={{ marginBottom: 14 }}>
        <Text style={s.inputLabel}>Description</Text>
        <TextInput style={[s.input, { height: 64, textAlignVertical: 'top' }]}
          value={form.appliance_description} onChangeText={set('appliance_description')}
          placeholder="e.g. 5 years old, side-by-side" placeholderTextColor={C.textMuted} multiline />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={s.inputLabel}>Test Duration (minutes)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {DURATIONS.map(d => {
            const isActive = form.test_duration_min === d;
            return (
              <TouchableOpacity key={d}
                style={[s.chip, isActive && s.chipActive]}
                onPress={() => selectPreset(d)}>
                <Text style={[s.chipTxt, isActive && { color: C.accent, fontWeight: '700' }]}>
                  {d} min
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
          <Text style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>OR ENTER CUSTOM</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
        </View>

        <View style={su.customRow}>
          <View style={[su.customInputWrap,
          form.test_duration_min === 'custom' && customDuration ? su.customInputActive : null
          ]}>
            <TextInput
              style={su.customInput}
              value={customDuration}
              onChangeText={onCustomChange}
              placeholder="0"
              placeholderTextColor={C.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="done"
            />
            <Text style={su.customUnit}>min</Text>
          </View>
          {form.test_duration_min === 'custom' && customDuration ? (
            <View style={su.customBadge}>
              <Text style={su.customBadgeTxt}>✓ Selected</Text>
            </View>
          ) : (
            <Text style={su.customHint}>Type minutes here</Text>
          )}
        </View>

        <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 6 }}>
          ⏱ Session auto-stops when this time is reached
        </Text>
      </View>

      <TouchableOpacity style={[s.primaryBtn, loading && { opacity: 0.6 }]} onPress={start} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : (
          <Text style={s.primaryTxt}>
            ▶  Start Test  ({resolvedMinutes()} min)
          </Text>
        )}
      </TouchableOpacity>
      <Text style={{ color: C.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
        Plug appliance into tester after tapping Start
      </Text>
    </ScrollView>
  );
};

const su = StyleSheet.create({
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  customInputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 8, minWidth: 100
  },
  customInputActive: { borderColor: C.accent, backgroundColor: '#00D4FF11' },
  customInput: {
    color: C.textPrimary, fontSize: 16, fontWeight: '600',
    minWidth: 50, padding: 0
  },
  customUnit: { color: C.textSec, fontSize: 13, marginLeft: 4 },
  customHint: { color: C.textMuted, fontSize: 12 },
  customBadge: {
    backgroundColor: '#00D4FF22', borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 5, borderWidth: 1, borderColor: C.accent
  },
  customBadgeTxt: { color: C.accent, fontSize: 12, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 3 — MONITOR
// ─────────────────────────────────────────────────────────────────────────────
const MonitorScreen = ({ account, deviceId, sessionId, applianceName, plannedMin, onDone, onStop }) => {
  const [live, setLive] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [readings, setReadings] = useState(0);
  const [connected, setConnected] = useState(false);
  const [polling, setPolling] = useState(false);
  const [events, setEvents] = useState([]);
  const [stopping, setStopping] = useState(false);
  const [stopMsg, setStopMsg] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const wsRef = useRef(null);
  const wsAlive = useRef(false);
  const pollTimerRef = useRef(null);
  const reconnTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const totalSec = (plannedMin || 0) * 60;
  const pct = totalSec > 0 ? Math.min(1, elapsed / totalSec) : 0;
  const remaining = totalSec > 0 ? Math.max(0, totalSec - elapsed) : null;

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Auto-stop when duration reached ───────────────────────────────────────
  useEffect(() => {
    if (totalSec > 0 && elapsed >= totalSec && !stopping) {
      stopSession();
    }
  }, [elapsed, totalSec, stopping]);

  const applyLiveData = useCallback((d) => {
    if (!d || !mountedRef.current) return;
    setLive(d);
    setAnomalies(d.anomalies || []);
    setReadings(r => d.session_read_count || d.read_count || r);
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    setPolling(true);
    const doPoll = async () => {
      if (!mountedRef.current) return;
      try {
        const r = await fetch(`${API_BASE}/iot/latest/${deviceId}`, { headers: authHeaders() });
        if (r.ok) { const d = await r.json(); applyLiveData(d); }
      } catch { }
      if (mountedRef.current && !wsAlive.current) {
        pollTimerRef.current = setTimeout(doPoll, POLL_INTERVAL_MS);
      }
    };
    doPoll();
  }, [deviceId, applyLiveData]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
    setPolling(false);
  }, []);

  const connectWS = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current) {
      try { wsRef.current.onclose = null; wsRef.current.close(); } catch { }
      wsRef.current = null;
    }
    try {
      const url = `${WS_BASE}/iot/ws?device_id=${deviceId}&token=${getToken()}&account=${account || getAccount()}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        wsAlive.current = true;
        setConnected(true);
        stopPolling();
        if (reconnTimerRef.current) { clearTimeout(reconnTimerRef.current); reconnTimerRef.current = null; }
      };

      ws.onmessage = ev => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'live_reading') {
            applyLiveData(msg.data);
          } else if (msg.type === 'snapshot') {
            if (msg.data?.latest) applyLiveData(msg.data.latest);
            if (msg.data?.events?.length) setEvents(msg.data.events.slice(0, 6).reverse());
          } else if (msg.type === 'appliance_event') {
            setEvents(prev => [msg.data, ...prev].slice(0, 6));
          } else if (msg.type === 'session_ended') {
            if (mountedRef.current) onDone(msg.data);
          }
        } catch { }
      };

      ws.onerror = () => { };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        wsAlive.current = false;
        setConnected(false);
        startPolling();
        if (!reconnTimerRef.current) {
          reconnTimerRef.current = setTimeout(() => {
            reconnTimerRef.current = null;
            if (mountedRef.current && !stopping) connectWS();
          }, WS_RECONNECT_MS);
        }
      };
    } catch {
      wsAlive.current = false;
      setConnected(false);
      startPolling();
    }
  }, [deviceId, account, applyLiveData, startPolling, stopPolling, stopping]);

  useEffect(() => {
    mountedRef.current = true;
    connectWS();
    return () => {
      mountedRef.current = false;
      wsAlive.current = false;
      if (wsRef.current) { try { wsRef.current.onclose = null; wsRef.current.close(); } catch { } }
      if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); }
      if (reconnTimerRef.current) { clearTimeout(reconnTimerRef.current); }
    };
  }, []);

  const stopSession = async () => {
    setStopping(true);
    setStopMsg('Stopping session…');
    wsAlive.current = false;
    if (wsRef.current) { try { wsRef.current.onclose = null; wsRef.current.close(); } catch { } wsRef.current = null; }
    if (reconnTimerRef.current) { clearTimeout(reconnTimerRef.current); reconnTimerRef.current = null; }
    stopPolling();

    try {
      const r = await fetch(`${API_BASE}/iot/sessions/${sessionId}/end`, {
        method: 'POST', headers: authHeaders(),
      });
      if (!r.ok && r.status !== 400) {
        const e = await r.json().catch(() => ({}));
        if (r.status === 400) { onStop(); return; }
        throw new Error(e.detail || `HTTP ${r.status}`);
      }

      setStopMsg('Waiting for AI analysis…');

      let attempts = 0;
      const maxAttempts = 40;
      const pollForCompletion = async () => {
        if (!mountedRef.current) return;
        if (attempts++ > maxAttempts) {
          try {
            const fr = await fetch(`${API_BASE}/iot/sessions/${sessionId}`, { headers: authHeaders() });
            if (fr.ok) { const fd = await fr.json(); onDone(fd); } else { onStop(); }
          } catch { onStop(); }
          return;
        }
        try {
          const sr = await fetch(`${API_BASE}/iot/sessions/${sessionId}`, { headers: authHeaders() });
          const sd = await sr.json();
          if (sd.status === 'completed') {
            if (mountedRef.current) onDone(sd);
          } else {
            setTimeout(pollForCompletion, 3000);
          }
        } catch {
          setTimeout(pollForCompletion, 3000);
        }
      };
      pollForCompletion();

    } catch (e) {
      setStopping(false);
      setStopMsg('');
      Alert.alert('Error', e.message || 'Failed to stop session');
    }
  };

  const renderMetrics = () => {
    if (!live) return (
      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={{ color: C.textMuted, marginTop: 12, fontSize: 13 }}>Waiting for device data…</Text>
        <Text style={{ color: C.textMuted, marginTop: 4, fontSize: 11 }}>
          {connected ? '● WebSocket connected' : polling ? '⟳ Polling via REST' : '○ Connecting…'}
        </Text>
      </View>
    );

    const d = live;
    const temp = safe(d.temperature_c ?? d.temperature);
    const hum = safe(d.humidity_pct ?? d.humidity);
    const hi = safe(d.heat_index_c ?? d.heat_index);
    const pf = safe(d.power_factor);

    return (
      <View>
        {/* ── RELAY CONTROL CARD ── inserted here, always visible during session */}
        <Text style={panel.sectionTitle}>🔌 Relay Control</Text>
        <RelayControlCard
          deviceId={String(deviceId || '').replace(/:/g, '').toUpperCase()}
          liveData={live}
          token={getToken()}
        />

        <Text style={panel.sectionTitle}>⚡ Electrical</Text>
        <View style={panel.card}>
          <MetricRow items={[
            { label: 'Active Power', value: fmtF(d.power_w ?? d.power, 1), unit: 'W', color: C.accent },
            { label: 'Voltage', value: fmtF(d.voltage, 1), unit: 'V', color: C.green },
            { label: 'Current', value: fmtF(d.current_a ?? d.current, 3), unit: 'A', color: C.yellow },
          ]} />
          <MetricRow items={[
            { label: 'Power Factor', value: fmtF(pf, 3), unit: '', color: pfColor(pf) },
            { label: 'Apparent Pwr', value: fmtF(d.apparent_power_va, 1), unit: 'VA', color: C.textPrimary },
            { label: 'Frequency', value: fmtF(d.frequency_hz ?? d.frequency, 1), unit: 'Hz', color: C.teal },
          ]} />
          <View style={{ paddingHorizontal: 8, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: C.textMuted, fontSize: 11 }}>Power Factor</Text>
              <Text style={{ color: pfColor(pf), fontSize: 11, fontWeight: '700' }}>
                {pf >= 0.95 ? 'Excellent' : pf >= 0.85 ? 'Good' : pf >= 0.70 ? 'Fair' : 'Poor'}
              </Text>
            </View>
            <View style={panel.track}>
              <View style={[panel.fill, { width: `${Math.min(100, (pf || 0) * 100)}%`, backgroundColor: pfColor(pf) }]} />
            </View>
          </View>
        </View>

        <Text style={panel.sectionTitle}>📊 Session</Text>
        <View style={panel.card}>
          <MetricRow items={[
            { label: 'Session kWh', value: fmtF(d.session_kwh, 4), unit: 'kWh', color: C.green },
            { label: 'Est. Cost', value: `Rs ${fmtF(d.session_cost_rs, 2)}`, unit: '', color: C.yellow },
            { label: 'Duration', value: fmtF(d.session_minutes, 1), unit: 'min', color: C.accent },
          ]} />
          <MetricRow items={[
            { label: 'Avg Power', value: fmtF(d.avg_power_w, 1), unit: 'W', color: C.accent },
            { label: 'Proj. kWh/hr', value: fmtF((d.avg_power_w || 0) / 1000, 4), unit: 'kWh', color: C.green },
            { label: 'Proj. Cost/hr', value: `Rs ${fmtF(((d.avg_power_w || 0) / 1000) * 15, 2)}`, unit: '', color: C.yellow },
          ]} />
          <MetricRow items={[
            { label: 'Peak Power', value: fmtF(d.peak_power_w, 1), unit: 'W', color: C.red },
            { label: 'Total Energy', value: fmtF(d.energy_kwh ?? d.energy, 3), unit: 'kWh', color: C.teal },
          ]} />
        </View>

        <Text style={panel.sectionTitle}>📶 Quality & Analysis</Text>
        <View style={panel.card}>
          <MetricRow items={[
            { label: 'PQ Score', value: `${fmtF(d.power_quality_score ?? d.pq_score, 1)}/100`, unit: '', color: C.purple },
            { label: 'Efficiency', value: d.efficiency_class || '—', unit: '', color: C.yellow },
            { label: 'Detected', value: d.detected_appliance || 'Unknown', unit: '', color: C.accent },
          ]} />
          <MetricRow items={[
            { label: 'Resistance', value: fmtF(d.resistance_ohm, 0), unit: 'Ω', color: C.textPrimary },
            { label: 'V Deviation', value: `${fmtF(d.voltage_dev_pct, 2)}%`, unit: '', color: Math.abs(d.voltage_dev_pct || 0) > 5 ? C.red : C.green },
            { label: 'WiFi RSSI', value: fmtF(d.wifi_rssi, 0), unit: 'dBm', color: (d.wifi_rssi || 0) >= -65 ? C.green : C.yellow },
          ]} />
        </View>

        <TouchableOpacity 
          style={[panel.testBtn, testLoading && { opacity: 0.6 }]} 
          onPress={async () => {
            if (testLoading) return;
            setTestLoading(true);
            try {
              const r = await fetch(`${API_BASE}/iot/test-telegram`, { 
                method: 'POST', 
                headers: authHeaders() 
              });
              const d = await r.json();
              Alert.alert(d.success ? '✅ Success' : '❌ Failed', d.message);
            } catch (e) { 
              Alert.alert('Error', 'Could not reach server. Check connection.'); 
            } finally {
              setTestLoading(false);
            }
          }}
          disabled={testLoading}
        >
          {testLoading ? (
            <ActivityIndicator color={C.accent} size="small" />
          ) : (
            <Text style={panel.testBtnTxt}>🔔 Test Telegram Alert</Text>
          )}
        </TouchableOpacity>

        {(temp !== null || hum !== null) && (
          <>
            <Text style={panel.sectionTitle}>🌡️ Environment</Text>
            <View style={panel.card}>
              <MetricRow items={[
                { label: 'Temperature', value: temp !== null ? `${fmtF(temp, 1)}°C` : '—', unit: '', color: C.orange },
                { label: 'Humidity', value: hum !== null ? `${fmtF(hum, 1)}%` : '—', unit: '', color: C.teal },
                { label: 'Heat Index', value: hi !== null ? `${fmtF(hi, 1)}°C` : '—', unit: '', color: C.yellow },
              ]} />
            </View>
          </>
        )}

        <Text style={panel.sectionTitle}>📡 Device</Text>
        <View style={panel.card}>
          <MetricRow items={[
            { label: 'Read Count', value: `${d.session_read_count || d.read_count || 0}`, unit: '', color: C.textPrimary },
            { label: 'Uptime', value: d.uptime_ms ? `${Math.floor(d.uptime_ms / 60000)}m` : '—', unit: '', color: C.textPrimary },
            { label: 'Avg PF', value: fmtF(d.avg_power_factor, 3), unit: '', color: pfColor(d.avg_power_factor) },
          ]} />
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={s.flex} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.textPrimary, fontSize: 17, fontWeight: '700' }}>{applianceName}</Text>
          <Text style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>
            {fmtSecs(elapsed)}  ·  {readings} readings
            {remaining != null ? `  ·  ${fmtSecs(remaining)} left` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={[mn.pill, { backgroundColor: connected ? '#0F2D1A' : '#2D1F0A' }]}>
            <View style={[mn.dot, { backgroundColor: connected ? C.green : polling ? C.yellow : C.red }]} />
            <Text style={[mn.pillTxt, { color: connected ? C.green : polling ? C.yellow : C.red }]}>
              {connected ? 'WS LIVE' : polling ? 'POLLING' : 'OFFLINE'}
            </Text>
          </View>
        </View>
      </View>

      {totalSec > 0 && (
        <View style={{ marginBottom: 10 }}>
          <RainbowBar pct={pct} />
          <Text style={{ color: C.textMuted, fontSize: 11, textAlign: 'right' }}>
            {Math.round(pct * 100)}% of {plannedMin} min
          </Text>
        </View>
      )}

      <AnomalyBanner anomalies={anomalies} />
      {renderMetrics()}

      {events.length > 0 && (
        <View style={panel.card}>
          <Text style={panel.sectionTitle}>🔄 Appliance Events</Text>
          {events.map((ev, i) => (
            <Text key={i} style={{ color: C.textSec, fontSize: 12, marginBottom: 3 }}>
              {ev.from_appliance || ev.from} →{' '}
              <Text style={{ color: C.accent }}>{ev.to_appliance || ev.to}</Text>
              {'  '}{Number(ev.watts || 0).toFixed(0)} W
            </Text>
          ))}
        </View>
      )}

      {stopping ? (
        <View style={mn.stoppingBox}>
          <ActivityIndicator color={C.accent} />
          <Text style={{ color: C.textPrimary, marginLeft: 12, fontSize: 14 }}>{stopMsg}</Text>
        </View>
      ) : (
        <TouchableOpacity style={mn.stopBtn} onPress={stopSession}>
          <Text style={mn.stopIcon}>⏹</Text>
          <Text style={mn.stopTxt}>Stop &amp; Analyse</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const panel = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 4, marginBottom: 10,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden'
  },
  sectionTitle: {
    color: C.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7,
    marginBottom: 4, marginTop: 6, paddingHorizontal: 2
  },
  track: { height: 5, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden', marginTop: 4, marginBottom: 8 },
  fill: { height: 5, borderRadius: 3 },
  testBtn: { 
    backgroundColor: '#0D1422', borderRadius: 10, paddingVertical: 10, 
    alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: C.accent + '30' 
  },
  testBtnTxt: { color: C.accent, fontSize: 12, fontWeight: '700' },
});

const mn = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 20
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pillTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 2, borderColor: C.red, borderRadius: 14,
    paddingVertical: 14, marginTop: 8, backgroundColor: '#1A0808'
  },
  stopIcon: { fontSize: 18 },
  stopTxt: { color: C.red, fontWeight: '700', fontSize: 16 },
  stoppingBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, marginTop: 8, backgroundColor: C.card,
    borderRadius: 14, borderWidth: 1, borderColor: C.border
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 4 — REPORT
// ─────────────────────────────────────────────────────────────────────────────
const ReportScreen = ({ sessionData, onNewTest }) => {
  const [exporting, setExporting] = useState(false);
  const [exportFmt, setExportFmt] = useState(null);

  const health = (() => {
    try {
      return typeof sessionData?.health_assessment === 'string'
        ? JSON.parse(sessionData.health_assessment) : (sessionData?.health_assessment || {});
    }
    catch { return {}; }
  })();
  const ai = sessionData?.ai_analysis || {};
  const st = sessionData || {};

  const SEV = { HIGH: C.red, MEDIUM: C.orange, LOW: C.yellow, INFO: C.accent };

  const doExport = async (fmt) => {
    setExporting(true);
    setExportFmt(fmt);
    try {
      const url = `${API_BASE}/iot/sessions/${st.id}/export?format=${fmt}`;
      const r = await fetch(url, { headers: authHeaders() });
      if (!r.ok) throw new Error(`Server returned ${r.status}`);
      const content = await r.text();
      const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      const safeName = (st.appliance_name || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `EnergyIQ_${safeName}_${ts}.${fmt}`;
      const mimeType = fmt === 'json' ? 'application/json' : 'text/csv';
      await downloadFile(content, filename, mimeType);
    } catch (e) {
      Alert.alert('Export Error', e.message || 'Failed to export report');
    } finally {
      setExporting(false);
      setExportFmt(null);
    }
  };

  const shareReport = async () => {
    const lines = [
      `EnergyIQ Test Report`,
      `====================`,
      `Appliance: ${st.appliance_name} ${st.appliance_brand || ''}`,
      `Duration:  ${fmtF(st.actual_duration_min, 0)} min`,
      ``,
      `ELECTRICAL`,
      `  Avg Power:  ${fmtF(st.avg_power_w, 0)} W`,
      `  Peak Power: ${fmtF(st.peak_power_w, 0)} W`,
      `  Avg PF:     ${fmtF(st.avg_power_factor, 3)}`,
      `  Total kWh:  ${fmtF(st.total_session_kwh, 4)}`,
      `  Cost:       Rs ${fmtF(st.total_cost_rs, 2)}`,
      `  Readings:   ${st.total_readings}`,
      ``,
      `ENVIRONMENT`,
      `  Avg Temp:     ${fmtF(st.avg_temperature, 1)}°C`,
      `  Avg Humidity: ${fmtF(st.avg_humidity, 1)}%`,
      ``,
      `HEALTH SCORE: ${health.health_score ?? '—'}/100  (${health.status || '—'})`,
      ``,
      `ISSUES:`,
      ...(health.issues || []).map(i => `  [${i.severity}] ${i.message || i.detail}`),
      ``,
      `AI SUMMARY:`,
      ai.summary || 'Not available',
      ``,
      `RECOMMENDATIONS:`,
      ...(ai.recommendations || []).map((r, i) => `  ${i + 1}. ${r}`),
      ``,
      `Service Needed: ${health.service_recommended ? 'YES' : 'No'}`,
    ].join('\n');
    await Share.share({ title: `EnergyIQ – ${st.appliance_name}`, message: lines });
  };

  return (
    <ScrollView style={s.flex} contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
      <Text style={s.title}>Health Report</Text>
      <Text style={s.sub}>
        {st.appliance_name}{st.appliance_brand ? ` · ${st.appliance_brand}` : ''}
        {st.actual_duration_min ? `  ·  ${fmtF(st.actual_duration_min, 0)} min  ·  ${st.total_readings} readings` : ''}
      </Text>

      <HealthRing score={health.health_score} />

        <View style={rp.statsGrid}>
          {[
            { l: 'Avg Power', v: `${fmtF(st.avg_power_w, 0)} W`, c: C.accent },
            { l: 'Peak Power', v: `${fmtF(st.peak_power_w, 0)} W`, c: C.red },
            { l: 'Avg PF', v: fmtF(st.avg_power_factor, 3), c: pfColor(st.avg_power_factor) },
            { l: 'kWh Used', v: fmtF(st.total_session_kwh, 4), c: C.green },
            { l: 'Cost', v: `Rs ${fmtF(st.total_cost_rs, 2)}`, c: C.yellow },
            { l: 'Readings', v: `${st.total_readings || 0}`, c: C.textPrimary },
            { l: 'Proj. kWh/hr', v: fmtF((st.avg_power_w || 0) / 1000, 4), c: C.green },
            { l: 'Proj. Cost/hr', v: `Rs ${fmtF(((st.avg_power_w || 0) / 1000) * 15, 2)}`, c: C.yellow },
            { l: 'Duration', v: `${fmtF(st.actual_duration_min, 1)}m`, c: C.accent },
          ].map(({ l, v, c }) => (
            <View key={l} style={rp.statCell}>
              <Text style={[rp.statVal, { color: c }]}>{v}</Text>
              <Text style={rp.statLbl}>{l}</Text>
            </View>
          ))}
        </View>

      {(st.avg_temperature != null) && (
        <View style={rp.section}>
          <Text style={rp.secTitle}>🌡️  Environment During Test</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[rp.statVal, { color: C.orange }]}>{fmtF(st.avg_temperature, 1)}°C</Text>
              <Text style={rp.statLbl}>Avg Temp</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={[rp.statVal, { color: C.teal }]}>{fmtF(st.avg_humidity, 1)}%</Text>
              <Text style={rp.statLbl}>Avg Humidity</Text>
            </View>
          </View>
        </View>
      )}

      {health.issues?.length > 0 && (
        <View style={rp.section}>
          <Text style={rp.secTitle}>⚠️  Issues Detected</Text>
          {health.issues.map((iss, i) => (
            <View key={i} style={[rp.issueRow, { borderLeftColor: SEV[iss.severity] || C.yellow }]}>
              <Text style={[rp.issueSev, { color: SEV[iss.severity] }]}>{iss.severity}</Text>
              <Text style={rp.issueTxt}>{iss.message || iss.detail}</Text>
              {iss.recommendation && (
                <Text style={{ color: C.textSec, fontSize: 12, marginTop: 4 }}>
                  💡 {iss.recommendation}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {ai.summary && (
        <View style={[rp.section, { borderLeftWidth: 3, borderLeftColor: C.purple }]}>
          <Text style={rp.secTitle}>🤖  AI Analysis</Text>
          <Text style={rp.bodyTxt}>{ai.summary}</Text>
          {ai.comparison ? (
            <Text style={[rp.bodyTxt, { color: C.textSec, marginTop: 8, fontStyle: 'italic' }]}>
              {ai.comparison}
            </Text>
          ) : null}
          {health.deviation_pct != null && (
            <Text style={[rp.deviationBadge, {
              color: Math.abs(health.deviation_pct) < 20 ? C.green : C.orange
            }]}>
              {health.deviation_pct > 0 ? '+' : ''}{fmtF(health.deviation_pct)}% vs typical
            </Text>
          )}
        </View>
      )}

      {ai.recommendations?.length > 0 && (
        <View style={rp.section}>
          <Text style={rp.secTitle}>✅  Recommendations</Text>
          {ai.recommendations.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 7 }}>
              <Text style={{ color: C.accent, fontSize: 15 }}>›</Text>
              <Text style={[rp.bodyTxt, { flex: 1 }]}>{r}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[rp.serviceFlag, {
        backgroundColor: health.service_recommended ? '#2D1515' : '#0F2D1A',
      }]}>
        <Text style={[rp.serviceTxt, { color: health.service_recommended ? C.red : C.green }]}>
          {health.service_recommended
            ? '🔧  Professional service recommended'
            : '✓  No service required at this time'}
        </Text>
      </View>

      <View style={rp.section}>
        <Text style={rp.secTitle}>📤  Download / Share</Text>
        <TouchableOpacity
          style={[rp.shareBtn, { backgroundColor: C.card, marginBottom: 10 }]}
          onPress={shareReport}>
          <Text style={{ color: C.textPrimary, fontWeight: '600' }}>📋  Share Text Report</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[rp.exportBtn, exportFmt === 'json' && rp.exportBtnActive]}
            onPress={() => doExport('json')}
            disabled={exporting}>
            {exporting && exportFmt === 'json'
              ? <ActivityIndicator color={C.accent} size="small" />
              : <Text style={{ color: C.accent, fontWeight: '700', fontSize: 15 }}>⬇  JSON</Text>
            }
            <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 3 }}>Full dataset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[rp.exportBtn, exportFmt === 'csv' && rp.exportBtnActive]}
            onPress={() => doExport('csv')}
            disabled={exporting}>
            {exporting && exportFmt === 'csv'
              ? <ActivityIndicator color={C.green} size="small" />
              : <Text style={{ color: C.green, fontWeight: '700', fontSize: 15 }}>⬇  CSV</Text>
            }
            <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 3 }}>ML-ready</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 8 }}>
          {st.total_readings} readings  ·  {st.dataset_count || st.total_readings} rows in dataset
        </Text>
      </View>

      <TouchableOpacity style={s.primaryBtn} onPress={onNewTest}>
        <Text style={s.primaryTxt}>+ New Test</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const rp = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 10
  },
  statCell: {
    width: '33.33%', alignItems: 'center', paddingVertical: 14,
    borderRightWidth: 1, borderBottomWidth: 1, borderColor: C.border
  },
  statVal: { fontSize: 14, fontWeight: '700' },
  statLbl: { fontSize: 10, color: C.textMuted, marginTop: 2 },
  section: {
    backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.border
  },
  secTitle: { color: C.textSec, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 },
  issueRow: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 8 },
  issueSev: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  issueTxt: { color: C.textPrimary, fontSize: 13, lineHeight: 18 },
  bodyTxt: { color: C.textPrimary, fontSize: 14, lineHeight: 22 },
  deviationBadge: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  serviceFlag: { borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center' },
  serviceTxt: { fontSize: 14, fontWeight: '600' },
  shareBtn: {
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1, borderColor: C.border
  },
  exportBtn: {
    flex: 1, backgroundColor: C.accentDim, borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: C.border
  },
  exportBtnActive: { borderColor: C.accent, backgroundColor: '#00D4FF33' },
});

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
const LiveMeterScreen = () => {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState('');
  const [screen, setScreen] = useState('SCAN');
  const [deviceId, setDeviceId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [appliance, setAppliance] = useState('');
  const [plannedMin, setPlannedMin] = useState(15);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadAuth().then(({ account: acct }) => {
      setAccount(acct);
      setReady(true);
    });
  }, []);

  const STEP_LABELS = { SCAN: '1/4  Scan', SETUP: '2/4  Setup', MONITOR: '3/4  Live', REPORT: '4/4  Report' };

  if (!ready) return (
    <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={C.accent} size="large" />
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} translucent={false} />
      <ScreenHeader 
        title="EnergyIQ Tester"
        subtitle={STEP_LABELS[screen]}
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        backgroundColor={C.bg}
      />

      {screen === 'SCAN' && (
        <ScanScreen onSelect={id => { 
          setDeviceId(id); 
          setScreen('SETUP'); 
          require('@react-native-async-storage/async-storage').default.setItem('last_iot_device', id);
        }} />
      )}
      {screen === 'SETUP' && deviceId && (
        <SetupScreen
          account={account} deviceId={deviceId}
          onStart={(sid, name, min) => {
            setSessionId(sid); setAppliance(name); setPlannedMin(min); setScreen('MONITOR');
          }}
          onBack={() => setScreen('SCAN')}
        />
      )}
      {screen === 'MONITOR' && sessionId && (
        <MonitorScreen
          account={account} deviceId={deviceId} sessionId={sessionId}
          applianceName={appliance} plannedMin={plannedMin}
          onDone={data => { setReportData(data); setScreen('REPORT'); }}
          onStop={() => { setSessionId(null); setScreen('SCAN'); }}
        />
      )}
      {screen === 'REPORT' && reportData && (
        <ReportScreen
          sessionData={reportData}
          onNewTest={() => { setReportData(null); setSessionId(null); setScreen('SCAN'); }}
        />
      )}
    </View>
  );
};

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 14,
    paddingTop: Platform.OS === 'ios' ? 54 : 14,
    borderBottomWidth: 1, borderBottomColor: C.border
  },
  topTitle: { color: C.textPrimary, fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },
  title: {
    color: C.textPrimary, fontSize: 22, fontWeight: '700',
    paddingHorizontal: 20, paddingTop: 20, marginBottom: 4
  },
  sub: { color: C.textSec, fontSize: 13, paddingHorizontal: 20, marginBottom: 16 },
  back: { color: C.accent, fontSize: 14, marginBottom: 8 },
  inputLabel: {
    color: C.textSec, fontSize: 12, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5
  },
  input: {
    backgroundColor: C.card, color: C.textPrimary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
    borderWidth: 1, borderColor: C.border
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border
  },
  chipActive: { backgroundColor: C.accentDim, borderColor: C.accent },
  chipTxt: { color: C.textSec, fontSize: 13 },
  primaryBtn: {
    marginHorizontal: 20, marginVertical: 16, backgroundColor: C.accent,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center'
  },
  primaryTxt: { color: '#000', fontWeight: '700', fontSize: 15 },
  outlineBtn: {
    margin: 20, borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center'
  },
  outlineTxt: { color: C.textSec, fontSize: 14 },
  devCard: {
    backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: C.border
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  devId: { color: C.textPrimary, fontSize: 15, fontWeight: '600' },
  devMeta: { color: C.textSec, fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyH: { color: C.textPrimary, fontSize: 17, fontWeight: '600', marginTop: 10 },
  emptySub: { color: C.textSec, fontSize: 13, textAlign: 'center', marginTop: 6 },
});

export default LiveMeterScreen;