import React, { useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import PropTypes from 'prop-types';

export default function LottiePlayer({ source, style, loop = true }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && source) {
      ref.current.play();
    }
  }, [source]);

  if (!source) {
    return (
      <View style={[{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Text style={{ fontSize: 36 }}>🌦️</Text>
      </View>
    );
  }

  return <LottieView ref={ref} source={source} autoPlay loop={loop} style={style} />;
}

LottiePlayer.propTypes = {
  source: PropTypes.any,
  style: PropTypes.any,
  loop: PropTypes.bool,
};
