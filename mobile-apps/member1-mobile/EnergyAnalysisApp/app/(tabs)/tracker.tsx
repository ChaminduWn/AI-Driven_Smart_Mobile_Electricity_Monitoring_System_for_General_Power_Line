import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Target, Zap, Activity, TrendingUp } from 'lucide-react-native';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export default function ProgressTrackerScreen() {
  const [reading, setReading] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Target color="#FFFFFF" size={40} />
          <Text style={styles.heroTitle}>Progress Tracker</Text>
          <Text style={styles.heroSubtitle}>Stay on budget</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon={Target} label="Target" value="Rs. 3,000" color={colors.purple} />
          <StatCard icon={Zap} label="Daily kWh" value="6.5" color={colors.blue} />
          <StatCard icon={Activity} label="Daily Cost" value="Rs. 100" color={colors.green} />
          <StatCard icon={TrendingUp} label="Period" value="30 days" color={colors.teal} />
        </View>

        <Card>
          <Text style={styles.cardTitle}>Record Reading</Text>
          
          <Text style={styles.label}>Meter Reading</Text>
          <TextInput
            style={styles.input}
            value={reading}
            onChangeText={setReading}
            placeholder="Enter current reading"
            keyboardType="numeric"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any observations..."
            placeholderTextColor={colors.textTertiary}
          />

          <Button variant="primary" onPress={() => {}}>
            Submit Reading
          </Button>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Current Progress</Text>
          <View style={styles.progressBarLarge}>
            <View style={[styles.progressFillLarge, { width: '65%' }]} />
          </View>
          <Text style={styles.progressLabel}>65% of budget used</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>15</Text>
              <Text style={styles.statLabel}>Days Passed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Rs. 1,950</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    color: '#E9D5FF',
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    marginBottom: spacing.lg,
  },
  progressBarLarge: {
    height: 32,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: colors.green,
  },
  progressLabel: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
});