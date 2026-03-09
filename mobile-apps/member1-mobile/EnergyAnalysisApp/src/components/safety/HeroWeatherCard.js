import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/safety/Colors';
import { TYPOGRAPHY } from '../../constants/safety/Typography';
import LottiePlayer from './LottiePlayer';
import GlassCard from './GlassCard';
import PulsingDot from './PulsingDot';
import PropTypes from 'prop-types';

const C = {
  card: '#16213e',
  surface: '#2a2a4e',
  accent: '#FFD700',
  text: '#ffffff',
  textSecondary: '#dddddd',
  textMuted: '#bbbbbb',
};

export default function HeroWeatherCard({ temperature = 28, condition = 'Light Rain', location = 'Colombo', weatherType = 'rainy', lastUpdate = new Date(), lottieSource = null }) {
  const colors = COLORS.weather[weatherType] || COLORS.weather.sunny;
  const locationStr = typeof location === 'object' && location !== null
    ? `${location.city ?? location.name ?? location.label ?? 'Your area'}${location.country ? `, ${location.country}` : ''}`
    : location;

  return (
    <GlassCard tint="dark" intensity={30} style={[styles.card]}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View>
          <Text style={[TYPOGRAPHY.display, { color: C.text, fontSize: 64, fontWeight: '800' }]}>{typeof temperature === 'number' ? Math.round(temperature) : (temperature?.value ?? '--')}°</Text>
          <Text style={{ marginTop: 2, fontWeight: '800', color: C.accent, fontSize: 18 }}>{condition}</Text>
          <Text style={{ marginTop: 4, color: C.textSecondary, fontSize: 13 }}>{locationStr} • {formatRelative(lastUpdate)}</Text>
        </View>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <View style={styles.iconContainer}>
            <LottiePlayer source={lottieSource} style={styles.lottie} />
          </View>
          <View style={{ marginTop: 12 }}>
            <PulsingDot color={C.accent} />
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

HeroWeatherCard.propTypes = {
  temperature: PropTypes.number,
  condition: PropTypes.string,
  location: PropTypes.string,
  weatherType: PropTypes.string,
  lastUpdate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
  lottieSource: PropTypes.any,
};

function formatRelative(date) {
  const diff = Math.round((Date.now() - new Date(date)) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff} min ago`;
  const h = Math.round(diff / 60);
  return `${h} h ago`;
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.3)',
    backgroundColor: '#16213e',
    marginVertical: 8
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  lottie: { width: 120, height: 120 },
});

