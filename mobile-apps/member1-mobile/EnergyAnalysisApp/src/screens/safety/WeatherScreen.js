import React, { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import * as Location from 'expo-location';
import Header from '../../components/safety/Header';
import api from '../../services/safety/api';
import SimpleCard from '../../components/safety/SimpleCard';
import WeatherHeader from '../../components/safety/WeatherHeader';
import BigWeatherCard from '../../components/safety/BigWeatherCard';
import ForecastScroller from '../../components/safety/ForecastScroller';
import PriorityActionCard from '../../components/safety/PriorityActionCard';
import BottomNav from '../../components/safety/BottomNavg';
import SkeletonLoader from '../../components/safety/SkeletonLoader';
import HeroWeatherCard from '../../components/safety/HeroWeatherCard';
import SmartRiskIndicator from '../../components/safety/SmartRiskIndicator';

const C = {
  bg: '#1a1a2e',
  card: '#16213e',
  surface: '#2a2a4e',
  accent: '#FFD700',
  textPrimary: '#ffffff',
  textSecondary: '#dddddd',
  textMuted: '#bbbbbb',
  border: '#FFD700',
};

export default function WeatherScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [coords, setCoords] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchForCoords = async (lat, lon) => {
    try {
      const resp = await api.fetchWeatherByCoords(lat, lon);
      if (resp.status !== 'success') {
        setError(resp.message || 'Failed to fetch weather');
      } else {
        setData(resp.data);
        setLastUpdated(resp.timestamp ?? new Date().toISOString());
      }
    } catch (err) {
      setError(err?.message || 'Unexpected error');
    }
  };

  const doFetchLocation = async () => {
    setError(null);
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please allow location services.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      setCoords({ lat, lon });
      await fetchForCoords(lat, lon);
    } catch (err) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { doFetchLocation(); }, []);

  return (
    <View style={styles.container}>
      {/* Custom Dark Header to match Assistant */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconBg}>
            <Icon name="weather-cloudy" size={20} color={C.accent} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Weather Monitor</Text>
            <Text style={styles.headerStatus}>Real-time Safety Analysis</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading && (
          <View style={{ marginTop: 20 }}>
            <ActivityIndicator animating color={C.accent} size="large" />
            <Text style={{ color: C.textSecondary, textAlign: 'center', marginTop: 10 }}>Loading weather data...</Text>
          </View>
        )}
        {error && <Text style={{ color: '#ff4444', textAlign: 'center', marginTop: 20 }}>{error}</Text>}

        {data && (
          <>
            {(() => {
              let lottieSource = null;
              try {
                const t = (data.weather.type || 'sunny');
                const mapping = {
                  rainy: require('../../../../assets/lottie/rain.json'),
                  sunny: require('../../../../assets/lottie/sunny.json'),
                  cloudy: require('../../../../assets/lottie/cloudy.json'),
                  stormy: require('../../../../assets/lottie/storm.json'),
                };
                lottieSource = mapping[t] || null;
              } catch (e) {
                lottieSource = null;
              }
              return (
                <HeroWeatherCard temperature={data.weather.temp ?? 28} condition={data.weather.condition || 'Unknown'} location={data.weather.location || 'Your area'} weatherType={data.weather.type || 'sunny'} lastUpdate={lastUpdated} lottieSource={lottieSource} />
              );
            })()}

            <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8, backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.1)' }}>
                <SmartRiskIndicator score={data.riskAssessment?.score ?? 0} />
              </View>
              <View style={{ flex: 1 }}>
                <PriorityActionCard title="Protect Router" body="Voltage surges from the storm may damage network equipment." ctaLabel="View Guide" onPress={() => { }} />
              </View>
            </View>

            <View style={{ marginTop: 20 }}>
              <Text style={{ fontWeight: '800', marginBottom: 12, color: C.accent, fontSize: 16 }}>Forecast & Stability</Text>
              <ForecastScroller items={(data.forecast || []).slice(0, 6).map(f => ({ label: f.label || 'Now', temp: f.temp ?? '--', emoji: f.emoji ?? '☀️' }))} />
            </View>

            <SimpleCard style={styles.card} title="Priority Actions" leftIcon="alert-decagram-outline">
              {data.safetySuggestions?.length ? data.safetySuggestions.map((s, i) => (
                <Text key={i} style={{ marginTop: 8, color: C.textPrimary }}>• {s}</Text>
              )) : <Text style={{ color: C.textMuted }}>No suggestions available.</Text>}
            </SimpleCard>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD700',
    backgroundColor: '#16213e',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: { color: '#FFD700', fontSize: 18, fontWeight: '800' },
  headerStatus: { color: '#aaaaaa', fontSize: 11, marginTop: -2 },
  card: { marginBottom: 12, borderRadius: 12 }
});
