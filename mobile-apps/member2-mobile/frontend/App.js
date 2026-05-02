import './src/polyfills';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation';
import { StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from './src/theme';
import './src/i18n';

export default function App() {
    useEffect(() => {
        const hideSplash = async () => {
            try {
                await SplashScreen.hideAsync();
            } catch (error) {
                console.log('Splash hide error:', error?.message || error);
            }
        };

        const timer = setTimeout(hideSplash, 0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <SafeAreaProvider>
            <AuthProvider>
                <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
                <RootNavigator />
            </AuthProvider>
        </SafeAreaProvider>
    );
}
