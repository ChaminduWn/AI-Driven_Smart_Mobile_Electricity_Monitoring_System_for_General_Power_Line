import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Users, Zap, Activity, TrendingUp, Plus } from 'lucide-react-native';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export default function HouseholdAnalyzerScreen() {
  const members = [
    { id: 1, emoji: '👨‍💼', type: 'Male - Working', age: '35', weekday: '12h', weekend: '24h' },
    { id: 2, emoji: '👩‍💼', type: 'Female - Working', age: '32', weekday: '10h', weekend: '24h' },
    { id: 3, emoji: '👦', type: 'Child - School', age: '10', weekday: '16h', weekend: '24h' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Users color="#FFFFFF" size={40} />
          <Text style={styles.heroTitle}>Household Analyzer</Text>
          <Text style={styles.heroSubtitle}>Energy by composition</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon={Users} label="Members" value="4" color={colors.blue} />
          <StatCard icon={Zap} label="Daily Est." value="8.2 kWh" color={colors.purple} />
          <StatCard icon={Activity} label="Monthly" value="246 kWh" color={colors.yellow} />
          <StatCard icon={TrendingUp} label="Synergy" value="85%" color={colors.green} />
        </View>

        <Button variant="primary" onPress={() => {}} icon={Plus}>
          Add Household Member
        </Button>

        <Text style={styles.sectionTitle}>Household Members</Text>
        <Card>
          {members.map(member => (
            <View key={member.id} style={styles.memberItem}>
              <Text style={styles.memberEmoji}>{member.emoji}</Text>
              <View style={styles.memberInfo}>
                <Text style={styles.memberType}>{member.type}</Text>
                <Text style={styles.memberDetail}>Age: {member.age}</Text>
                <View style={styles.memberHours}>
                  <Text style={styles.memberHourText}>Weekday: {member.weekday}</Text>
                  <Text style={styles.memberHourText}>Weekend: {member.weekend}</Text>
                </View>
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
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberEmoji: {
    fontSize: 40,
    marginRight: spacing.lg,
  },
  memberInfo: {
    flex: 1,
  },
  memberType: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  memberDetail: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  memberHours: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  memberHourText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});