import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import SimpleCard from '../components/SimpleCard';
import ForecastScroller from '../components/ForecastScroller';
import PriorityActionCard from '../components/PriorityActionCard';
import HeroWeatherCard from '../components/HeroWeatherCard';
import SmartRiskIndicator from '../components/SmartRiskIndicator';

export default function WeatherScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [coords, setCoords] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchForCoords = async (lat, lon) => {
    try {
      const resp = await api.fetchWeatherByCoords(lat, lon);
      console.log(resp)
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
    <View style={styles.rootContainer}>
      {/* Custom Header replicating AssisScreen styles */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="weather-partly-cloudy" size={28} color="#FFD700" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Weather Monitor</Text>
            <Text style={styles.headerSubtitle}>Real-time Environmental Threats</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={() => doFetchLocation()}>
          <Text style={styles.clearText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Fetching meteorological data...</Text>
          </View>
        )}
        {error && <Text style={{ color: '#FF4D6D', textAlign: 'center', marginTop: 12 }}>{error}</Text>}

        {data && Array.isArray(data.forecast) ? (
          <>
            {(() => {
              let lottieSource = null;
              try {
                const t = (data?.weather?.type || 'sunny');
                const mapping = {
                  rainy: require('../assets/lottie/rain.json'),
                  sunny: require('../assets/lottie/sunny.json'),
                  cloudy: require('../assets/lottie/cloudy.json'),
                  stormy: require('../assets/lottie/storm.json'),
                };
                lottieSource = mapping[t] || null;
              } catch (e) {
                lottieSource = null;
              }
              return (
                <HeroWeatherCard temperature={data?.weather?.temp ?? 28} condition={data?.weather?.condition || 'Unknown'} location={data?.weather?.location || 'Your area'} weatherType={data?.weather?.type || 'sunny'} lastUpdate={lastUpdated} lottieSource={lottieSource} />
              );
            })()}

            <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                <SmartRiskIndicator score={data?.riskAssessment?.score ?? 0} />
              </View>
              <View style={{ flex: 1.2 }}>
                <PriorityActionCard title="Act Now" body="Voltage surges from the storm may damage network equipment." ctaLabel="View Protection Guide" onPress={() => { /* TODO */ }} />
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={{ fontWeight: '700', marginBottom: 8, color: '#FFD700', fontSize: 16 }}>Forecast & Stability</Text>
              <ForecastScroller items={(data?.forecast || []).slice(0, 6).map(f => ({ label: f?.label || 'Now', temp: f?.temp ?? '--', emoji: f?.emoji ?? '☀️' }))} />
            </View>

            <SimpleCard style={styles.card} title="Priority Actions">
              {Array.isArray(data?.safetySuggestions) && data.safetySuggestions.length ? data.safetySuggestions.map((s, i) => (
                <Text key={i} style={{ marginTop: 8, color: '#fff', fontSize: 14 }}>• {s}</Text>
              )) : <Text style={{ color: '#aaa' }}>No suggestions available.</Text>}
            </SimpleCard>

            <View style={{ marginTop: 80 }} />
          </>
        ) : null}

        <View style={{ height: 60 }} />
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
  clearButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
  },
  container: { padding: 16, paddingBottom: 60 },
  card: { marginTop: 16 },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    color: '#aaa',
    fontSize: 14,
  },
});
