import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';

export default function SimpleCard({ title, subtitle, leftIcon, rightElement, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {(title || subtitle || leftIcon || rightElement) && (
        <View style={styles.headerRow}>
          <View style={styles.leftHeader}>
            {leftIcon ? <IconButton icon={leftIcon} size={28} style={{ margin: 0 }} /> : null}
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
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  leftHeader: { flexDirection: 'row', alignItems: 'center' },
  rightHeader: { marginLeft: 8 },
  title: {
    fontSize: 16,
    fontWeight: '700'
  },
  subtitle: { fontSize: 12, color: '#666' },
  content: {
    // content container
  }
});
