import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Auth Screens
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';

// Householder Screens
import { HouseholderDashboard } from '../screens/HouseholderDashboard';
import { SubCategoryScreen } from '../screens/SubCategoryScreen';
import { LocationSelectionScreen } from '../screens/LocationSelectionScreen';
import { AvailableElectriciansScreen } from '../screens/AvailableElectriciansScreen';
import { TrackElectricianScreen } from '../screens/TrackElectricianScreen';
import { RatingScreen } from '../screens/RatingScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ActivitiesScreen } from '../screens/ActivitiesScreen';
import { ActivityDetailScreen } from '../screens/ActivityDetailScreen';

// Electrician Screens
import { ElectricianDashboard } from '../screens/ElectricianDashboard';
import { ElectricianServiceSetupScreen } from '../screens/ElectricianServiceSetupScreen';
import { ElectricianPastActivitiesScreen } from '../screens/ElectricianPastActivitiesScreen';
import { ElectricianEarnedScreen } from '../screens/ElectricianEarnedScreen';

// Shared Screens
import { AccountScreen } from '../screens/AccountScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { AboutUsScreen } from '../screens/AboutUsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = { headerShown: false };

const tabScreenOptions = ({ route }) => ({
    headerShown: false,
    tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        switch (route.name) {
            case 'HomeTab':
                iconName = focused ? 'home' : 'home-outline';
                break;
            case 'ActivitiesTab':
                iconName = focused ? 'list' : 'list-outline';
                break;
            case 'AccountTab':
                iconName = focused ? 'person' : 'person-outline';
                break;
            case 'JobsTab':
                iconName = focused ? 'briefcase' : 'briefcase-outline';
                break;
            case 'PastTab':
                iconName = focused ? 'time' : 'time-outline';
                break;
            case 'EarnedTab':
                iconName = focused ? 'wallet' : 'wallet-outline';
                break;
            default:
                iconName = 'ellipse';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.textMuted,
    tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 8,
        paddingTop: 4,
    },
    tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
    },
});

// ==================
// Householder Stacks
// ==================

const HouseholderHomeStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="HouseholderHome" component={HouseholderDashboard} />
        <Stack.Screen name="SubCategory" component={SubCategoryScreen} />
        <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
        <Stack.Screen name="AvailableElectricians" component={AvailableElectriciansScreen} />
        <Stack.Screen name="TrackElectrician" component={TrackElectricianScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Rating" component={RatingScreen} />
    </Stack.Navigator>
);

const HouseholderActivitiesStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Activities" component={ActivitiesScreen} />
        <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
    </Stack.Navigator>
);

const AccountStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="AboutUs" component={AboutUsScreen} />
    </Stack.Navigator>
);

// Householder Tab Navigator
const HouseholderTabs = () => (
    <Tab.Navigator screenOptions={tabScreenOptions}>
        <Tab.Screen name="HomeTab" component={HouseholderHomeStack} options={{ tabBarLabel: 'Home' }} />
        <Tab.Screen name="ActivitiesTab" component={HouseholderActivitiesStack} options={{ tabBarLabel: 'Activities' }} />
        <Tab.Screen name="AccountTab" component={AccountStack} options={{ tabBarLabel: 'Account' }} />
    </Tab.Navigator>
);

// ====================
// Electrician Stacks
// ====================

const ElectricianJobsStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="ElectricianHome" component={ElectricianDashboard} />
        <Stack.Screen name="ElectricianServiceSetup" component={ElectricianServiceSetupScreen} />
    </Stack.Navigator>
);

const ElectricianPastStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="PastActivities" component={ElectricianPastActivitiesScreen} />
    </Stack.Navigator>
);

const ElectricianEarnedStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Earned" component={ElectricianEarnedScreen} />
    </Stack.Navigator>
);

const ElectricianAccountStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="AboutUs" component={AboutUsScreen} />
    </Stack.Navigator>
);

// Electrician Tab Navigator
const ElectricianTabs = () => (
    <Tab.Navigator screenOptions={tabScreenOptions}>
        <Tab.Screen name="JobsTab" component={ElectricianJobsStack} options={{ tabBarLabel: 'Jobs' }} />
        <Tab.Screen name="PastTab" component={ElectricianPastStack} options={{ tabBarLabel: 'History' }} />
        <Tab.Screen name="EarnedTab" component={ElectricianEarnedStack} options={{ tabBarLabel: 'Earned' }} />
        <Tab.Screen name="AccountTab" component={ElectricianAccountStack} options={{ tabBarLabel: 'Account' }} />
    </Tab.Navigator>
);

// Voice Commander
import { VoiceCommander } from '../components/VoiceCommander';

// ==================
// Root Navigator
// ==================

export const RootNavigator = () => {
    const { user } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={screenOptions}>
                {user ? (
                    user.role === 'Householder' ? (
                        <Stack.Screen name="HouseholderMain" component={HouseholderTabs} />
                    ) : (
                        <Stack.Screen name="ElectricianMain" component={ElectricianTabs} />
                    )
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                    </>
                )}
            </Stack.Navigator>
            {user?.role === 'Householder' && <VoiceCommander />}
        </NavigationContainer>
    );
};
