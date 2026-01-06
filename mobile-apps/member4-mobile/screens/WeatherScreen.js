import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import * as Location from 'expo-location';
import Header from '../components/Header';
import api from '../services/api';
import SimpleCard from '../components/SimpleCard';

export default function WeatherScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    (async () => {
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

        const resp = await api.fetchWeatherByCoords(lat, lon);
        if (resp.status !== 'success') {
          setError(resp.message || 'Failed to fetch weather');
        } else {
          setData(resp.data);
        }
      } catch (err) {
        setError(err.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Current Weather" leftAction={<Button icon="arrow-left" onPress={() => navigation.goBack()} /> } />
      <ScrollView contentContainerStyle={styles.container}>
        {loading && <ActivityIndicator animating size={48} />}
        {error && <Text style={{ color: 'red' }}>{error}</Text>}
        {data && (
          <>
            <SimpleCard style={styles.card} title={`${data.weather.location.city}, ${data.weather.location.country}`}>
                <Text variant="headlineMedium">{Math.round(data.weather.temperature)}°C — {data.weather.weather}</Text>
                <Text style={{ marginTop: 8 }}>{data.weather.description}</Text>
                <Text style={{ marginTop: 8, fontWeight: '600' }}>Risk Level: {data.riskAssessment.riskLevel}</Text>
                <Text style={{ marginTop: 8 }}>{data.riskAssessment.recommendation}</Text>
            </SimpleCard>

            <SimpleCard style={styles.card} title="Identified Hazards">
                <Text>Has Hazards: {data.hazardAnalysis.hasHazards ? 'Yes' : 'No'}</Text>
                {data.hazardAnalysis.hazards?.length ? (
                  data.hazardAnalysis.hazards.map((h, idx) => (
                    <Text key={idx} style={{ marginTop: 6 }}>• {h}</Text>
                  ))
                ) : (
                  <Text style={{ marginTop: 6 }}>No major electrical hazards detected.</Text>
                )}
            </SimpleCard>

            <SimpleCard style={styles.card} title="Safety Suggestions">
                {data.safetySuggestions?.length ? data.safetySuggestions.map((s, i) => (
                  <Text key={i} style={{ marginTop: 6 }}>• {s}</Text>
                )) : <Text>No suggestions available.</Text>}
            </SimpleCard>

            <View style={{ marginTop: 12 }}>
              <Button mode="contained" onPress={() => navigation.navigate('SafetyTips')}>View General Safety Tips</Button>
            </View>
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
