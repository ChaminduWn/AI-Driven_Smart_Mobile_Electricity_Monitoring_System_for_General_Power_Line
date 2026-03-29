/**
 * RelayControlCard.jsx
 * 
 * Drop-in component for LiveMeterScreen (MonitorScreen section).
 * Shows relay ON/OFF toggle, safety status, custom power limits,
 * and safety event log.
 * 
 * Usage in LiveMeterScreen MonitorScreen:
 *   import RelayControlCard from '../components/RelayControlCard';
 *   ...
 *   <RelayControlCard deviceId={deviceId} liveData={live} token={getToken()} />
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Animated, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { API_BASE } from '../config';

const C = {
  bg: '#0B0F1A', card: '#1A2235', border: '#1F2D45',
  green: '#22C55E', red: '#EF4444', yellow: '#FBBF24',
  accent: '#00D4FF', textPrimary: '#F0F4FF', textSec: '#8899BB',
};

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

// ─── Main Component ────────────────────────────────────────────────────────

const RelayControlCard = ({ deviceId, liveData, token }) => {
  const [relayOn, setRelayOn] = useState(false);
  const [safetyTripped, setSafetyTripped] = useState(false);
  const [safetyReason, setSafetyReason] = useState('');
  const [customMaxW, setCustomMaxW] = useState('2300');
  const [customMaxA, setCustomMaxA] = useState('9.0');
  const [sending, setSending] = useState(false);
  const [showLimits, setShowLimits] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Sync state from live MQTT data
  useEffect(() => {
    if (!liveData) return;
    setRelayOn(liveData.relay_on ?? false);
    setSafetyTripped(liveData.safety_tripped ?? false);
    setSafetyReason(liveData.safety_reason ?? '');
    if (liveData.custom_max_w) setCustomMaxW(String(liveData.custom_max_w));
    if (liveData.custom_max_a) setCustomMaxA(String(liveData.custom_max_a));
  }, [liveData]);

  // Pulse animation when safety tripped
  useEffect(() => {
    if (!safetyTripped) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [safetyTripped]);

  const sendCommand = useCallback(async (cmd, extra = {}) => {
    setSending(true);
    try {
      const r = await fetch(`${API_BASE}/relay/command`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ device_id: deviceId, command: cmd, ...extra }),
      });
      const d = await r.json();
      if (!d.success) {
        Alert.alert('Command Failed', d.message || 'Check MQTT connection');
      }
    } catch (e) {
      Alert.alert('Network Error', e.message);
    } finally {
      setSending(false);
    }
  }, [deviceId, token]);

  const toggleRelay = async (value) => {
    if (safetyTripped && value) {
      Alert.alert(
        'Safety Latch Active',
        `Cannot turn on — safety was triggered:\n${safetyReason}\n\nReset safety first.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset Safety', onPress: () => sendCommand('reset_safety') },
        ]
      );
      return;
    }
    await sendCommand(value ? 'relay_on' : 'relay_off');
  };

  const applyLimits = async () => {
    const w = parseFloat(customMaxW);
    const a = parseFloat(customMaxA);
    if (isNaN(w) || w < 100 || w > 2300) {
      Alert.alert('Invalid', 'Max watts must be between 100 and 2300');
      return;
    }
    if (isNaN(a) || a < 0.5 || a > 9.0) {
      Alert.alert('Invalid', 'Max amps must be between 0.5 and 9.0');
      return;
    }
    const r = await fetch(`${API_BASE}/relay/set-limits`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ device_id: deviceId, max_w: w, max_a: a }),
    });
    const d = await r.json();
    Alert.alert(d.success ? '✅ Limits Updated' : '❌ Failed', d.message);
    setShowLimits(false);
  };

  const power = liveData?.power_w ?? liveData?.power ?? 0;
  const usagePct = Math.min(100, (power / parseFloat(customMaxW)) * 100);

  return (
    <View style={s.wrap}>

      {/* Safety trip banner */}
      {safetyTripped && (
        <Animated.View style={[s.tripBanner, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={s.tripTitle}>🚨 SAFETY TRIP — POWER CUT</Text>
          <Text style={s.tripReason}>{safetyReason}</Text>
          <TouchableOpacity style={s.resetBtn} onPress={() => sendCommand('reset_safety')}>
            <Text style={s.resetTxt}>Reset Safety Latch</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Relay toggle */}
      <View style={s.row}>
        <View>
          <Text style={s.label}>Relay Power</Text>
          <Text style={[s.stateText, { color: relayOn ? C.green : C.textSec }]}>
            {relayOn ? '● LIVE — Appliance ON' : '○ OPEN — No Power'}
          </Text>
        </View>
        <View style={s.toggleArea}>
          {sending && <ActivityIndicator color={C.accent} style={{ marginRight: 10 }} />}
          <Switch
            value={relayOn}
            onValueChange={toggleRelay}
            disabled={sending}
            trackColor={{ false: '#1F2D45', true: '#16532D' }}
            thumbColor={relayOn ? C.green : C.textSec}
            ios_backgroundColor="#1F2D45"
          />
        </View>
      </View>

      {/* Power usage bar */}
      {relayOn && (
        <View style={s.usageWrap}>
          <View style={s.usageTrack}>
            <View style={[s.usageFill, {
              width: `${usagePct}%`,
              backgroundColor: usagePct > 85 ? C.red : usagePct > 60 ? C.yellow : C.green,
            }]} />
          </View>
          <Text style={s.usageLbl}>
            {power.toFixed(0)} W  /  {customMaxW} W limit  ({usagePct.toFixed(0)}%)
          </Text>
        </View>
      )}

      {/* Divider */}
      <View style={s.divider} />

      {/* Quick actions */}
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.actionBtn, { borderColor: C.red + '60' }]}
          onPress={() => sendCommand('relay_off')}
          disabled={sending}
        >
          <Text style={[s.actionTxt, { color: C.red }]}>⏹ Cut Power</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, { borderColor: C.yellow + '60' }]}
          onPress={() => sendCommand('reset_energy')}
          disabled={sending}
        >
          <Text style={[s.actionTxt, { color: C.yellow }]}>↺ Reset kWh</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, { borderColor: C.accent + '60', backgroundColor: showLimits ? C.accent + '15' : 'transparent' }]}
          onPress={() => setShowLimits(v => !v)}
        >
          <Text style={[s.actionTxt, { color: C.accent }]}>⚙ Limits</Text>
        </TouchableOpacity>
      </View>

      {/* Custom limits panel */}
      {showLimits && (
        <View style={s.limitsPanel}>
          <Text style={s.limitsTitle}>Safety Limits (firmware enforces hardware ceiling)</Text>

          <View style={s.limitRow}>
            <Text style={s.limitLabel}>Max Power (W) ≤ 2300</Text>
            <TextInput
              style={s.limitInput}
              value={customMaxW}
              onChangeText={setCustomMaxW}
              keyboardType="numeric"
              placeholder="2300"
              placeholderTextColor={C.textSec}
            />
          </View>

          <View style={s.limitRow}>
            <Text style={s.limitLabel}>Max Current (A) ≤ 9.0</Text>
            <TextInput
              style={s.limitInput}
              value={customMaxA}
              onChangeText={setCustomMaxA}
              keyboardType="decimal-pad"
              placeholder="9.0"
              placeholderTextColor={C.textSec}
            />
          </View>

          <TouchableOpacity style={s.applyBtn} onPress={applyLimits} disabled={sending}>
            <Text style={s.applyTxt}>Apply Limits</Text>
          </TouchableOpacity>

          <Text style={s.limitsNote}>
            These limits are sent to the device via MQTT. The firmware will also enforce its own hardware ceiling (2300W / 9A). Your custom limit is applied first.
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  wrap: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  tripBanner: {
    backgroundColor: '#2D1515', borderRadius: 10, padding: 12,
    marginBottom: 14, borderLeftWidth: 3, borderLeftColor: C.red,
  },
  tripTitle: { color: '#FCA5A5', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  tripReason: { color: '#FCA5A5', fontSize: 12, marginBottom: 10 },
  resetBtn: {
    backgroundColor: C.red + '20', borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: C.red + '50', alignItems: 'center',
  },
  resetTxt: { color: C.red, fontSize: 13, fontWeight: '700' },

  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  label: { color: C.textSec, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  stateText: { fontSize: 13, fontWeight: '600' },
  toggleArea: { flexDirection: 'row', alignItems: 'center' },

  usageWrap: { marginBottom: 12 },
  usageTrack: {
    height: 8, backgroundColor: '#0D1422', borderRadius: 4,
    overflow: 'hidden', marginBottom: 6,
  },
  usageFill: { height: '100%', borderRadius: 4 },
  usageLbl: { color: C.textSec, fontSize: 11 },

  divider: { height: 1, backgroundColor: C.border, marginBottom: 12 },

  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, alignItems: 'center',
  },
  actionTxt: { fontSize: 12, fontWeight: '700' },

  limitsPanel: {
    backgroundColor: '#0D1422', borderRadius: 10, padding: 14,
    marginTop: 12, borderWidth: 1, borderColor: C.accent + '30',
  },
  limitsTitle: {
    color: C.textSec, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10 },
  limitLabel: { color: C.textSec, fontSize: 13, flex: 1 },
  limitInput: {
    backgroundColor: C.card, color: C.textPrimary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, width: 90,
    borderWidth: 1, borderColor: C.border, fontSize: 14,
    textAlign: 'right',
  },
  applyBtn: {
    backgroundColor: C.accent, borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', marginTop: 4,
  },
  applyTxt: { color: '#000', fontSize: 14, fontWeight: '800' },
  limitsNote: {
    color: C.textSec, fontSize: 11, lineHeight: 17, marginTop: 10,
  },
});

export default RelayControlCard;
