import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuth } from '../contexts/AuthContext';
import { COLORS, FONTS } from '../utils/theme';

// ── Auth Screens ──────────────────────────────────────────────────────────────
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// ── Main Screens ──────────────────────────────────────────────────────────────
import DashboardScreen from '../screens/DashboardScreen';
import BillsScreen from '../screens/BillsScreen';
import BillDetailScreen from '../screens/BillDetailScreen';
import AppliancesScreen from '../screens/AppliancesScreen';
import TrackingScreen from '../screens/TrackingScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import NILMScreen from '../screens/NILMScreen';
import SmartInsightsScreen from '../screens/SmartInsightsScreen';
import LiveMeterScreen from '../screens/LiveMeterScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

// ─── Tab config (5 tabs — SmartInsights replaces Analysis as its own tab) ────
// Analysis is still reachable via the Dashboard quick actions
const TAB_CONFIG = [
  { name: 'Dashboard',     label: 'Home',     icon: '🏠' },
  { name: 'Bills',         label: 'Bills',    icon: '📄' },
  { name: 'Appliances',    label: 'Devices',  icon: '⚡' },
  { name: 'Tracking',      label: 'Track',    icon: '🎯' },
  { name: 'SmartInsights', label: 'AI',       icon: '🤖' },

];

// ─── Loading Screen ───────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// ─── Auth Navigator ───────────────────────────────────────────────────────────
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// ─── Shared header options ────────────────────────────────────────────────────
const sharedHeaderOptions = {
  headerStyle: { backgroundColor: COLORS.bg2 },
  headerTintColor: COLORS.textPrimary,
  headerTitleStyle: { ...FONTS.semiBold, fontSize: 17 },
  headerBackTitleVisible: false,
};

// ─── Dashboard Stack ──────────────────────────────────────────────────────────
const DashboardStack = () => (
  <Stack.Navigator screenOptions={sharedHeaderOptions}>
    <Stack.Screen
      name="DashboardHome"
      component={DashboardScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="BillDetail"
      component={BillDetailScreen}
      options={{ title: 'Bill Analysis' }}
    />
    <Stack.Screen
      name="Analysis"
      component={AnalysisScreen}
      options={{ title: 'Analysis' }}
    />
    <Stack.Screen
      name="NILM"
      component={NILMScreen}
      options={{ title: 'NILM Disaggregation' }}
    />
  </Stack.Navigator>
);

// ─── Bills Stack ──────────────────────────────────────────────────────────────
const BillsStack = () => (
  <Stack.Navigator screenOptions={sharedHeaderOptions}>
    <Stack.Screen
      name="BillsList"
      component={BillsScreen}
      options={{ title: 'My Bills' }}
    />
    <Stack.Screen
      name="BillDetail"
      component={BillDetailScreen}
      options={{ title: 'Bill Analysis' }}
    />
    <Stack.Screen
      name="NILM"
      component={NILMScreen}
      options={{ title: 'NILM Disaggregation' }}
    />
  </Stack.Navigator>
);

// ─── Tracking Stack ───────────────────────────────────────────────────────────
const TrackingStack = () => (
  <Stack.Navigator screenOptions={sharedHeaderOptions}>
    <Stack.Screen
      name="TrackingHome"
      component={TrackingScreen}
      options={{ title: 'Bill Tracking' }}
    />
  </Stack.Navigator>
);

// ─── Smart Insights Stack ─────────────────────────────────────────────────────
const SmartInsightsStack = () => (
  <Stack.Navigator screenOptions={sharedHeaderOptions}>
    <Stack.Screen
      name="SmartInsightsHome"
      component={SmartInsightsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="LiveMeter"
      component={LiveMeterScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Analysis"
      component={AnalysisScreen}
      options={{ title: 'Analysis' }}
    />
    <Stack.Screen
      name="NILM"
      component={NILMScreen}
      options={{ title: 'NILM Disaggregation' }}
    />
  </Stack.Navigator>
);

// ─── Main Tab Navigator ───────────────────────────────────────────────────────
const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => {
      const tabItem = TAB_CONFIG.find((t) => t.name === route.name);
      return {
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>
            {tabItem?.icon ?? '•'}
          </Text>
        ),
        tabBarLabel: tabItem?.label ?? route.name,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.bg2,
          borderTopColor: COLORS.border || '#2A3347',
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        headerStyle: { backgroundColor: COLORS.bg2 },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { ...FONTS.semiBold, fontSize: 17 },
      };
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardStack}
      options={{ headerShown: false }}
    />
    <Tab.Screen
      name="Bills"
      component={BillsStack}
      options={{ headerShown: false }}
    />
    <Tab.Screen
      name="Appliances"
      component={AppliancesScreen}
      options={{
        title: 'Appliances',
        headerStyle: { backgroundColor: COLORS.bg2 },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { ...FONTS.semiBold, fontSize: 17 },
      }}
    />
    <Tab.Screen
      name="Tracking"
      component={TrackingStack}
      options={{ headerShown: false }}
    />
    <Tab.Screen
      name="SmartInsights"
      component={SmartInsightsStack}
      options={{ headerShown: false }}
    />
  </Tab.Navigator>
);

// ─── Root Navigator ───────────────────────────────────────────────────────────
const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg0 || '#0A0E1A',
    gap: 12,
  },
  loadingText: {
    color: COLORS.textSecondary || '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RootNavigator;