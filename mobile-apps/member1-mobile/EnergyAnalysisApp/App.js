import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider, MD3DarkTheme, ActivityIndicator } from 'react-native-paper';
import { Home, Zap, BarChart2, Activity, Calculator, FileText } from 'lucide-react-native';
import { View } from 'react-native';

// Auth
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Screens
import Login from './src/screens/Login';
import Register from './src/screens/Register';
import Dashboard from './src/screens/Dashboard';
import Appliances from './src/screens/ApplianceManager';
import Analysis from './src/screens/Analysis';
import Tracking from './src/screens/Tracking';
import TariffCalculator from './src/screens/TariffCalculator';
import BillManagement from './src/screens/BillManagement';
import BudgetPlanner from './src/screens/BudgetPlanner';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack for Auth
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
);

// Stack for Bill Lifecycle
const BillStack = () => (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#111827' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="BillHistory" component={BillManagement} options={{ title: 'My Bills' }} />
        <Stack.Screen name="BudgetPlanner" component={BudgetPlanner} options={{ title: 'Plan Budget' }} />
    </Stack.Navigator>
);

// Stack for Tracking & Analysis
const TrackingStack = () => (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#111827' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="ProgressTracker" component={Tracking} options={{ title: 'Real-time Tracking' }} />
        <Stack.Screen name="EnergyAnalysis" component={Analysis} options={{ title: 'AI Insights' }} />
    </Stack.Navigator>
);

const theme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#3B82F6',
        secondary: '#8B5CF6',
    },
};

const Navigation = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <NavigationContainer theme={MD3DarkTheme}>
            {isAuthenticated ? (
                <Tab.Navigator
                    screenOptions={{
                        tabBarActiveTintColor: '#3B82F6',
                        tabBarInactiveTintColor: '#9CA3AF',
                        tabBarLabelStyle: { fontSize: 10 },
                        tabBarStyle: {
                            backgroundColor: '#1F2937',
                            borderTopColor: '#374151',
                            height: 60,
                            paddingBottom: 8,
                        },
                        headerStyle: {
                            backgroundColor: '#111827',
                        },
                        headerTintColor: '#fff',
                    }}
                >
                    <Tab.Screen
                        name="Dashboard"
                        component={Dashboard}
                        options={{
                            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                        }}
                    />
                    <Tab.Screen
                        name="Appliances"
                        component={Appliances}
                        options={{
                            tabBarIcon: ({ color, size }) => <Zap color={color} size={size} />,
                            title: 'Devices'
                        }}
                    />
                    <Tab.Screen
                        name="Bills"
                        component={BillStack}
                        options={{
                            tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
                            headerShown: false
                        }}
                    />
                    <Tab.Screen
                        name="Budget"
                        component={TrackingStack}
                        options={{
                            tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
                            headerShown: false
                        }}
                    />
                    <Tab.Screen
                        name="Tools"
                        component={TariffCalculator}
                        options={{
                            tabBarIcon: ({ color, size }) => <Calculator color={color} size={size} />,
                            title: 'Calculator'
                        }}
                    />
                </Tab.Navigator>
            ) : (
                <AuthStack />
            )}
        </NavigationContainer>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <PaperProvider theme={theme}>
                <Navigation />
            </PaperProvider>
        </AuthProvider>
    );
}
