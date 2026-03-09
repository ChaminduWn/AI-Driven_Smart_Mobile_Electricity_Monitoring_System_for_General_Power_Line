import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { AccountProvider } from './src/contexts/AccountContext';
import { Provider as PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AccountProvider>
        <PaperProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </PaperProvider>
      </AccountProvider>
    </AuthProvider>
  );
}