import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import SimpleCard from '../components/SimpleCard';
import ProtocolPhase from '../components/ProtocolPhase';

const DISASTERS = ['flood', 'thunderstorm', 'heavy_rain', 'cyclone'];

export default function EmergencyScreen({ navigation }) {
  const [selected, setSelected] = useState('flood');
  const [protocol, setProtocol] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    <View style={styles.rootContainer}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="alert-circle" size={28} color="#FFD700" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Emergency Protocols</Text>
            <Text style={styles.headerSubtitle}>Safety Procedures & Contacts</Text>
          </View>
        </View>
      </View>

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
                textColor={selected === d ? "#000" : "#FFD700"}
                buttonColor={selected === d ? "#FFD700" : "transparent"}
                onPress={() => setSelected(d)}
                style={[
                  styles.selectorButton,
                  selected === d ? styles.selectorButtonActive : { borderColor: '#FFD700' }
                ]}
                compact
              >
                {d.replace('_', ' ').toUpperCase()}
              </Button>
            ))}
          </ScrollView>
        </SimpleCard>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
          </View>
        )}
        {error && <Text style={{ color: '#FF4D6D', textAlign: 'center', marginTop: 12 }}>{error}</Text>}

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
              <Text style={{ color: '#aaa', marginTop: 8, textAlign: 'center' }}>No emergency protocol available for {selected.replace('_', ' ')}.</Text>
            )}

            {protocol.emergencyContacts && (
              <SimpleCard style={{ marginTop: 12 }} title="Emergency Contacts" leftIcon="phone">
                <View style={{ gap: 8 }}>
                  {protocol.emergencyContacts.sriLanka && (
                    <>
                      <Text style={{ fontWeight: '600', marginTop: 6, color: '#FFD700' }}>Sri Lanka</Text>
                      {Object.entries(protocol.emergencyContacts.sriLanka).map(([k, v]) => {
                        const label = k.replace(/([A-Z])/g, ' $1').trim();
                        const isPhone = typeof v === 'string' && /\d/.test(v);
                        return (
                          <View key={k} style={styles.contactRow}>
                            <Text style={styles.contactLabel}>• {label}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.contactNumber}>{v}</Text>
                              {isPhone && (
                                <Button mode="text" textColor="#FFD700" compact onPress={() => showConfirm(v, label)}>Call</Button>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </>
                  )}

                  {Array.isArray(protocol.emergencyContacts.electricalEmergency) && (
                    <>
                      <Text style={{ fontWeight: '600', marginTop: 8, color: '#FFD700' }}>Electrical Emergency</Text>
                      {protocol.emergencyContacts.electricalEmergency.map((m, i) => (
                        <Text key={i} style={{ marginTop: 4, color: '#fff' }}>• {m}</Text>
                      ))}
                    </>
                  )}
                </View>
              </SimpleCard>
            )}

            <View style={{ marginTop: 16 }}>
              <Button
                mode="contained"
                buttonColor="#FF4D6D"
                textColor="#fff"
                style={{ paddingVertical: 12, borderRadius: 12 }}
                onPress={() => {
                  const primary = protocol?.emergencyContacts?.sriLanka?.emergencyServices
                    ?? protocol?.emergencyContacts?.sriLanka?.ambulance
                    ?? null;
                  if (primary) {
                    showConfirm(primary, 'Emergency Services');
                  } else {
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
  rootContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#FFD700',
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  container: { padding: 16 },
  selectorCard: { marginBottom: 12, borderRadius: 8, padding: 8 },
  selectorButton: { borderRadius: 20, marginRight: 8, paddingHorizontal: 12, minWidth: 120, justifyContent: 'center' },
  selectorButtonActive: { borderWidth: 0 },
  card: { borderRadius: 8 },
  loadingContainer: { alignItems: 'center', paddingVertical: 20 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  contactLabel: { flex: 1, fontSize: 14, color: '#fff' },
  contactNumber: { marginRight: 8, color: '#00C8FF', fontWeight: '600' }
});
