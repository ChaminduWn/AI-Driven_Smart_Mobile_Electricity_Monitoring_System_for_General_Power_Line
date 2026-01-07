import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import Header from '../components/Header';
import SimpleCard from '../components/SimpleCard';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Header title="Safety Assistant" />
      <View style={styles.content}>
        <SimpleCard style={styles.hero}>
          <Text variant="headlineLarge">Weather-aware Safety</Text>
          <Text style={{ marginTop: 8 }} variant="bodyMedium">Get weather reports, electrical hazard warnings and emergency protocols tailored to your location.</Text>
          <View style={{ marginTop: 16 }}>
            <Button mode="contained" onPress={() => navigation.navigate('Weather')} style={{ marginBottom: 8 }}>Check Current Weather</Button>
            <Button mode="outlined" onPress={() => navigation.navigate('SafetyTips')} style={{ marginBottom: 8 }}>General Safety Tips</Button>
            <Button mode="outlined" onPress={() => navigation.navigate('Emergency')}>Emergency Protocols</Button>
          </View>
        </SimpleCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f6f9' },
  content: { padding: 16, flex: 1, justifyContent: 'center' },
  hero: { borderRadius: 12, padding: 8 }
});
