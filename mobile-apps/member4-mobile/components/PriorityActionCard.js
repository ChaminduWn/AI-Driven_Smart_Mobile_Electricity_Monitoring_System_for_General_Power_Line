import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

export default function PriorityActionCard({ title, body, ctaLabel, onPress }) {
  return (
    <View style={styles.card}>
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <Button mode="contained" onPress={onPress}>{ctaLabel}</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 3 },
  title: { fontWeight: '700', fontSize: 16 },
  body: { color: '#666', marginTop: 6, marginBottom: 8 }
});