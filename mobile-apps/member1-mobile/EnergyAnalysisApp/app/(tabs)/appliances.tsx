import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Zap, Camera, Plus, Activity, TrendingUp, Target } from 'lucide-react-native';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export default function ApplianceManagerScreen() {
  const appliances = [
    { id: 1, name: 'Living Room AC', category: 'Cooling', power: '1500W', kwh: '45.2', cost: 'Rs. 620' },
    { id: 2, name: 'Refrigerator', category: 'Cooling', power: '150W', kwh: '108.0', cost: 'Rs. 1,480' },
    { id: 3, name: 'LED TV', category: 'Entertainment', power: '100W', kwh: '15.0', cost: 'Rs. 205' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Zap color="#FFFFFF" size={40} />
          <Text style={styles.heroTitle}>Appliance Manager</Text>
          <Text style={styles.heroSubtitle}>Track energy usage</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon={Zap} label="Appliances" value="12" color={colors.blue} />
          <StatCard icon={Activity} label="Daily" value="8.5 kWh" color={colors.purple} />
          <StatCard icon={TrendingUp} label="Monthly" value="255 kWh" color={colors.yellow} />
          <StatCard icon={Target} label="Cost" value="Rs. 3,400" color={colors.green} />
        </View>

        <Button variant="primary" onPress={() => Alert.alert('Coming Soon')} icon={Camera}>
          Scan Appliance
        </Button>
        <View style={{ height: spacing.md }} />
        <Button variant="secondary" onPress={() => Alert.alert('Coming Soon')} icon={Plus}>
          Add Manually
        </Button>

        <Text style={styles.sectionTitle}>Your Appliances</Text>
        <Card>
          {appliances.map(app => (
            <View key={app.id} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <Text style={styles.listItemTitle}>{app.name}</Text>
                <Text style={styles.listItemSubtitle}>{app.category} • {app.power}</Text>
              </View>
              <View style={styles.listItemRight}>
                <Text style={styles.listItemValue}>{app.kwh} kWh</Text>
                <Text style={styles.listItemCost}>{app.cost}</Text>
              </View>
            </View>
          ))}
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
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemLeft: { flex: 1 },
  listItemTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  listItemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  listItemRight: { alignItems: 'flex-end' },
  listItemValue: {
    fontSize: fontSize.base,
    color: colors.blueLight,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  listItemCost: {
    fontSize: fontSize.base,
    color: colors.green,
    fontWeight: '600',
  },
});
