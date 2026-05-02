import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { COLORS, FONTS } from '../../utils/theme';

export default function ProtocolPhase({ phase, title, items = [], open = false }) {
  return (
    <View style={[styles.container, open ? styles.open : null]}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.icon}><Text style={{ color: COLORS.primary, fontWeight: '800' }}>{phase}</Text></View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.phase}>PHASE {phase}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>
        <IconButton icon={open ? 'chevron-up' : 'chevron-down'} iconColor={COLORS.textSecondary} />
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
  container: { backgroundColor: COLORS.bg2, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center' },
  phase: { fontSize: 11, color: COLORS.primary, ...FONTS.bold, letterSpacing: 1 },
  title: { fontSize: 16, ...FONTS.bold, color: COLORS.textPrimary },
  body: { marginTop: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, backgroundColor: COLORS.bg3 + '40', borderRadius: 12, marginBottom: 8, paddingHorizontal: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 12, marginTop: 7 },
  itemText: { flex: 1, color: COLORS.textPrimary, fontSize: 14, lineHeight: 20 }
});