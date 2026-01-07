import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // 1. Import useRouter

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const router = useRouter(); // 2. Initialize the router

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#155E75', dark: '#083344' }}
      headerImage={
        <View style={styles.headerOverlay}>
          <Ionicons name="flash" size={180} color="rgba(255, 255, 255, 0.08)" style={styles.headerIcon} />
          <View style={styles.headerTextContainer}>
            <ThemedText type="title" style={styles.headerTitle}>PowerSmart</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Electricity Management System</ThemedText>
          </View>
        </View>
      }>

      <ThemedView style={styles.usageCard}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.cardLabel}>Current Usage</ThemedText>
          <View style={styles.liveBadge}>
            <View style={styles.pulseDot} />
            <ThemedText style={styles.liveText}>LIVE</ThemedText>
          </View>
        </View>
        
        <ThemedView style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText style={styles.usageValue}>452.5</ThemedText>
            <ThemedText style={styles.usageUnit}>kWh This Month</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.usageValue}>Rs. 84.20</ThemedText>
            <ThemedText style={styles.usageUnit}>Estimated Bill</ThemedText>
          </View>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Smart Management</ThemedText>
        <View style={styles.actionGrid}>
          <ActionButton 
            icon="bar-chart" 
            label="Energy Analysis" 
            color="#10b981" 
          />
          <ActionButton 
            icon="megaphone-outline" 
            label="Outage Reports" 
            color="#f59e0b" 
          />
          {/* 3. Add the onPress navigation here */}
          <ActionButton 
            icon="sunny" 
            label="Solar Recs" 
            color="#eab308" 
            onPress={() => router.push('/solar-recommendations')} 
          />
          <ActionButton 
            icon="shield-checkmark-outline" 
            label="Safety Assistant" 
            color="#0ea5e9" 
          />
        </View>
      </ThemedView>

      {/* Rest of your UI components... */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>System Status</ThemedText>
        <TouchableOpacity style={styles.statusBox}>
          <View style={styles.statusIndicator} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.statusText}>
              All systems operating normally. Your next peak hour starts at <ThemedText style={{ fontWeight: 'bold' }}>6:00 PM</ThemedText>.
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#10b981" />
        </TouchableOpacity>
      </ThemedView>

    </ParallaxScrollView>
  );
}

/**
 * Updated Reusable Action Button Component to accept onPress
 */
function ActionButton({ icon, label, color, onPress }: { icon: any, label: string, color: string, onPress?: () => void }) {
  return (
    <TouchableOpacity 
      style={styles.actionButton} 
      activeOpacity={0.7} 
      onPress={onPress} // 4. Apply the onPress handler
    >
      <View style={[styles.iconCircle, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <ThemedText style={styles.actionLabel}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ... (Your existing styles remain exactly the same)
  headerOverlay: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  headerIcon: {
    position: 'absolute',
    right: -30,
    bottom: -20,
  },
  headerTextContainer: {
    backgroundColor: 'transparent',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginTop: 4,
    fontWeight: '500',
  },
  usageCard: {
    backgroundColor: '#155E75',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 8,
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  usageValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  usageUnit: {
    fontSize: 12,
    color: '#bae6fd',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionContainer: {
    marginTop: 28,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '23%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});