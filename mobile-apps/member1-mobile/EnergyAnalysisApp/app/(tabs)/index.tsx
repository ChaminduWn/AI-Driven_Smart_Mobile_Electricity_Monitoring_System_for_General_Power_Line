import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { Zap, Camera, TrendingUp, Activity, Target } from 'lucide-react-native';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button'
import { colors, spacing, borderRadius, fontSize } from '../../constants/theme';

export default function DashboardScreen() {
  const [accountNumber, setAccountNumber] = useState('123456789');

  const handleUpload = () => {
    Alert.alert('Upload', 'Image picker coming soon!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Zap color="#FFFFFF" size={40} />
          </View>
          <Text style={styles.heroTitle}>Smart Monitor</Text>
          <Text style={styles.heroSubtitle}>AI-Powered Analysis</Text>
        </View>

        {/* Account Input */}
        <Card>
          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="Enter account"
            placeholderTextColor={colors.textTertiary}
          />
        </Card>

        {/* Upload Section */}
        <Card>
          <View style={styles.cardHeader}>
            <Camera color={colors.blue} size={24} />
            <Text style={styles.cardTitle}>Upload Bill</Text>
          </View>
          <Button variant="primary" onPress={handleUpload} icon={Camera}>
            Scan or Upload
          </Button>
        </Card>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard icon={Zap} label="Units" value="245 kWh" color={colors.blue} />
          <StatCard icon={TrendingUp} label="Cost" value="Rs. 3,250" color={colors.green} />
          <StatCard icon={Activity} label="Daily" value="8.2 kWh" color={colors.purple} />
          <StatCard icon={Target} label="Budget" value="On Track" color={colors.teal} />
        </View>

        {/* Recent Bills */}
        <Text style={styles.sectionTitle}>Recent Bills</Text>
        <Card>
          <BillItem date="Dec 15, 2024" units="245 kWh" cost="Rs. 3,250" />
          <BillItem date="Nov 15, 2024" units="228 kWh" cost="Rs. 3,050" />
        </Card>
      </View>
    </ScrollView>
  );
}

function BillItem({ date, units, cost }: { date: string; units: string; cost: string }) {
  return (
    <View style={styles.listItem}>
      <View>
        <Text style={styles.listItemTitle}>{date}</Text>
        <Text style={styles.listItemSubtitle}>30 days</Text>
      </View>
      <View style={styles.listItemRight}>
        <Text style={styles.listItemValue}>{units}</Text>
        <Text style={styles.listItemCost}>{cost}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    color: '#E9D5FF',
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
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
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
  listItemRight: {
    alignItems: 'flex-end',
  },
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