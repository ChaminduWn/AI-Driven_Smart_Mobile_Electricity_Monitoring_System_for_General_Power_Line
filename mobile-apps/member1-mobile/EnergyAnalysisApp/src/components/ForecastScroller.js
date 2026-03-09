import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';

export default function ForecastScroller({ items = [] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {items.map((it, i) => (
        <View key={i} style={styles.pill}>
          <Text style={{ fontWeight: '700', color: '#FFD700' }}>{it.label}</Text>
          <Text style={{ marginTop: 6, color: '#fff' }}>{it.temp}°</Text>
          <Text style={{ color: '#aaa', marginTop: 4 }}>{it.emoji}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, paddingHorizontal: 4 },
  pill: { width: 84, height: 100, borderRadius: 12, padding: 10, marginHorizontal: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16213e', borderWidth: 1, borderColor: '#FFD700' }
});