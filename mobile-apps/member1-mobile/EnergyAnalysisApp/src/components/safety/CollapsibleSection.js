import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';

export default function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <IconButton icon={open ? 'chevron-up' : 'chevron-down'} onPress={() => setOpen(!open)} />
      </View>
      {open ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, backgroundColor: '#fff', borderRadius: 8 },
  title: { fontWeight: '700' },
  content: { padding: 8 }
});