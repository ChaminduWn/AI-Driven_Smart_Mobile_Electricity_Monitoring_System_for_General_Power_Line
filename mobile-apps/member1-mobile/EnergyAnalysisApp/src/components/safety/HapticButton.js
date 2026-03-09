import React, { useRef } from 'react';
import { Animated, Pressable, Text, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';

export default function HapticButton({ children, onPress, scaleOnPress = 0.97, hapticType = 'impactMedium', style, ...props }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: scaleOnPress, useNativeDriver: Platform.OS !== 'web' }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: Platform.OS !== 'web' }).start();
  };

  const handlePress = (e) => {
    Haptics.selectionAsync();
    if (onPress) onPress(e);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress} {...props}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {typeof children === 'string' ? <Text>{children}</Text> : children}
      </Animated.View>
    </Pressable>
  );
}

HapticButton.propTypes = {
  children: PropTypes.node,
  onPress: PropTypes.func,
  scaleOnPress: PropTypes.number,
  hapticType: PropTypes.string,
  style: PropTypes.any,
};