import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import GradientBackground from '../components/GradientBackground';
import { COLORS, FONTS, RADIUS } from '../utils/theme';

export default function SplashScreen() {
  return (
    <GradientBackground colors={['#0F172A', '#07111F']}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.logoCard}>
            <Ionicons name="flash" size={42} color="#06B6D4" />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.brandTitle}>
              <Text style={{ fontWeight: '300', color: '#E8F4FF' }}>Power</Text>
              <Text style={{ fontWeight: '800', color: '#2563EB' }}>Link</Text>
            </Text>
            <Text style={styles.subtitle}>Smart Electricity Monitoring System</Text>
          </View>

          <View style={styles.footer}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Connecting to grid…</Text>
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
    paddingHorizontal: 32,
  },
  logoCard: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.xl,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#06B6D440',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandTitle: {
    fontSize: 34,
    letterSpacing: -1,
  },
  subtitle: {
    color: '#7A9CC0',
    fontSize: 14,
    marginTop: 8,
    ...FONTS.medium,
  },
  footer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  loadingText: { color: '#7A9CC0', fontSize: 13, ...FONTS.medium },
  webHint: {
    position: 'absolute',
    bottom: 40,
    color: '#3D5570',
    fontSize: 12,
    textAlign: 'center',
  },
});

