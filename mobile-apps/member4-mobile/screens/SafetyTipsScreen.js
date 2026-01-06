import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import Header from '../components/Header';
import api from '../services/api';

export default function SafetyTipsScreen({ navigation }) {
  const [tips, setTips] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.fetchSafetyTips();
        if (res.status !== 'success') throw new Error(res.message || 'Failed to fetch tips');
        setTips(res.data);
      } catch (err) {
        setError(err.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Safety Tips" leftAction={<Text onPress={() => navigation.goBack()} style={{ padding: 12 }}>Back</Text>} />
      <ScrollView contentContainerStyle={styles.container}>
        {loading && <ActivityIndicator animating size={48} />}
        {error && <Text style={{ color: 'red' }}>{error}</Text>}
        {tips && (
          <>
            <Card style={styles.card}>
              <Card.Title title="Daily Tips" />
              <Card.Content>
                {tips.daily.map((t, i) => <Text key={i} style={{ marginTop: 6 }}>• {t}</Text>)}
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Title title="Seasonal Tips" />
              <Card.Content>
                {tips.seasonal.map((t, i) => <Text key={i} style={{ marginTop: 6 }}>• {t}</Text>)}
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Title title="Emergency Tips" />
              <Card.Content>
                {tips.emergency.map((t, i) => <Text key={i} style={{ marginTop: 6 }}>• {t}</Text>)}
              </Card.Content>
            </Card>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ container: { padding: 16 }, card: { marginBottom: 12, borderRadius: 8 } });
