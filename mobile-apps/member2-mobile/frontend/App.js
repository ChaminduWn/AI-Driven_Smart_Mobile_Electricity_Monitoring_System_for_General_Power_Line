import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation';
import { StatusBar } from 'react-native';
import { theme } from './src/theme';

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
                <RootNavigator />
            </AuthProvider>
        </SafeAreaProvider>
    );
}
