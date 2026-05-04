import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { COLORS, FONTS } from '../utils/theme';
import SplashScreen from '../screens/SplashScreen';

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
import ProfileScreen from '../screens/ProfileScreen';

// ── Tariff Calculator ─────────────────────────────────────────────────────────
import TariffScreen from '../screens/TariffScreen';

// ── Solar Recommendation ──────────────────────────────────────────────────────
import SolarRecommendationScreen from '../screens/SolarRecommendationScreen';

// ── Safety & Disaster Management ─────────────────────────────────────────────
import SafetyManagementScreen from '../screens/SafetyManagementScreen';

// ── Safety Sub-Screens (from pre-dev / Member 4) ──────────────────────────────
import SafetyWeatherScreen from '../screens/safety/WeatherScreen';
import SafetyTipsScreen from '../screens/safety/SafetyTipsScreen';
import SafetyEmergencyScreen from '../screens/safety/EmergencyScreen';
import SafetyAppliancesScreen from '../screens/safety/SafetyAppliancesScreen';
import SafetyAssistantScreen from '../screens/safety/AssisScreen';

// ── Outage Reporting (from Member 2) ─────────────────────────────────────────
import BoardIssueReportScreen from '../screens/outage/BoardIssueReportScreen';
import LocationSelectionScreen from '../screens/outage/LocationSelectionScreen';
import BoardReportReviewScreen from '../screens/outage/BoardReportReviewScreen';
import SubCategoryScreen from '../screens/outage/SubCategoryScreen';
import AvailableElectriciansScreen from '../screens/outage/AvailableElectriciansScreen';
import TrackElectricianScreen from '../screens/outage/TrackElectricianScreen';
import ActivitiesScreen from '../screens/outage/ActivitiesScreen';
import ActivityDetailScreen from '../screens/outage/ActivityDetailScreen';
import ElectricianDashboard from '../screens/outage/ElectricianDashboard';
import ElectricianJobDetailsScreen from '../screens/outage/ElectricianJobDetailsScreen';
import RatingScreen from '../screens/outage/RatingScreen';
import ChatScreen from '../screens/outage/ChatScreen';

const Tab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

// ─── Tab config ───────────────────────────────────────────────────────────────
const TAB_CONFIG = [
  { name: 'Dashboard', label: 'Home', icon: '🏠' },
  { name: 'Bills', label: 'Bills', icon: '📄' },
  { name: 'Appliances', label: 'Devices', icon: '⚡' },
  { name: 'Tracking', label: 'Track', icon: '🎯' },
  { name: 'SmartInsights', label: 'AI', icon: '🤖' },
  { name: 'SafetyTab', label: 'Safety', icon: '🛡️' },
];

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

// ─── Safety Top Tab Navigator ─────────────────────────────────────────────────
const SafetyTopTabs = () => (
  <TopTab.Navigator
    screenOptions={{
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarStyle: { backgroundColor: COLORS.bg2 },
      tabBarIndicatorStyle: { backgroundColor: COLORS.primary, height: 3 },
      tabBarLabelStyle: { ...FONTS.bold, fontSize: 12, textTransform: 'none' },
    }}
  >
    <TopTab.Screen name="Assistant" component={SafetyAssistantScreen} options={{ title: 'Safety Assistant' }} />
    <TopTab.Screen name="Weather" component={SafetyWeatherScreen} options={{ title: 'Weather' }} />
    <TopTab.Screen name="Emergency" component={SafetyEmergencyScreen} options={{ title: 'Emergency' }} />
  </TopTab.Navigator>
);

// ─── Safety Stack ─────────────────────────────────────────────────────────────
const SafetyStack = () => (
  <Stack.Navigator screenOptions={sharedHeaderOptions}>
    <Stack.Screen
      name="SafetyHome"
      component={SafetyTopTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="Safety" component={SafetyManagementScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SafetyWeather" component={SafetyWeatherScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SafetyTips" component={SafetyTipsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SafetyEmergency" component={SafetyEmergencyScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SafetyAppliances" component={SafetyAppliancesScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SafetyAssistant" component={SafetyAssistantScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Solar" component={SolarRecommendationScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// ─── Dashboard Stack ──────────────────────────────────────────────────────────
const DashboardStack = () => (
  <Stack.Navigator screenOptions={sharedHeaderOptions}>
    <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ headerShown: false }} />
    <Stack.Screen name="BillDetail" component={BillDetailScreen} options={{ title: 'Bill Analysis' }} />
    <Stack.Screen name="Analysis" component={AnalysisScreen} options={{ title: 'Analysis' }} />
    <Stack.Screen name="Tariff" component={TariffScreen} options={{ headerShown: false }} />
    <Stack.Screen name="NILM" component={NILMScreen} options={{ title: 'NILM Disaggregation' }} />
    <Stack.Screen name="Solar" component={SolarRecommendationScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Safety" component={SafetyManagementScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="BoardIssueReport" component={BoardIssueReportScreen} options={{ headerShown: false }} />
    <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} options={{ headerShown: false }} />
    <Stack.Screen name="BoardReportReview" component={BoardReportReviewScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SubCategory" component={SubCategoryScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AvailableElectricians" component={AvailableElectriciansScreen} options={{ headerShown: false }} />
    <Stack.Screen name="TrackElectrician" component={TrackElectricianScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Activities" component={ActivitiesScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ElectricianDashboard" component={ElectricianDashboard} options={{ headerShown: false }} />
    <Stack.Screen name="ElectricianJobDetails" component={ElectricianJobDetailsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Rating" component={RatingScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// ─── Bills Stack ──────────────────────────────────────────────────────────────
const BillsStack = () => (
  <Stack.Navigator screenOptions={sharedHeaderOptions}>
    <Stack.Screen name="BillsList" component={BillsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="BillDetail" component={BillDetailScreen} options={{ title: 'Bill Analysis' }} />
    <Stack.Screen name="NILM" component={NILMScreen} options={{ title: 'NILM Disaggregation' }} />
  </Stack.Navigator>
);

// ─── Tracking Stack ───────────────────────────────────────────────────────────
const TrackingStack = () => (
  <Stack.Navigator screenOptions={sharedHeaderOptions}>
    <Stack.Screen name="TrackingHome" component={TrackingScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// ─── Smart Insights Stack ─────────────────────────────────────────────────────
const SmartInsightsStack = () => (
  <Stack.Navigator screenOptions={sharedHeaderOptions}>
    <Stack.Screen name="SmartInsightsHome" component={SmartInsightsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="LiveMeter" component={LiveMeterScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Analysis" component={AnalysisScreen} options={{ title: 'Analysis' }} />
    <Stack.Screen name="Tariff" component={TariffScreen} options={{ headerShown: false }} />
    <Stack.Screen name="NILM" component={NILMScreen} options={{ title: 'NILM Disaggregation' }} />
    <Stack.Screen name="Safety" component={SafetyManagementScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// ─── Main Tab Navigator ───────────────────────────────────────────────────────
const MainNavigator = () => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const tabHeight = 54 + bottomPad;

  return (
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
            height: tabHeight,
            paddingBottom: bottomPad,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
          headerStyle: { backgroundColor: COLORS.bg2 },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: { ...FONTS.semiBold, fontSize: 17 },
        };
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} options={{ headerShown: false }} />
      <Tab.Screen name="Bills" component={BillsStack} options={{ headerShown: false }} />
      <Tab.Screen
        name="Appliances"
        component={AppliancesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen name="Tracking" component={TrackingStack} options={{ headerShown: false }} />
      <Tab.Screen name="SmartInsights" component={SmartInsightsStack} options={{ headerShown: false }} />
      <Tab.Screen name="SafetyTab" component={SafetyStack} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

// ─── Root Navigator ───────────────────────────────────────────────────────────
const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const [minSplashDone, setMinSplashDone] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), 1100);
    return () => clearTimeout(t);
  }, []);

  if (loading || !minSplashDone) return <SplashScreen />;
  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;