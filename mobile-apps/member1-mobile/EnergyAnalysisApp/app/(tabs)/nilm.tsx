import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Activity, Zap, TrendingUp, Target } from 'lucide-react-native';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export default function NILMDashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Activity color="#FFFFFF" size={40} />
          <Text style={styles.heroTitle}>AI Disaggregation</Text>
          <Text style={styles.heroSubtitle}>NILM Technology</Text>
        </View>

        <Card>
          <Text style={styles.cardTitle}>System Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>✓ Ready</Text>
            </View>
          </View>

          <View style={styles.checklistItem}>
            <Text style={styles.checklistIcon}>✓</Text>
            <Text style={styles.checklistText}>Appliances: 12 registered</Text>
          </View>
          <View style={styles.checklistItem}>
            <Text style={styles.checklistIcon}>✓</Text>
            <Text style={styles.checklistText}>Bills: 3 uploaded</Text>
          </View>
        </Card>

        <View style={styles.statsGrid}>
          <StatCard icon={Zap} label="Total" value="245 kWh" color={colors.purple} />
          <StatCard icon={Activity} label="Accounted" value="92%" color={colors.green} />
          <StatCard icon={TrendingUp} label="Accuracy" value="87%" color={colors.blue} />
          <StatCard icon={Target} label="Confidence" value="HIGH" color={colors.teal} />
        </View>

        <Button variant="primary" onPress={() => {}} icon={Activity}>
          Run Analysis
        </Button>

        <Card style={{ backgroundColor: colors.blue + '20', borderColor: colors.blue }}>
          <Text style={styles.infoTitle}>💡 How NILM Works</Text>
          <Text style={styles.infoText}>
            Uses AI to break down total electricity into individual appliances without hardware.
          </Text>
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
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.green + '20',
  },
  statusText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.green,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  checklistIcon: {
    fontSize: fontSize.xl,
    color: colors.green,
  },
  checklistText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});