import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/safety/Colors';
import { TYPOGRAPHY } from '../../constants/safety/Typography';
import LottiePlayer from './LottiePlayer';
import GlassCard from './GlassCard';
import PulsingDot from './PulsingDot';
import PropTypes from 'prop-types';

export default function HeroWeatherCard({ temperature = 28, condition = 'Light Rain', location = 'Colombo', weatherType = 'rainy', lastUpdate = new Date(), lottieSource = null }) {
  const colors = COLORS.weather[weatherType] || COLORS.weather.sunny;
  const locationStr = typeof location === 'object' && location !== null
    ? `${location.city ?? location.name ?? location.label ?? 'Your area'}${location.country ? `, ${location.country}` : ''}`
    : location;

  return (
    <GlassCard style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View>
          <Text style={[TYPOGRAPHY.display, { color: COLORS.text.primary }]}>{typeof temperature === 'number' ? Math.round(temperature) : (temperature?.value ?? '--')}°</Text>
          <Text style={{ marginTop: 6, fontWeight: '600', color: COLORS.text.secondary }}>{condition}</Text>
          <Text style={{ marginTop: 2, color: COLORS.text.tertiary }}>{locationStr} • {formatRelative(lastUpdate)}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          {/* Lottie animation (falls back to emoji if no source) */}
          <LottiePlayer source={lottieSource} style={styles.iconPlaceholder} />
          <View style={{ marginTop: 8 }}>
            <PulsingDot color={colors[0]} />
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
  card: { padding: 18, borderRadius: 16 },
  row: { flexDirection: 'row' },
  iconPlaceholder: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
});

