import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';

export default function PriorityActionCard({ title, body, ctaLabel, onPress }) {
  return (
    <View style={styles.card}>
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <TouchableOpacity style={styles.ctaButton} onPress={onPress}>
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#16213e', borderRadius: 12, padding: 12, marginBottom: 12, elevation: 3, borderWidth: 1, borderColor: '#FFD700' },
  title: { fontWeight: '700', fontSize: 16, color: '#FFD700' },
  body: { color: '#aaa', marginTop: 6, marginBottom: 8 },
  ctaButton: { backgroundColor: '#FFD700', borderRadius: 20, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#000', fontWeight: '600' }
});