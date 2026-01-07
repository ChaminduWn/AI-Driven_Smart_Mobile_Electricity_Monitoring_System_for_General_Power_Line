import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import PropTypes from 'prop-types';

export default function Onboarding3({ navigation }) {
  return (
    <View style={styles.container}>
      <Text variant="headlineLarge">Permissions</Text>
      <Text style={{ marginTop: 12 }}>We need location to provide local safety alerts and weather-based guidance.</Text>
      <View style={{ height: 24 }} />
      <Button mode="contained" onPress={() => navigation.replace('Home')}>Finish</Button>
    </View>
  );
}

Onboarding3.propTypes = { navigation: PropTypes.object };

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 } });
