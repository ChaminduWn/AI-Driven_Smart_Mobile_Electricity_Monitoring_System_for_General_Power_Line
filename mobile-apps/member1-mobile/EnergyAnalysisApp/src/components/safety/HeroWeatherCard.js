import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import LottiePlayer from './LottiePlayer';
import GlassCard from './GlassCard';
import PulsingDot from './PulsingDot';
import PropTypes from 'prop-types';
import { COLORS, FONTS } from '../../utils/theme';

const C = {
  card: COLORS.bg2,
  surface: COLORS.bg3,
  accent: COLORS.primary,
  text: COLORS.textPrimary,
  textSecondary: COLORS.textSecondary,
  textMuted: COLORS.textMuted,
};

export default function HeroWeatherCard({ temperature = 28, condition = 'Light Rain', location = 'Colombo', weatherType = 'rainy', lastUpdate = new Date(), lottieSource = null }) {
  const locationStr = typeof location === 'object' && location !== null
    ? `${location.city ?? location.name ?? location.label ?? 'Your area'}${location.country ? `, ${location.country}` : ''}`
    : location;

  return (
    <GlassCard tint="dark" intensity={30} style={[styles.card]}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View>
          <Text style={[{ color: C.text, fontSize: 64, ...FONTS.bold }]}>{typeof temperature === 'number' ? Math.round(temperature) : (temperature?.value ?? '--')}°</Text>
          <Text style={{ marginTop: 2, ...FONTS.bold, color: C.accent, fontSize: 18 }}>{condition}</Text>
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
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg2,
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
