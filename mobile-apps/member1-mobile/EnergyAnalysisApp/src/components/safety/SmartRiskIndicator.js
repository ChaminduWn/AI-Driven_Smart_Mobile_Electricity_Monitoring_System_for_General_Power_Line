import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../../constants/safety/Colors';
import PropTypes from 'prop-types';

export default function SmartRiskIndicator({ score = 40, size = 120 }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  let level = 'LOW';
  if (progress >= 80) level = 'CRITICAL';
  else if (progress >= 60) level = 'HIGH';
  else if (progress >= 30) level = 'MODERATE';
  const color = COLORS.risk[level].icon;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} strokeOpacity={0.18} stroke={color} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textWrap} pointerEvents="none">
        <Text style={{ fontSize: 20, fontWeight: '700', color }}>{level}</Text>
        <Text style={{ color: COLORS.text.secondary }}>{score}%</Text>
      </View>
    </View>
  );
}

SmartRiskIndicator.propTypes = {
  score: PropTypes.number,
  size: PropTypes.number,
};

const styles = StyleSheet.create({
  textWrap: { position: 'absolute', alignItems: 'center', top: '38%' },
});
