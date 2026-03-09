import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export default function BottomNav() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <IconButton icon="home" size={22} onPress={() => navigation.navigate('Safety')} />
      <IconButton icon="view-grid" size={22} onPress={() => navigation.navigate('SafetyAppliances')} />
      <IconButton icon="lightbulb" size={22} onPress={() => navigation.navigate('SafetyWeather')} />
      <IconButton icon="account" size={22} onPress={() => navigation.navigate('SafetyAssistant')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 16, right: 16, bottom: 16, backgroundColor: '#fff', borderRadius: 40, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-around', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 }
});