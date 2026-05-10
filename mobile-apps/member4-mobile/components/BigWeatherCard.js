import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { formatLocation } from '../services/transformers';

export default function BigWeatherCard({ location, weather }) {
  const loc = formatLocation(location);
  const temp = typeof weather?.temp === 'number' ? Math.round(weather.temp) : (typeof weather?.temperature?.current === 'number' ? Math.round(weather.temperature.current) : '--');
  const cond = weather?.condition ?? weather?.weather?.main ?? weather?.weather?.description ?? 'Unknown';
  const humidity = weather?.humidity ?? weather?.conditions?.humidity ?? '--';
  const feels = weather?.feelsLike ?? weather?.temperature?.feelsLike ?? '--';

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.location}>{loc.city ?? 'Unknown'}{loc.country ? `, ${loc.country}` : ''}</Text>
          <Text style={styles.sub}>{loc.sub ?? ''}</Text>
        </View>
        <View style={styles.iconCircle}><Text style={{ fontSize: 30 }}>{cond && (String(cond).toLowerCase().includes('thunder') ? '⛈️' : String(cond).toLowerCase().includes('rain') ? '🌧️' : '🌤️')}</Text></View>
      </View>

      <View style={styles.middleRow}>
        <Text style={styles.temp}>{temp}°</Text>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.cond}>{cond}</Text>
          <Text style={styles.small}>Humidity: {humidity}% • Feels like {feels}°</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  middleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  location: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 12, color: '#666' },
  iconCircle: { backgroundColor: '#fff3', padding: 8, borderRadius: 30 },
  temp: { fontSize: 44, fontWeight: '800' },
  cond: { fontSize: 16, fontWeight: '600' },
  small: { color: '#666', marginTop: 6 }
});