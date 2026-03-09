import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import Header from '../../components/safety/Header';
import api from '../../services/safety/api';
import SimpleCard from '../../components/safety/SimpleCard';
import ProtocolPhase from '../../components/safety/ProtocolPhase';

const DISASTERS = ['flood', 'thunderstorm', 'heavy_rain', 'cyclone'];

export default function EmergencyScreen({ navigation }) {
  const [selected, setSelected] = useState('flood');
  const [protocol, setProtocol] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Confirmation will use a native Alert to avoid Dialog/Portal hook incompat issues.

  useEffect(() => {
    (async () => {
      setLoading(true);
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

  // Determine whether the fetched protocol actually has visible content
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
    <View style={{ flex: 1 }}>
      <Header title="Emergency Protocols" leftAction={<Button icon="arrow-left" onPress={() => navigation.goBack()} />} />
      <ScrollView contentContainerStyle={styles.container}>
        <SimpleCard style={styles.selectorCard}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={{ paddingHorizontal: 8, alignItems: 'center' }}
          >
            {DISASTERS.map(d => (
              <Button
                key={d}
                mode={selected === d ? 'contained' : 'outlined'}
                onPress={() => setSelected(d)}
                style={[styles.selectorButton, selected === d && styles.selectorButtonActive]}
                compact
              >
                {d.replace('_', ' ').toUpperCase()}
              </Button>
            ))}
          </ScrollView>
        </SimpleCard>

        {loading && <ActivityIndicator animating size={40} />}
        {error && <Text style={{ color: 'red' }}>{error}</Text>}

        {protocol && (
          <>
            {/* protocol title & phases - only render when there's meaningful content */}
            {hasProtocolContent && (
              <>
                {/* {(protocol.title || protocol.overview || protocol.short) && (
                  <SimpleCard style={{ marginBottom: 8 }} {...(protocol.title ? { title: protocol.title, leftIcon: 'alert-circle-outline' } : {})}>
                    {protocol.overview ? <Text style={{ fontWeight: '600' }}>{protocol.overview}</Text> : null}
                    {protocol.short ? <Text style={{ marginTop: 8 }}>{protocol.short}</Text> : null}
                  </SimpleCard>
                )} */}

                {(protocol.before && protocol.before.length > 0) && <ProtocolPhase phase={1} title="Preparation" items={protocol.before} open />}
                {(protocol.during && protocol.during.length > 0) && <ProtocolPhase phase={2} title="During Event" items={protocol.during} />}
                {(protocol.after && protocol.after.length > 0) && <ProtocolPhase phase={3} title="Recovery" items={protocol.after} />}
              </>
            )}

            {/* If no protocol content AND no contacts, show a small info line */}
            {!hasProtocolContent && !protocol.emergencyContacts && (
              <Text style={{ color: '#666', marginTop: 8 }}>No emergency protocol available for {selected.replace('_', ' ')}.</Text>
            )}

            {/* Emergency contacts (shown even if protocol content is missing) */}
            {protocol.emergencyContacts && (
              <SimpleCard style={{ marginTop: 12 }} title="Emergency Contacts" leftIcon="phone">
                <View style={{ gap: 8 }}>
                  {protocol.emergencyContacts.sriLanka && (
                    <>
                      <Text style={{ fontWeight: '600', marginTop: 6 }}>Sri Lanka</Text>
                      {Object.entries(protocol.emergencyContacts.sriLanka).map(([k, v]) => {
                        const label = k.replace(/([A-Z])/g, ' $1').trim();
                        const isPhone = typeof v === 'string' && /\d/.test(v);
                        return (
                          <View key={k} style={styles.contactRow}>
                            <Text style={styles.contactLabel}>• {label}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.contactNumber}>{v}</Text>
                              {isPhone && (
                                <Button mode="text" compact onPress={() => showConfirm(v, label)}>Call</Button>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </>
                  )}

                  {Array.isArray(protocol.emergencyContacts.electricalEmergency) && (
                    <>
                      <Text style={{ fontWeight: '600', marginTop: 8 }}>Electrical Emergency</Text>
                      {protocol.emergencyContacts.electricalEmergency.map((m, i) => (
                        <Text key={i} style={{ marginTop: 4 }}>• {m}</Text>
                      ))}
                    </>
                  )}
                </View>
              </SimpleCard>
            )}

            <View style={{ marginTop: 12 }}>
              <Button
                mode="contained"
                buttonColor="#DC2626"
                textColor="#fff"
                style={{ paddingVertical: 12, borderRadius: 12 }}
                onPress={() => {
                  const primary = protocol?.emergencyContacts?.sriLanka?.emergencyServices
                    ?? protocol?.emergencyContacts?.sriLanka?.ambulance
                    ?? null;
                  if (primary) {
                    showConfirm(primary, 'Emergency Services');
                  } else {
                    // fallback: find any first numeric contact in Sri Lanka list
                    const sri = protocol?.emergencyContacts?.sriLanka ?? {};
                    const any = Object.values(sri).find(v => typeof v === 'string' && /\d/.test(v));
                    if (any) showConfirm(any, 'Emergency Contact');
                  }
                }}
                disabled={!protocol?.emergencyContacts}
              >
                CALL EMERGENCY
              </Button>
            </View>

            <View style={{ height: 60 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  selectorCard: { marginBottom: 12, borderRadius: 8 },
  selectorButton: { borderRadius: 20, marginRight: 8, paddingHorizontal: 12, minWidth: 120, justifyContent: 'center' },
  selectorButtonActive: {},
  card: { borderRadius: 8 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  contactLabel: { flex: 1, fontSize: 14 },
  contactNumber: { marginRight: 8, color: '#1E88E5', fontWeight: '600' }
});
