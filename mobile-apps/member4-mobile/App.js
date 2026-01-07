import React from 'react';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import WeatherScreen from './screens/WeatherScreen';
import SafetyTipsScreen from './screens/SafetyTipsScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import AppliancesScreen from './screens/AppliancesScreen';
import AssistantScreen from './screens/AssistantScreen';
import BottomNav from './components/BottomNav';
import Onboarding1 from './screens/Onboarding1';
import Onboarding2 from './screens/Onboarding2';
import Onboarding3 from './screens/Onboarding3';

const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0066cc',
    secondary: '#00a3a3',
    background: '#f6fbff'
  }
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding1" component={Onboarding1} />
          <Stack.Screen name="Onboarding2" component={Onboarding2} />
          <Stack.Screen name="Onboarding3" component={Onboarding3} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Weather" component={WeatherScreen} />
          <Stack.Screen name="SafetyTips" component={SafetyTipsScreen} />
          <Stack.Screen name="Emergency" component={EmergencyScreen} />
          <Stack.Screen name="Appliances" component={AppliancesScreen} />
          <Stack.Screen name="Assistant" component={AssistantScreen} />
        </Stack.Navigator>
        <BottomNav />
      </NavigationContainer>
    </PaperProvider>
  );
}
