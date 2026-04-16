import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import GradientBackground from '../components/GradientBackground';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';

export default function SplashScreen() {
  return (
    <GradientBackground colors={[COLORS.bg0, COLORS.bg1]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.logoCard}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>

          <Text style={styles.title}>EnergyAnalyser</Text>
          <Text style={styles.subtitle}>Smart electricity insights</Text>

          <View style={styles.lottieWrap}>
            <LottieView
              source={require('../../assets/lottie/sunny.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>

          <View style={styles.footer}>
            <ActivityIndicator size="small" color={COLORS.primaryLight} />
            <Text style={styles.loadingText}>Getting things ready…</Text>
          </View>

          {Platform.OS === 'web' ? (
            <Text style={styles.webHint}>Tip: use a smaller browser width to preview phone layouts.</Text>
          ) : null}
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logoCard: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  logoIcon: { fontSize: 36 },
  title: {
    color: COLORS.textPrimary,
    fontSize: 26,
    ...FONTS.extraBold,
    letterSpacing: -0.6,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
    marginBottom: SPACING.xl,
    ...FONTS.medium,
  },
  lottieWrap: {
    width: '100%',
    maxWidth: 280,
    aspectRatio: 1,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  lottie: { width: '85%', height: '85%' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: COLORS.textSecondary, fontSize: 13, ...FONTS.medium },
  webHint: {
    marginTop: SPACING.xl,
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});

