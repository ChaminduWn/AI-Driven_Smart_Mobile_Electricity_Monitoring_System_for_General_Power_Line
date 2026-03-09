import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import PropTypes from 'prop-types';

export default function GlassCard({ children, style, blur = 20, tint = 'light', intensity = 80, ...props }) {
  return (
    <View style={[styles.wrapper, style]} {...props}>
      <BlurView intensity={intensity} tint={tint} style={styles.blur}>
        <View style={styles.inner}>{children}</View>
      </BlurView>
    </View>
  );
}

GlassCard.propTypes = {
  children: PropTypes.node,
  style: PropTypes.any,
  blur: PropTypes.number,
  tint: PropTypes.oneOf(['dark', 'light', 'default']),
  intensity: PropTypes.number,
};

const styles = StyleSheet.create({
  wrapper: { borderRadius: 12, overflow: 'hidden' },
  blur: { padding: 12 },
  inner: { minHeight: 44 },
});
