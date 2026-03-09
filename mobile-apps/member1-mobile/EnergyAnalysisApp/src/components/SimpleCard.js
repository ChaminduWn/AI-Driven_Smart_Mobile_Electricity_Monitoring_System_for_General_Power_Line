import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';

export default function SimpleCard({ title, subtitle, leftIcon, rightElement, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {(title || subtitle || leftIcon || rightElement) && (
        <View style={styles.headerRow}>
          <View style={styles.leftHeader}>
            {leftIcon ? <IconButton icon={leftIcon} size={28} style={{ margin: 0 }} iconColor="#FFD700" /> : null}
            <View>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          </View>
          {rightElement ? <View style={styles.rightHeader}>{rightElement}</View> : null}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 14,
    elevation: 3,
    marginBottom: 12
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  leftHeader: { flexDirection: 'row', alignItems: 'center' },
  rightHeader: { marginLeft: 8 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700'
  },
  subtitle: { fontSize: 12, color: '#aaa', marginTop: 2 },
  content: {
    // content container
  }
});
