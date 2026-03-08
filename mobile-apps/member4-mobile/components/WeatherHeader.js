import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import RiskBadge from './RiskBadge';

function weatherEmoji(condition) {
  if (!condition) return '🌤️';
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('shower')) return '🌧️';
  if (c.includes('thunder')) return '⛈️';
  if (c.includes('snow')) return '❄️';
  if (c.includes('cloud')) return '☁️';
  if (c.includes('clear')) return '☀️';
  return '🌡️';
}

export default function WeatherHeader({ weather, lastUpdated, onRefresh, riskLevel }) {
  const temp = typeof weather?.temperature?.current === 'number' ? Math.round(weather.temperature.current) : '--';
  const cond = weather?.weather?.main ?? weather?.weather?.description ?? 'Unknown';
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{weatherEmoji(cond)}</Text>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.temp}>{temp}°C</Text>
          <Text style={styles.cond}>{cond}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <IconButton icon="refresh" onPress={onRefresh} />
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.updated}>Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}</Text>
        <RiskBadge level={riskLevel ?? 'low'} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#e8f4ff', borderRadius: 10, padding: 12, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 36 },
  temp: { fontSize: 28, fontWeight: '700' },
  cond: { color: '#333' },
  bottomRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  updated: { color: '#666', fontSize: 12 }
});