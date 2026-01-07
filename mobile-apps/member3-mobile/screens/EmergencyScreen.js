import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import Header from '../components/Header';
import api from '../services/api';
import SimpleCard from '../components/SimpleCard';

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

  return (
    <View style={{ flex: 1 }}>
      <Header title="Emergency Protocols" leftAction={<Button icon="arrow-left" onPress={() => navigation.goBack()} />} />
      <ScrollView contentContainerStyle={styles.container}>
        <SimpleCard style={styles.selectorCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {DISASTERS.map(d => (
              <Button key={d} mode={selected === d ? 'contained' : 'outlined'} onPress={() => setSelected(d)}>{d.replace('_', ' ').toUpperCase()}</Button>
            ))}
          </View>
        </SimpleCard>

        {loading && <ActivityIndicator animating size={40} />}
        {error && <Text style={{ color: 'red' }}>{error}</Text>}

        {protocol && (
          <SimpleCard style={styles.card} title={protocol.title || selected.toUpperCase()}>
              <Text style={{ fontWeight: '600' }}>{protocol.overview}</Text>
              <Text style={{ marginTop: 8, fontWeight: '700' }}>Before</Text>
              {protocol.before?.map((t, i) => <Text key={i}>• {t}</Text>)}
              <Text style={{ marginTop: 8, fontWeight: '700' }}>During</Text>
              {protocol.during?.map((t, i) => <Text key={i}>• {t}</Text>)}
              <Text style={{ marginTop: 8, fontWeight: '700' }}>After</Text>
              {protocol.after?.map((t, i) => <Text key={i}>• {t}</Text>)}
          </SimpleCard>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ container: { padding: 16 }, selectorCard: { marginBottom: 12, borderRadius: 8 }, card: { borderRadius: 8 } });
