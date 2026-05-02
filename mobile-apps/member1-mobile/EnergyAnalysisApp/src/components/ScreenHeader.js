import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONTS, SHADOW } from '../utils/theme';

const ScreenHeader = ({ 
  title, 
  subtitle, 
  onBack, 
  rightElement, 
  badge,
  backgroundColor = 'transparent',
  showBorder = false,
  titleStyle,
  subtitleStyle,
  containerStyle,
}) => {
  return (
    <View style={[
      styles.header, 
      { 
        backgroundColor, 
        borderBottomWidth: showBorder ? 1 : 0,
      },
      containerStyle
    ]}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity 
            onPress={onBack} 
            style={styles.backBtn} 
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.iconCircle}>
              <ArrowLeft size={20} color={COLORS.textPrimary} />
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, titleStyle]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>}
        </View>
      </View>
      
      <View style={styles.right}>
        {badge && (
          <View style={[styles.badge, { backgroundColor: (badge.color || COLORS.primary) + '15', borderColor: (badge.color || COLORS.primary) + '30' }]}>
            <Text style={[styles.badgeText, { color: badge.color || COLORS.primary }]}>{badge.label}</Text>
          </View>
        )}
        {rightElement}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 15,
    paddingBottom: SPACING.md,
    borderBottomColor: COLORS.border,
    zIndex: 100,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: SPACING.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...FONTS.bold,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
    ...FONTS.medium,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    ...FONTS.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default ScreenHeader;

