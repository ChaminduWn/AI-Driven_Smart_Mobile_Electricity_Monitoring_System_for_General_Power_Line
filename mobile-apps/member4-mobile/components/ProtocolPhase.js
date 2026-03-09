import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';

export default function ProtocolPhase({ phase, title, items = [], open = false }) {
  return (
    <View style={[styles.container, open ? styles.open : null]}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.icon}><Text>{phase}</Text></View>
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.phase}>PHASE {phase}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>
        <IconButton icon={open ? 'chevron-up' : 'chevron-down'} onPress={() => { /* toggled by parent if needed */ }} />
      </View>
      <View style={styles.body}>
        {items.map((it, i) => (
          <View key={i} style={styles.itemRow}>
            <View style={styles.dot} />
            <Text style={styles.itemText}>{it}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eef6ff', alignItems: 'center', justifyContent: 'center' },
  phase: { fontSize: 12, color: '#f39c12', fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '700' },
  body: { marginTop: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, backgroundColor: '#f6fbff', borderRadius: 8, marginBottom: 8, paddingHorizontal: 10 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2ecc71', marginRight: 10 },
  itemText: { flex: 1 }
});