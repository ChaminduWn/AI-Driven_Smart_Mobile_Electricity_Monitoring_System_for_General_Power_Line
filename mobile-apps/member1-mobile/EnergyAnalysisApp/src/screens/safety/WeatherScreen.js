import React, { useEffect, useState } from 'react';
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
    <View style={{ flex: 1 }}>
      <Header title="Current Weather" leftAction={<Button icon="arrow-left" onPress={() => navigation.goBack()} />} />
      <ScrollView contentContainerStyle={styles.container} refreshControl={<></>}>
        {/* TODO: add pull-to-refresh later */}        {loading && (
          <>
            <SkeletonLoader height={120} style={{ borderRadius: 16, marginBottom: 12 }} />
            <SkeletonLoader height={20} style={{ width: '40%', marginBottom: 8 }} />
            <SkeletonLoader height={90} style={{ borderRadius: 12, marginBottom: 12 }} />
          </>
        )}
        {error && <Text style={{ color: 'red' }}>{error}</Text>}

        {data && (
          <>
            {/* try to load local Lottie assets placed in `assets/lottie/*.json` */}
            {/* if not present, LottiePlayer will fall back to an emoji */}
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

            <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <SmartRiskIndicator score={data.riskAssessment?.score ?? 0} />
              </View>
              <View style={{ flex: 1 }}>
                <PriorityActionCard title="Protect Router" body="Voltage surges from the storm may damage network equipment. Use a surge protector." ctaLabel="View Protection Guide" onPress={() => { /* TODO: open guide */ }} />
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: '700', marginBottom: 8 }}>Forecast & Stability</Text>
              <ForecastScroller items={(data.forecast || []).slice(0, 6).map(f => ({ label: f.label || 'Now', temp: f.temp ?? '--', emoji: f.emoji ?? '☀️' }))} />
            </View>

            <SimpleCard style={styles.card} title="Priority Actions">
              {data.safetySuggestions?.length ? data.safetySuggestions.map((s, i) => (
                <Text key={i} style={{ marginTop: 6 }}>• {s}</Text>
              )) : <Text>No suggestions available.</Text>}
            </SimpleCard>

            <View style={{ marginTop: 80 }} />
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 60 },
  card: { marginBottom: 12, borderRadius: 8 }
});
