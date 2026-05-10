import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { COLORS, FONTS } from '../../utils/theme';

export default function SimpleCard({ title, subtitle, leftIcon, rightElement, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {(title || subtitle || leftIcon || rightElement) && (
        <View style={styles.headerRow}>
          <View style={styles.leftHeader}>
            {leftIcon ? <IconButton icon={leftIcon} size={28} iconColor={COLORS.primary} style={{ margin: 0 }} /> : null}
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
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  leftHeader: { flexDirection: 'row', alignItems: 'center' },
  rightHeader: { marginLeft: 8 },
  title: {
    fontSize: 16,
    ...FONTS.bold,
    color: COLORS.textPrimary
  },
  subtitle: { fontSize: 12, color: COLORS.textSecondary },
  content: {
    // content container
  }
});
