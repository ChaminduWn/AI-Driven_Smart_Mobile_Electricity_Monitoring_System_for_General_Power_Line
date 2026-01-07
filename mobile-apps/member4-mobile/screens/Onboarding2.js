import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import PropTypes from 'prop-types';

export default function Onboarding2({ navigation }) {
  return (
    <View style={styles.container}>
      <Text variant="headlineLarge">How it Works</Text>
      <Text style={{ marginTop: 12 }}>Real-time weather monitoring • Instant safety alerts • Emergency protocols</Text>
      <View style={{ height: 24 }} />
      <Button mode="contained" onPress={() => navigation.navigate('Onboarding3')}>Next</Button>
    </View>
  );
}

Onboarding2.propTypes = { navigation: PropTypes.object };

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 } });
