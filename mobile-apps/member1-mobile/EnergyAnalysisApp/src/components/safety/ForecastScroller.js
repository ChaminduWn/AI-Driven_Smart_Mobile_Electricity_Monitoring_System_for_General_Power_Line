import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';

export default function ForecastScroller({ items = [] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {items.map((it, i) => (
        <View key={i} style={styles.pill}>
          <Text style={{ fontWeight: '800', color: '#FFD700', fontSize: 13 }}>{it.label}</Text>
          <Text style={{ marginTop: 6, color: '#ffffff', fontWeight: '700' }}>{it.temp}°</Text>
          <Text style={{ marginTop: 6, fontSize: 18 }}>{it.emoji}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, paddingLeft: 0 },
  pill: { width: 84, height: 100, borderRadius: 16, padding: 10, marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16213e', borderWidth: 1, borderColor: 'rgba(255,215,0,0.1)' }
});