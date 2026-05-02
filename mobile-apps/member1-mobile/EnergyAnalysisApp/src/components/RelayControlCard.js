/**
 * RelayControlCard.js
 *
 * Drop-in component for LiveMeterScreen (MonitorScreen section).
 * Shows relay ON/OFF toggle, safety status, custom power limits,
 * and safety event log.
 *
 * UPDATED: Matches new Backend Relay API (action instead of command)
 * UPDATED: Refined color palette — softer, intentional semantic colors
 * UPDATED: Fully responsive for all mobile screen sizes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Animated, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { API_BASE } from '../config';

const { width: SCREEN_W } = Dimensions.get('window');

// Responsive helpers
const isSmall = SCREEN_W < 360;
const isMedium = SCREEN_W >= 360 && SCREEN_W < 414;

const rem = (base) => {
  if (isSmall) return Math.round(base * 0.88);
  if (isMedium) return Math.round(base * 0.94);
  return base;
};

const C = {
  bg: '#0D1117',
  card: '#161C2A',
  card2: '#1E2840',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',

  emerald: '#00FF9D',
  emeraldDim: 'rgba(0,255,157,0.05)',
  emeraldBorder: 'rgba(0,255,157,0.3)',

  rose: '#FF3B6B',
  roseDim: 'rgba(255,59,107,0.05)',
  roseBorder: 'rgba(255,59,107,0.3)',

  amber: '#FBBF24',
  amberDim: 'rgba(251,191,36,0.12)',
  amberBorder: 'rgba(251,191,36,0.25)',

  cyan: '#38BDF8',
  cyanDim: 'rgba(56,189,248,0.12)',
  cyanBorder: 'rgba(56,189,248,0.25)',

  textPrimary: '#E8EEFF',
  textSec: '#7A8BAE',
  textTer: '#4A5672',
};

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

const RelayControlCard = ({ deviceId, liveData, token }) => {
  const [relayOn, setRelayOn] = useState(false);
  const [safetyEnabled, setSafetyEnabled] = useState(true);
  const [safetyTripped, setSafetyTripped] = useState(false);
  const [safetyReason, setSafetyReason] = useState('');
  const [customMaxW, setCustomMaxW] = useState('2300');
  const [customMaxA, setCustomMaxA] = useState('9.0');
  const [sending, setSending] = useState(false);
  const [showLimits, setShowLimits] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Re-measure on orientation change
  const [screenW, setScreenW] = useState(SCREEN_W);
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenW(window.width);
    });
    return () => sub?.remove();
  }, []);

  const cmdCardHeight = screenW < 360 ? 84 : 100;
  const cardPadding = screenW < 360 ? 14 : 18;

  // Sync state from live MQTT data
  useEffect(() => {
    if (!liveData) return;
    setRelayOn(liveData.relay_on ?? false);
    setSafetyEnabled(liveData.safety_enabled ?? true);
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

  const sendCommand = useCallback(async (action, extra = {}) => {
    const cleanId = String(deviceId || '').replace(/:/g, '').toUpperCase();
    setSending(true);
    try {
      const r = await fetch(`${API_BASE}/relay/command`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ device_id: cleanId, action, ...extra }),
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
    await sendCommand(value ? 'on' : 'off');
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
    await sendCommand('set_limits', { max_w: w, max_a: a });
    setShowLimits(false);
  };

  const power = liveData?.power_w ?? liveData?.power ?? 0;
  const usagePct = Math.min(100, (power / parseFloat(customMaxW)) * 100);
  const meterColor = usagePct > 85 ? C.rose : usagePct > 60 ? C.amber : C.cyan;

  return (
    <View style={s.container}>

      {/* Safety Alert Banner */}
      {safetyTripped && (
        <Animated.View style={[s.alertBanner, { transform: [{ scale: pulseAnim }] }]}>
          <View style={s.alertIconBox}>
            <Text style={s.alertEmoji}>⚠️</Text>
          </View>
          <View style={s.alertTextCol}>
            <Text style={s.alertTitle} numberOfLines={1}>SAFETY TRIP DETECTED</Text>
            <Text style={s.alertMsg} numberOfLines={2}>{safetyReason || 'Threshold exceeded'}</Text>
          </View>
          <TouchableOpacity
            style={s.resetBadge}
            onPress={() => sendCommand('reset_safety')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.resetBadgeTxt}>RESET</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Main Glass Card */}
      <View style={[s.glassCard, { padding: cardPadding }]}>

        {/* Status Hub */}
        <View style={s.statusHub}>
          <View style={s.statusMain}>
            <View style={[s.livePulse, { backgroundColor: relayOn ? C.rose : C.emerald }]} />
            <View style={s.statusTextCol}>
              <Text style={s.hubLabel} numberOfLines={1}>SYSTEM POWER STATUS</Text>
              <Text
                style={[s.hubValue, { color: relayOn ? C.rose : C.emerald, fontSize: rem(14) }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {relayOn ? 'DISCONNECTED' : 'LIVE & MONITORING'}
              </Text>
            </View>
          </View>
          <View style={s.idBadge}>
            <Text style={s.idText}>{String(deviceId).slice(-4)}</Text>
          </View>
        </View>

        {/* Load Visualizer */}
        <View style={s.visualizer}>
          <View style={s.vizHeader}>
            <Text style={s.vizLabel}>REAL-TIME LOAD</Text>
            <Text style={[s.vizValue, { fontSize: rem(26) }]}>
              {power.toFixed(1)}<Text style={s.vizUnit}> W</Text>
            </Text>
          </View>
          <View style={s.meterTrack}>
            <View style={[s.meterFill, { width: `${usagePct}%`, backgroundColor: meterColor }]} />
          </View>
          <View style={s.vizFooter}>
            <Text style={s.vizSub}>0W</Text>
            <Text style={s.vizSub}>{customMaxW}W MAX</Text>
          </View>
        </View>

        {/* Command Row — side by side on normal screens, stacked on tiny */}
        <View style={[s.commandRow, screenW < 340 && s.commandRowStacked]}>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              s.cmdCard,
              s.cutCard,
              relayOn && s.activeCutCard,
              { height: cmdCardHeight },
              screenW < 340 && s.cmdCardFull,
            ]}
            onPress={() => sendCommand('on')}
            disabled={sending}
          >
            <View style={[s.cmdIconBox, relayOn && s.activeCutIconBox]}>
              <Text style={s.cmdEmoji}>🔌</Text>
            </View>
            <Text style={[s.cmdLabel, { color: relayOn ? C.rose : C.textSec }]}>POWER CUT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              s.cmdCard,
              s.liveCard,
              !relayOn && s.activeLiveCard,
              { height: cmdCardHeight },
              screenW < 340 && s.cmdCardFull,
            ]}
            onPress={() => sendCommand('off')}
            disabled={sending}
          >
            <View style={[s.cmdIconBox, !relayOn && s.activeLiveIconBox]}>
              <Text style={s.cmdEmoji}>⚡</Text>
            </View>
            <Text style={[s.cmdLabel, { color: !relayOn ? C.emerald : C.textSec }]}>RESTORE</Text>
          </TouchableOpacity>

        </View>

        {/* Utility Toolbar */}
        <View style={s.toolbar}>
          <TouchableOpacity
            style={[s.toolBtn, { borderColor: C.amberBorder, borderWidth: 1 }]}
            onPress={() => sendCommand('reset_energy')}
            disabled={sending}
          >
            <Text style={[s.toolIcon, { color: C.amber }]}>↺</Text>
            <Text style={[s.toolText, { color: C.amber, fontSize: rem(11) }]}>Reset kWh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.toolBtn,
              { borderColor: C.cyanBorder, borderWidth: 1 },
              showLimits && s.toolActive,
            ]}
            onPress={() => setShowLimits(!showLimits)}
          >
            <Text style={[s.toolIcon, { color: C.cyan }]}>⚙</Text>
            <Text style={[s.toolText, { color: C.cyan, fontSize: rem(11) }]}>Limits</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Limits Panel */}
      {showLimits && (
        <View style={[s.limitsOverlay, { padding: cardPadding }]}>
          <Text style={s.limitsTitle}>HARDWARE THRESHOLDS</Text>
          <View style={s.limitInputRow}>
            <View style={s.inputBox}>
              <Text style={s.inputLabel}>MAX WATTS</Text>
              <TextInput
                style={s.textInput}
                value={customMaxW}
                onChangeText={setCustomMaxW}
                keyboardType="numeric"
                placeholderTextColor={C.textTer}
                returnKeyType="done"
              />
            </View>
            <View style={s.inputBoxGap} />
            <View style={s.inputBox}>
              <Text style={s.inputLabel}>MAX AMPS</Text>
              <TextInput
                style={s.textInput}
                value={customMaxA}
                onChangeText={setCustomMaxA}
                keyboardType="decimal-pad"
                placeholderTextColor={C.textTer}
                returnKeyType="done"
              />
            </View>
          </View>
          <TouchableOpacity style={s.saveBtn} onPress={applyLimits} disabled={sending}>
            {sending
              ? <ActivityIndicator color="#020D1A" size="small" />
              : <Text style={s.saveBtnTxt}>UPDATE FIRMWARE</Text>
            }
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
};

const s = StyleSheet.create({
  container: { marginBottom: 20 },

  // Alert Banner
  alertBanner: {
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.roseBorder,
  },
  alertIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(251,113,133,0.15)',
    borderWidth: 1,
    borderColor: C.roseBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  alertEmoji: { fontSize: 16 },
  alertTextCol: { flex: 1, marginRight: 8 },
  alertTitle: {
    color: C.rose,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  alertMsg: { color: 'rgba(251,113,133,0.7)', fontSize: 12, fontWeight: '600' },
  resetBadge: {
    backgroundColor: C.rose,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resetBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Glass Card
  glassCard: {
    backgroundColor: 'rgba(22, 28, 42, 0.85)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
  },

  // Status Hub
  statusHub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  statusMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
    flexShrink: 0,
  },
  statusTextCol: { flex: 1 },
  hubLabel: {
    color: C.textTer,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  hubValue: { fontWeight: '800', letterSpacing: 0.3 },
  idBadge: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: C.border,
    flexShrink: 0,
  },
  idText: {
    color: C.textTer,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },

  // Visualizer
  visualizer: { marginBottom: 22 },
  vizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  vizLabel: { color: C.textTer, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  vizValue: { color: C.textPrimary, fontWeight: '800' },
  vizUnit: { fontSize: 14, color: C.textSec, fontWeight: '500' },
  meterTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  meterFill: { height: '100%', borderRadius: 6 },
  vizFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  vizSub: { color: C.textTer, fontSize: 10, fontWeight: '600' },

  // Command Row
  commandRow: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  commandRowStacked: {
    flexDirection: 'column',
  },
  cmdCard: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
    minHeight: 44,
  },
  // First card gets right margin in row mode; handled via marginRight below
  cutCard: {
    borderColor: C.rose,
    borderWidth: 3,
    backgroundColor: 'rgba(255,59,107,0.03)',
    marginRight: 15,
  },
  liveCard: { borderColor: C.emeraldBorder },
  activeCutCard: {
    borderColor: C.rose,
    borderWidth: 3,
    shadowColor: C.rose,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 15,
    backgroundColor: 'rgba(254, 0, 64, 0.03)',
  },
  activeLiveCard: {
    borderColor: C.emerald,
    borderWidth: 3,
    shadowColor: C.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 15,
    backgroundColor: 'rgba(0,255,157,0.03)',
  },
  // Full-width override for stacked layout
  cmdCardFull: {
    flex: 0,
    width: '100%',
    marginRight: 0,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 0,
  },
  cmdIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginRight: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  activeCutIconBox: {
    borderColor: C.rose,
    backgroundColor: 'rgba(255, 4, 67, 0.1)',
  },
  activeLiveIconBox: {
    borderColor: C.emerald,
    backgroundColor: 'rgba(0,255,157,0.1)',
  },
  cmdEmoji: { fontSize: 14 },
  cmdLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  // Space between toolbar buttons
  toolBtnGap: { width: 10 },
  toolIcon: { fontSize: 16, marginRight: 6 },
  toolText: { fontWeight: '800', letterSpacing: 0.5 },
  toolActive: { backgroundColor: C.cyanDim, borderColor: C.cyan },

  // Limits Overlay
  limitsOverlay: {
    backgroundColor: C.card2,
    borderRadius: 18,
    marginTop: 10,
    borderWidth: 1,
    borderColor: C.cyanBorder,
  },
  limitsTitle: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 18,
    textAlign: 'center',
  },
  limitInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  inputBox: { flex: 1 },
  inputBoxGap: { width: 12 },
  inputLabel: {
    color: C.textTer,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 7,
  },
  textInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: C.textPrimary,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: C.border2,
    minHeight: 44,
  },
  saveBtn: {
    backgroundColor: C.cyan,
    paddingVertical: 14,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnTxt: {
    color: '#020D1A',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default RelayControlCard;