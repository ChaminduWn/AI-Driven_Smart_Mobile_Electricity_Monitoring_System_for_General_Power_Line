import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize } from '../../constants/theme';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color?: string;
}

export default function StatCard({ icon: Icon, label, value, color = colors.blue }: StatCardProps) {
  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      <Icon color={color} size={24} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flex: 1,
    minWidth: '45%',
    borderLeftWidth: 4,
    borderColor: colors.border,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  value: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
});
