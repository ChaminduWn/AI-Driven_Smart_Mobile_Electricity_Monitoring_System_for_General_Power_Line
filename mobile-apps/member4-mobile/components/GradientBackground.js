import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';

export default function GradientBackground({ colors = ['#3B82F6', '#1E40AF'], style, children }) {
  return (
    <LinearGradient colors={colors} style={[styles.container, style]}>
      {children}
    </LinearGradient>
  );
}

GradientBackground.propTypes = {
  colors: PropTypes.arrayOf(PropTypes.string),
  style: PropTypes.any,
  children: PropTypes.node,
};

const styles = StyleSheet.create({ container: { flex: 1 } });
