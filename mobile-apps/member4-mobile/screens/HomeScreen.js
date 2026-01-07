import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text } from 'react-native-paper';
import Header from '../components/Header';
import HeroWeatherCard from '../components/HeroWeatherCard';
import SmartRiskIndicator from '../components/SmartRiskIndicator';
import HapticButton from '../components/HapticButton';
import SafetyCardStack from '../components/SafetyCardStack';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Header title="Safety Assistant" />
      <ScrollView contentContainerStyle={styles.content}>
        <HeroWeatherCard temperature={28} condition="Light Rain" location="Colombo" weatherType="rainy" />

        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <SmartRiskIndicator score={72} />
            </View>
            <View style={{ width: 140 }}>
              <Text style={{ fontWeight: '700', marginBottom: 8 }}>Safety Actions</Text>
              <HapticButton style={{ backgroundColor: '#fff', padding: 12, borderRadius: 12 }} onPress={() => navigation.navigate('SafetyTips')}>
                <Text>View Actions</Text>
              </HapticButton>
              <View style={{ height: 8 }} />
              <HapticButton style={{ backgroundColor: '#fff', padding: 12, borderRadius: 12 }} onPress={() => navigation.navigate('Emergency')}>
                <Text>Emergency</Text>
              </HapticButton>
            </View>
          </View>

          {/* Safety Card Stack (swipe to dismiss / save) */}
          <SafetyCardStack items={[
            { id: 'a1', title: 'Unplug sensitive devices', body: 'Disconnect routers and expensive electronics during storms.', priority: 'HIGH' },
            { id: 'a2', title: 'Move appliances up', body: 'Elevate appliances if flood is expected.' },
            { id: 'a3', title: 'Prepare emergency kit', body: 'Flashlight, battery bank, first aid.' },
          ]} onComplete={(action) => {/* optionally handle */}} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f6f9' },
  content: { padding: 16 },
});
