import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import PropTypes from 'prop-types';

export default function SkeletonLoader({ width = '100%', height = 16, style, animate = true }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!animate) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [animate, opacity]);

  return (
    <Animated.View style={[{ width, height, borderRadius: 8, backgroundColor: '#e6e9ee', opacity }, style]} />
  );
}

SkeletonLoader.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.number,
  style: PropTypes.any,
  animate: PropTypes.bool,
};

const styles = StyleSheet.create({});
