import React, { useRef, useEffect } from 'react';
import { Animated, View, Platform } from 'react-native';
import PropTypes from 'prop-types';

export default function PulsingDot({ color = '#10B981', size = 8, speed = 1000 }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: speed, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(scale, { toValue: 0.8, duration: speed, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale, speed]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: size * 3,
          height: size * 3,
          borderRadius: (size * 3) / 2,
          backgroundColor: color,
          opacity: 0.18,
          transform: [{ scale }],
          position: 'absolute',
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

PulsingDot.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
  speed: PropTypes.number,
};
