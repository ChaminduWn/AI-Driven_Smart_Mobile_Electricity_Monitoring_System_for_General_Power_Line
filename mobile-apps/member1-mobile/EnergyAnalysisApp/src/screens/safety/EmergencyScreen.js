import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import Header from '../../components/safety/Header';
import api from '../../services/safety/api';
import SimpleCard from '../../components/safety/SimpleCard';
import ProtocolPhase from '../../components/safety/ProtocolPhase';

const DISASTERS = ['flood', 'thunderstorm', 'heavy_rain', 'cyclone'];

import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../../utils/theme';
import { ArrowLeft, Phone, AlertCircle, ShieldAlert } from 'lucide-react-native';

const C = {
  bg: COLORS.bg1,
  card: COLORS.bg2,
  surface: COLORS.bg3,
  accent: COLORS.primary,
  textPrimary: COLORS.textPrimary,
  textSecondary: COLORS.textSecondary,
  textMuted: COLORS.textMuted,
  border: COLORS.border,
};

export default function EmergencyScreen({ navigation }) {
  const [selected, setSelected] = useState('flood');
  const [protocol, setProtocol] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.fetchEmergencyProtocol(selected);
        if (res.status !== 'success') throw new Error(res.message || 'Failed to load');
        setProtocol(res.data);
      } catch (err) {
        setError(err.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    })();
  }, [selected]);

  const showConfirm = (num, label) => {
    if (!num) return;
    const raw = String(num).trim();
    const phone = raw.replace(/[^\d+]/g, '');
    const title = `Call ${label ?? 'this number'}?`;
    Alert.alert(title, raw, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call',
        onPress: async () => {
          const url = `tel:${phone}`;
          try {
            const supported = await Linking.canOpenURL(url);
            if (supported) await Linking.openURL(url);
            else console.warn('Dialer not supported on this device');
          } catch (err) {
            console.warn('Error opening dialer', err);
          }
        }
      }
    ]);
  };

  const hasProtocolContent = Boolean(
    protocol &&
    (
      (protocol.overview && protocol.overview.toString().trim() !== '') ||
      (protocol.before && protocol.before.length > 0) ||
      (protocol.during && protocol.during.length > 0) ||
      (protocol.after && protocol.after.length > 0)
    )
  );

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitleMain}>Emergency Protocols</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Immediate Safety Actions</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.selectorWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, alignItems: 'center' }}
          >
            {DISASTERS.map(d => (
              <Button
                key={d}
                mode={selected === d ? 'contained' : 'outlined'}
                onPress={() => setSelected(d)}
                style={[styles.selectorButton, selected === d && styles.selectorButtonActive]}
                buttonColor={selected === d ? C.accent : 'transparent'}
                textColor={selected === d ? C.bg : C.accent}
                borderColor={C.accent}
                compact
              >
                {d.replace('_', ' ').toUpperCase()}
              </Button>
            ))}
          </ScrollView>
        </View>

        {loading && <ActivityIndicator animating color={C.accent} size="large" style={{ marginTop: 20 }} />}
        {error && <Text style={{ color: '#ff4444', textAlign: 'center', marginTop: 20 }}>{error}</Text>}

        {protocol && (
          <>
            {hasProtocolContent && (
              <>
                {(protocol.before && protocol.before.length > 0) && <ProtocolPhase phase={1} title="Preparation" items={protocol.before} open />}
                {(protocol.during && protocol.during.length > 0) && <ProtocolPhase phase={2} title="During Event" items={protocol.during} />}
                {(protocol.after && protocol.after.length > 0) && <ProtocolPhase phase={3} title="Recovery" items={protocol.after} />}
              </>
            )}

            {!hasProtocolContent && !protocol.emergencyContacts && (
              <Text style={{ color: C.textSecondary, textAlign: 'center', marginTop: 20 }}>No emergency protocol available for {selected.replace('_', ' ')}.</Text>
            )}

            {protocol.emergencyContacts && (
              <SimpleCard style={{ marginTop: 12 }} title="Emergency Contacts" leftIcon="phone-outline">
                <View style={{ gap: 8 }}>
                  {protocol.emergencyContacts.sriLanka && (
                    <>
                      <Text style={{ fontWeight: '800', marginTop: 6, color: C.accent }}>Sri Lanka</Text>
                      {Object.entries(protocol.emergencyContacts.sriLanka).map(([k, v]) => {
                        const label = k.replace(/([A-Z])/g, ' $1').trim();
                        const isPhone = typeof v === 'string' && /\d/.test(v);
                        return (
                          <View key={k} style={styles.contactRow}>
                            <Text style={styles.contactLabel}>• {label}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.contactNumber}>{v}</Text>
                              {isPhone && (
                                <Button mode="text" labelStyle={{ color: C.accent }} compact onPress={() => showConfirm(v, label)}>Call</Button>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </>
                  )}
                </View>
              </SimpleCard>
            )}

            <View style={{ marginTop: 16 }}>
              <Button
                mode="contained"
                buttonColor="#DC2626"
                textColor="#fff"
                icon="phone"
                style={{ paddingVertical: 8, borderRadius: 12 }}
                onPress={() => {
                  const primary = protocol?.emergencyContacts?.sriLanka?.emergencyServices ?? '119';
                  showConfirm(primary, 'Emergency Services');
                }}
              >
                CALL EMERGENCY NOW
              </Button>
            </View>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg1 },
  scrollContent: { padding: 16 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 20,
    backgroundColor: COLORS.bg2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleGroup: { flex: 1, alignItems: 'center' },
  headerTitleMain: { ...FONTS.bold, fontSize: 18, color: COLORS.textPrimary },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.danger, marginRight: 6 },
  statusText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  backBtn: { padding: 4 },
  selectorWrapper: { marginBottom: 16, backgroundColor: COLORS.bg2, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  selectorButton: { borderRadius: 20, marginRight: 8, paddingHorizontal: 4, minWidth: 110 },
  selectorButtonActive: { elevation: 4 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  contactLabel: { flex: 1, fontSize: 14, color: '#ffffff' },
  contactNumber: { marginRight: 8, color: '#FFD700', fontWeight: '700' }
});
