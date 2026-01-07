import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import PropTypes from 'prop-types';

export default function Onboarding1({ navigation }) {
  return (
    <View style={styles.container}>
      <Text variant="headlineLarge">Welcome</Text>
      <Text style={{ marginTop: 12 }}>Your Personal Electrical Safety Assistant</Text>
      <View style={{ height: 24 }} />
      <Button mode="contained" onPress={() => navigation.navigate('Onboarding2')}>Next</Button>
    </View>
  );
}

Onboarding1.propTypes = { navigation: PropTypes.object };

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 } });
