import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuth } from '../contexts/AuthContext';
import { COLORS, FONTS } from '../utils/theme';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main screens
import DashboardScreen from '../screens/DashboardScreen';
import BillsScreen from '../screens/BillsScreen';
import BillDetailScreen from '../screens/BillDetailScreen';
import AppliancesScreen from '../screens/AppliancesScreen';
import TrackingScreen from '../screens/TrackingScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import NILMScreen from '../screens/NILMScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

const TAB_ICONS = {
  Dashboard: '🏠',
  Bills: '📄',
  Appliances: '⚡',
  Tracking: '🎯',
  Analysis: '📊',
};

// ─── Auth Stack ───────────────────────────────────────────────────────────────
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// ─── Bills Stack (includes bill detail + NILM) ────────────────────────────────
const BillsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.bg2 },
      headerTintColor: COLORS.textPrimary,
      headerTitleStyle: { ...FONTS.semiBold, fontSize: 17 },
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen name="BillsList" component={BillsScreen} options={{ title: 'My Bills' }} />
    <Stack.Screen name="BillDetail" component={BillDetailScreen} options={{ title: 'Bill Analysis' }} />
    <Stack.Screen name="NILM" component={NILMScreen} options={{ title: 'NILM Disaggregation' }} />
  </Stack.Navigator>
);

// ─── Tracking Stack ───────────────────────────────────────────────────────────
const TrackingStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.bg2 },
      headerTintColor: COLORS.textPrimary,
      headerTitleStyle: { ...FONTS.semiBold, fontSize: 17 },
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen name="TrackingHome" component={TrackingScreen} options={{ title: 'Budget Tracking' }} />
  </Stack.Navigator>
);

// ─── Main Tab Navigator ───────────────────────────────────────────────────────
const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused }) => (
        <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
          {TAB_ICONS[route.name]}
        </Text>
      ),
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        backgroundColor: COLORS.bg2,
        borderTopColor: COLORS.border,
        height: 62,
        paddingBottom: 10,
        paddingTop: 6,
      },
      tabBarLabelStyle: { fontSize: 10, ...FONTS.medium },
      headerStyle: { backgroundColor: COLORS.bg2 },
      headerTintColor: COLORS.textPrimary,
      headerTitleStyle: { ...FONTS.semiBold, fontSize: 17 },
    })}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardStack}
      options={{ headerShown: false, title: 'Home' }}
    />
    <Tab.Screen
      name="Bills"
      component={BillsStack}
      options={{ headerShown: false }}
    />
    <Tab.Screen
      name="Appliances"
      component={AppliancesScreen}
      options={{ title: 'Appliances', headerStyle: { backgroundColor: COLORS.bg2 }, headerTintColor: COLORS.textPrimary }}
    />
    <Tab.Screen
      name="Tracking"
      component={TrackingStack}
      options={{ headerShown: false }}
    />
    <Tab.Screen
      name="Analysis"
      component={AnalysisStack}
      options={{ headerShown: false }}
    />
  </Tab.Navigator>
);

// Dashboard stack (allows nav to bills, etc.)
const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.bg2 },
      headerTintColor: COLORS.textPrimary,
      headerTitleStyle: { ...FONTS.semiBold },
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ headerShown: false }} />
    <Stack.Screen name="BillDetail" component={BillDetailScreen} options={{ title: 'Bill Analysis' }} />
    <Stack.Screen name="NILM" component={NILMScreen} options={{ title: 'NILM Disaggregation' }} />
  </Stack.Navigator>
);

const AnalysisStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.bg2 },
      headerTintColor: COLORS.textPrimary,
      headerTitleStyle: { ...FONTS.semiBold },
    }}
  >
    <Stack.Screen name="AnalysisHome" component={AnalysisScreen} options={{ title: 'Analysis & Tools' }} />
    <Stack.Screen name="NILM" component={NILMScreen} options={{ title: 'NILM Disaggregation' }} />
  </Stack.Navigator>
);

// ─── Loading Screen ───────────────────────────────────────────────────────────
const SplashScreen = () => (
  <View style={styles.splash}>
    <Text style={styles.splashIcon}>⚡</Text>
    <Text style={styles.splashTitle}>EnergyIQ</Text>
    <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
  </View>
);

// ─── Root Navigator ───────────────────────────────────────────────────────────
const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <SplashScreen />;

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.bg1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashIcon: { fontSize: 64 },
  splashTitle: {
    color: COLORS.textPrimary,
    fontSize: 36,
    ...FONTS.extraBold,
    marginTop: 16,
    letterSpacing: -1,
  },
});

export default RootNavigator;