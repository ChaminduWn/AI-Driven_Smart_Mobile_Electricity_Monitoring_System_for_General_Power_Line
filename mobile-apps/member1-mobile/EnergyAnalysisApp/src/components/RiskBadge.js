import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const colors = {
  low: '#2ecc71',
  medium: '#f39c12',
  high: '#e74c3c',
  critical: '#8b0000'
};

export default function RiskBadge({ level = 'low' }) {
  const safeLevel = typeof level === 'string' ? level.toLowerCase() : 'low';
  const color = colors[safeLevel] || colors.low;
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{safeLevel.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 12 }
});